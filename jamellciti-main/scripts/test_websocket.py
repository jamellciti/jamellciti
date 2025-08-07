#!/usr/bin/env python3
"""
WebSocket Test Client for Aura Vision
Tests real-time streaming of events, clusters, and work orders
"""

import asyncio
import websockets
import json
from datetime import datetime

async def test_websocket():
    uri = "ws://localhost:8001/ws/live"
    
    print("🔌 Connecting to WebSocket...")
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ Connected to WebSocket!")
            
            # Send a ping
            ping_message = {"type": "ping"}
            await websocket.send(json.dumps(ping_message))
            print("📤 Sent ping")
            
            # Listen for messages for 30 seconds
            timeout = 30
            start_time = asyncio.get_event_loop().time()
            
            while (asyncio.get_event_loop().time() - start_time) < timeout:
                try:
                    message = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                    data = json.loads(message)
                    
                    msg_type = data.get("type", "unknown")
                    timestamp = data.get("timestamp", "")
                    
                    if msg_type == "INITIAL_DATA":
                        initial_data = data.get("data", {})
                        clusters = initial_data.get("clusters", [])
                        work_orders = initial_data.get("work_orders", [])
                        citations = initial_data.get("citations", [])
                        
                        print(f"📊 INITIAL_DATA received:")
                        print(f"   - {len(clusters)} clusters")
                        print(f"   - {len(work_orders)} work orders")
                        print(f"   - {len(citations)} citations")
                        
                    elif msg_type == "pong":
                        print("🏓 Received pong")
                        
                    elif msg_type == "UPSERT_CLUSTER":
                        cluster = data.get("data", {})
                        print(f"🆕 New cluster: {cluster.get('type')} at {cluster.get('lat'):.4f},{cluster.get('lon'):.4f} (severity: {cluster.get('severity')}, count: {cluster.get('count')})")
                        
                    elif msg_type == "UPSERT_WORK_ORDER":
                        wo = data.get("data", {})
                        print(f"🔧 Work order: {wo.get('type')} - {wo.get('status')}")
                        
                    elif msg_type == "UPSERT_CITATION":
                        citation = data.get("data", {})
                        print(f"🎫 Citation: {citation.get('type')} - ${citation.get('fine_amount')}")
                        
                    else:
                        print(f"📩 Message: {msg_type}")
                        
                except asyncio.TimeoutError:
                    # No message received, continue listening
                    continue
                except json.JSONDecodeError as e:
                    print(f"❌ JSON decode error: {e}")
                except Exception as e:
                    print(f"❌ Error: {e}")
                    break
            
            print(f"⏰ Test completed after {timeout} seconds")
            
    except Exception as e:
        print(f"❌ Connection failed: {e}")

if __name__ == "__main__":
    print("🚀 WebSocket Test Client Starting...")
    asyncio.run(test_websocket())