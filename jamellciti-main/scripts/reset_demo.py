#!/usr/bin/env python3
"""
Aura Vision Demo Reset Script
Clears demo data and seeds fresh starter events for clean investor presentations
"""

import asyncio
import aiohttp
import json
import random
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os

# Configuration
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "aura_vision"
API_BASE = "http://localhost:8001/api"
DEMO_API_KEY = "aura_c9e8db33e58e4c32"
ADMIN_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiOWExMmU5YmItNGRkLWFmOGItZTY0OTQxYTU4ODgzIiwiZW1haWwiOiJhZG1pbkBhdXJhLnZpc2lvbiIsInJvbGUiOiJhZG1pbiIsImNpdHkiOiJwaG9lbml4IiwiZXhwIjoxNzU0NDIzMDQ3fQ._WX4EkiVlackJ4T3x-jW3Xe16d3-emJzXDWLJ4SppF8"

# Phoenix demo locations (downtown area)
DEMO_LOCATIONS = [
    {"lat": 33.4484, "lon": -112.0740, "name": "Central Phoenix"},
    {"lat": 33.4522, "lon": -112.0764, "name": "Roosevelt Row"},
    {"lat": 33.4506, "lon": -112.0728, "name": "Heritage Square"},
    {"lat": 33.4461, "lon": -112.0722, "name": "Chase Field Area"},
    {"lat": 33.4443, "lon": -112.0679, "name": "Arizona State University"},
    {"lat": 33.4537, "lon": -112.0685, "name": "Steele Indian School Park"},
    {"lat": 33.4589, "lon": -112.0734, "name": "Midtown Phoenix"},
    {"lat": 33.4512, "lon": -112.0801, "name": "CityScape"},
]

# Demo event templates
DEMO_EVENTS = [
    {"type": "pothole", "severity": 4, "score": 0.85},
    {"type": "pothole", "severity": 3, "score": 0.75},
    {"type": "storm_drain_clog", "severity": 3, "score": 0.82},
    {"type": "litter_dumping", "severity": 3, "score": 0.78},
    {"type": "ada_obstruction", "severity": 2, "score": 0.88},
    {"type": "near_miss", "severity": 4, "score": 0.92},
    {"type": "pothole", "severity": 2, "score": 0.65},
    {"type": "litter_dumping", "severity": 1, "score": 0.55},
    {"type": "storm_drain_clog", "severity": 2, "score": 0.70},
    {"type": "ada_obstruction", "severity": 4, "score": 0.95},
]

