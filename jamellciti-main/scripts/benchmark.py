#!/usr/bin/env python3
"""
Aura Vision Performance Benchmark
Tests clustering performance, WebSocket latency, and real-time marker merging
"""

import asyncio
import aiohttp
import websockets
import json
import time
from datetime import datetime
import random

# Test configuration
BACKEND_URL = "http://localhost:8001"
WS_URL = "ws://localhost:8001/ws/live"
API_KEY = "aura_c9e8db33e58e4c32"

class PerformanceBenchmark:
    def __init__(self):
        self.session = None
        self.ws_connection = None
        self.received_messages = []
        self.latency_measurements = []
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def create_clustered_events(self, base_lat=33.4550, base_lon=-112.0800, count=5):
        """Create events that should cluster together (within 20m radius)"""
        events = []
        
        for i in range(count):
            # Create events within ~10-15 meters of each other
            lat_offset = random.uniform(-0.0001, 0.0001)  # ~10m variation
            lon_offset = random.uniform(-0.0001, 0.0001)
            
            event = {
                "type": "pothole",
                "lat": base_lat + lat_offset,
                "lon": base_lon + lon_offset,
                "severity": random.randint(3, 5),  # High severity to trigger work orders
                "score": random.uniform(0.7, 0.9),
                "city": "phoenix",
                "device_id": f"benchmark-device-{i+1:03d}"
            }
            events.append(event)
            
        return events

    async def send_event_batch(self, events):
        """Send a batch of events and measure response times"""
        headers = {
            "X-API-Key": API_KEY,
            "Content-Type": "application/json"
        }
        
        results = []
        for event in events:
            start_time = time.time()
            
            async with self.session.post(f"{BACKEND_URL}/api/ingest/events", 
                                       json=event, headers=headers) as response:
                if response.status == 200:
                    result = await response.json()
                    latency = (time.time() - start_time) * 1000  # ms
                    
                    results.append({
                        "event_id": result["event_id"],
                        "latency_ms": round(latency, 2),
                        "actions": result["actions"]
                    })
                else:
                    print(f"❌ Event failed: {response.status}")
                    
        return results

    async def monitor_websocket_updates(self, duration=30):
        """Monitor WebSocket for real-time updates and measure latency"""
        print(f"🔌 Connecting to WebSocket for {duration}s monitoring...")
        
        try:
            async with websockets.connect(WS_URL) as websocket:
                self.ws_connection = websocket
                
                # Track messages
                start_time = time.time()
                cluster_updates = []
                work_order_updates = []
                
                while (time.time() - start_time) < duration:
                    try:
                        message = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                        data = json.loads(message)
                        
                        msg_type = data.get("type")
                        timestamp = data.get("timestamp")
                        
                        if msg_type == "INITIAL_DATA":
                            initial_data = data.get("data", {})
                            print(f"📊 Initial data: {len(initial_data.get('clusters', []))} clusters, "
                                  f"{len(initial_data.get('work_orders', []))} work orders")
                            
                        elif msg_type == "UPSERT_CLUSTER":
                            cluster = data.get("data", {})
                            cluster_updates.append({
                                "timestamp": timestamp,
                                "cluster_id": cluster.get("id"),
                                "count": cluster.get("count"),
                                "severity": cluster.get("severity"),
                                "type": cluster.get("type")
                            })
                            print(f"🆕 Cluster update: {cluster.get('type')} count={cluster.get('count')} severity={cluster.get('severity')}")
                            
                        elif msg_type == "UPSERT_WORK_ORDER":
                            wo = data.get("data", {})
                            work_order_updates.append({
                                "timestamp": timestamp,
                                "work_order_id": wo.get("id"),
                                "status": wo.get("status"),
                                "type": wo.get("type")
                            })
                            print(f"🔧 Work order: {wo.get('type')} - {wo.get('status')}")
                            
                        elif msg_type == "ping":
                            # Measure ping/pong latency
                            pong_start = time.time()
                            await websocket.send(json.dumps({"type": "pong"}))
                            ping_latency = (time.time() - pong_start) * 1000
                            self.latency_measurements.append(ping_latency)
                            print(f"🏓 Ping/pong latency: {ping_latency:.1f}ms")
                            
                    except asyncio.TimeoutError:
                        continue
                    except json.JSONDecodeError:
                        continue
                
                return {
                    "cluster_updates": cluster_updates,
                    "work_order_updates": work_order_updates,
                    "avg_ping_latency": sum(self.latency_measurements) / len(self.latency_measurements) if self.latency_measurements else 0
                }
                
        except Exception as e:
            print(f"❌ WebSocket error: {e}")
            return {}

    async def trigger_clustering(self):
        """Manually trigger clustering and get performance stats"""
        headers = {"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiOWExMmU5YmItZjNiNC00NGRkLWFmOGItZTY0OTQxYTU4ODgzIiwiZW1haWwiOiJhZG1pbkBhdXJhLnZpc2lvbiIsInJvbGUiOiJhZG1pbiIsImNpdHkiOiJwaG9lbml4IiwiZXhwIjoxNzU0NDIzMDQ3fQ._WX4EkiVlackJ4T3x-jW3Xe16d3-emJzXDWLJ4SppF8"}
        
        async with self.session.post(f"{BACKEND_URL}/api/clustering/run", headers=headers) as response:
            if response.status == 200:
                result = await response.json()
                return result["stats"]
            else:
                print(f"❌ Clustering trigger failed: {response.status}")
                return {}

    async def run_full_benchmark(self):
        """Run comprehensive performance benchmark"""
        print("🚀 Starting Aura Vision Performance Benchmark")
        print("=" * 60)
        
        # 1. Test event ingestion performance
        print("\n📊 Phase 1: Event Ingestion Performance")
        events = await self.create_clustered_events(count=8)
        
        ingestion_start = time.time()
        ingestion_results = await self.send_event_batch(events)
        ingestion_time = (time.time() - ingestion_start) * 1000
        
        avg_ingestion_latency = sum(r["latency_ms"] for r in ingestion_results) / len(ingestion_results)
        print(f"✅ Ingested {len(events)} events in {ingestion_time:.1f}ms")
        print(f"📈 Average ingestion latency: {avg_ingestion_latency:.1f}ms per event")
        
        # 2. Test clustering performance
        print("\n📊 Phase 2: Clustering Performance")
        await asyncio.sleep(2)  # Let events settle
        
        clustering_stats = await self.trigger_clustering()
        if clustering_stats:
            events_processed = clustering_stats.get("events_processed", 0)
            processing_time = clustering_stats.get("processing_time_ms", 0)
            new_clusters = clustering_stats.get("new_clusters", 0)
            merged_events = clustering_stats.get("merged_events", 0)
            
            print(f"✅ Processed {events_processed} events in {processing_time}ms")
            print(f"📍 Created {new_clusters} new clusters, merged {merged_events} events")
            
            if events_processed > 0 and processing_time > 0:
                events_per_sec = events_processed / (processing_time / 1000)
                print(f"⚡ Processing rate: {events_per_sec:.1f} events/second")
                
                # Check against 150ms per 1000 events target
                projected_1000_time = (1000 / events_per_sec) * 1000  # ms
                print(f"📊 Projected time for 1000 events: {projected_1000_time:.1f}ms (target: <150ms)")
                
                if projected_1000_time < 150:
                    print("🎯 ✅ PERFORMANCE TARGET MET!")
                else:
                    print("⚠️ Performance target missed")
        
        # 3. Test WebSocket real-time performance
        print("\n📊 Phase 3: WebSocket Real-time Performance")
        
        # Start WebSocket monitoring in background
        ws_task = asyncio.create_task(self.monitor_websocket_updates(20))
        
        # Give WebSocket time to connect
        await asyncio.sleep(2)
        
        # Generate more events to trigger real-time updates
        print("🔄 Generating events for real-time monitoring...")
        realtime_events = await self.create_clustered_events(base_lat=33.4500, base_lon=-112.0750, count=3)
        await self.send_event_batch(realtime_events)
        
        # Wait for WebSocket monitoring to complete
        ws_results = await ws_task
        
        if ws_results:
            print(f"📡 WebSocket monitoring results:")
            print(f"   - Cluster updates: {len(ws_results.get('cluster_updates', []))}")
            print(f"   - Work order updates: {len(ws_results.get('work_order_updates', []))}")
            
            avg_ping = ws_results.get("avg_ping_latency", 0)
            if avg_ping > 0:
                print(f"🏓 Average ping latency: {avg_ping:.1f}ms")
                
                if avg_ping < 500:
                    print("🎯 ✅ WEBSOCKET LATENCY TARGET MET (<500ms)!")
                else:
                    print("⚠️ WebSocket latency target missed")
        
        print("\n🎉 Benchmark Complete!")
        print("=" * 60)

async def main():
    async with PerformanceBenchmark() as benchmark:
        await benchmark.run_full_benchmark()

if __name__ == "__main__":
    asyncio.run(main())