class DemoReset:
    def __init__(self):
        self.client = None
        self.db = None
        self.session = None

    async def __aenter__(self):
        # Connect to MongoDB
        self.client = AsyncIOMotorClient(MONGO_URL)
        self.db = self.client[DB_NAME]
        
        # HTTP session for API calls
        self.session = aiohttp.ClientSession()
        
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.client:
            self.client.close()
        if self.session:
            await self.session.close()

    async def clear_demo_data(self):
        """Clear all demo data from collections"""
        print("🧹 Clearing existing demo data...")
        
        collections = ['events', 'event_clusters', 'work_orders', 'citations']
        cleared_counts = {}
        
        for collection_name in collections:
            collection = self.db[collection_name]
            result = await collection.delete_many({})
            cleared_counts[collection_name] = result.deleted_count
            print(f"   • {collection_name}: {result.deleted_count} records cleared")
        
        return cleared_counts

    async def seed_starter_events(self, count=20):
        """Seed starter events for demo"""
        print(f"🌱 Seeding {count} starter events...")
        
        headers = {
            "X-API-Key": DEMO_API_KEY,
            "Content-Type": "application/json"
        }
        
        events_created = 0
        events_failed = 0
        
        for i in range(count):
            # Select random location and event template
            location = random.choice(DEMO_LOCATIONS)
            event_template = random.choice(DEMO_EVENTS)
            
            # Add small random variation to location
            lat_variation = random.uniform(-0.0005, 0.0005)  # ~50m variation
            lon_variation = random.uniform(-0.0005, 0.0005)
            
            # Create event with timestamp spread over last 2 hours
            timestamp_offset = random.randint(0, 7200)  # 0-2 hours ago
            
            event_data = {
                "type": event_template["type"],
                "lat": round(location["lat"] + lat_variation, 6),
                "lon": round(location["lon"] + lon_variation, 6),
                "severity": event_template["severity"],
                "score": event_template["score"] + random.uniform(-0.1, 0.1),
                "city": "phoenix",
                "device_id": f"demo-device-{random.randint(1, 20):03d}"
            }
            
            try:
                async with self.session.post(f"{API_BASE}/ingest/events", 
                                           json=event_data, headers=headers) as response:
                    if response.status == 200:
                        result = await response.json()
                        events_created += 1
                        print(f"   ✅ Event {i+1}: {event_data['type']} at {location['name']}")
                    else:
                        events_failed += 1
                        print(f"   ❌ Event {i+1} failed: {response.status}")
            except Exception as e:
                events_failed += 1
                print(f"   ❌ Event {i+1} failed: {e}")
                
            # Small delay between events
            await asyncio.sleep(0.2)
        
        print(f"📊 Seeding complete: {events_created} created, {events_failed} failed")
        return events_created, events_failed

    async def trigger_clustering(self):
        """Trigger clustering to process seeded events"""
        print("🔄 Triggering event clustering...")
        
        headers = {
            "Authorization": f"Bearer {ADMIN_TOKEN}",
            "Content-Type": "application/json"
        }
        
        try:
            async with self.session.post(f"{API_BASE}/clustering/run", headers=headers) as response:
                if response.status == 200:
                    result = await response.json()
                    stats = result.get("stats", {})
                    print(f"   ✅ Clustering completed:")
                    print(f"      • Events processed: {stats.get('events_processed', 0)}")
                    print(f"      • New clusters: {stats.get('new_clusters', 0)}")
                    print(f"      • Merged events: {stats.get('merged_events', 0)}")
                    print(f"      • Processing time: {stats.get('processing_time_ms', 0)}ms")
                    return stats
                else:
                    print(f"   ❌ Clustering failed: {response.status}")
                    return None
        except Exception as e:
            print(f"   ❌ Clustering error: {e}")
            return None

    async def get_demo_summary(self):
        """Get summary of demo data after reset"""
        print("📊 Demo data summary:")
        
        headers = {
            "Authorization": f"Bearer {ADMIN_TOKEN}",
            "Content-Type": "application/json"
        }
        
        try:
            async with self.session.get(f"{API_BASE}/kpis", headers=headers) as response:
                if response.status == 200:
                    kpis = await response.json()
                    print(f"   • Events today: {kpis['events_today']}")
                    print(f"   • Work orders: {kpis['work_orders_open']} open")
                    print(f"   • Citations: {kpis['citations_issued']} issued")
                    print(f"   • Total fines: ${kpis['total_fine_value']:,.2f}")
                    print(f"   • Grant potential: ${kpis['grant_potential']:,.2f}")
                    return kpis
                else:
                    print(f"   ❌ Failed to get KPIs: {response.status}")
                    return None
        except Exception as e:
            print(f"   ❌ KPIs error: {e}")
            return None

    async def reset_demo(self):
        """Complete demo reset workflow"""
        print("🎬 AURA VISION DEMO RESET")
        print("========================")
        print("")
        
        # Clear existing data
        cleared = await self.clear_demo_data()
        
        # Wait for cleanup
        await asyncio.sleep(2)
        
        # Seed new events
        created, failed = await self.seed_starter_events(20)
        
        # Wait for events to be processed
        await asyncio.sleep(3)
        
        # Trigger clustering
        clustering_stats = await self.trigger_clustering()
        
        # Wait for clustering to complete
        await asyncio.sleep(2)
        
        # Get final summary
        final_kpis = await self.get_demo_summary()
        
        print("")
        print("✨ DEMO RESET COMPLETE!")
        print("======================")
        print("")
        print("🎯 Demo is ready for investor presentation:")
        print("   • Fresh data seeded across Phoenix downtown")
        print("   • Events clustered and processed")
        print("   • Work orders and citations generated")
        print("   • KPIs calculated and ready")
        print("")
        print("🔗 Next steps:")
        print("   1. Open http://localhost:3000")
        print("   2. Login: admin@aura.vision / demo123")
        print("   3. Navigate through Live Map → KPIs → Work Orders")
        print("   4. Start event simulator for live demo")
        print("")
        print("🚀 Ready for showtime! 🎉")

async def main():
    try:
        async with DemoReset() as demo:
            await demo.reset_demo()
    except KeyboardInterrupt:
        print("\n🛑 Demo reset cancelled by user")
    except Exception as e:
        print(f"\n❌ Demo reset failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())