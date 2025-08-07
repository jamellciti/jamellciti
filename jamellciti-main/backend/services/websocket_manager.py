"""
Aura Vision WebSocket Connection Manager
Handles real-time streaming of events, clusters, and work order updates
Optimized with MongoDB change streams and heartbeat management
"""

import asyncio
import json
import logging
from typing import List, Dict, Set
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect
from motor.motor_asyncio import AsyncIOMotorDatabase
import time

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.connection_info: Dict[WebSocket, Dict] = {}
        self.heartbeat_tasks: Dict[WebSocket, asyncio.Task] = {}
        self.change_stream_task: asyncio.Task = None
        self.db: AsyncIOMotorDatabase = None
        
    async def initialize_change_streams(self, db: AsyncIOMotorDatabase):
        """Initialize MongoDB change streams for real-time updates"""
        self.db = db
        if self.change_stream_task is None:
            self.change_stream_task = asyncio.create_task(self._monitor_changes())
            logger.info("📡 MongoDB change streams initialized")

    async def broadcast_video_review_update(self, video_review: dict):
        """Broadcast video review updates to all connected clients"""
        message = {
            "type": "UPSERT_VIDEO_REVIEW",
            "data": video_review,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast(message)

    async def _monitor_changes(self):
        """Monitor MongoDB change streams and broadcast updates"""
        try:
            # Monitor event_clusters collection
            clusters_pipeline = [
                {"$match": {"operationType": {"$in": ["insert", "update"]}}}
            ]
            
            # Monitor work_orders collection
            work_orders_pipeline = [
                {"$match": {"operationType": {"$in": ["insert", "update"]}}}
            ]
            
            # Monitor citations collection  
            citations_pipeline = [
                {"$match": {"operationType": {"$in": ["insert", "update"]}}}
            ]
            
            # Monitor video_reviews collection
            video_reviews_pipeline = [
                {"$match": {"operationType": {"$in": ["insert", "update"]}}}
            ]
            
            async def watch_clusters():
                async with self.db.event_clusters.watch(clusters_pipeline, full_document='updateLookup') as stream:
                    async for change in stream:
                        if change['operationType'] in ['insert', 'update']:
                            cluster = change.get('fullDocument')
                            if cluster:
                                await self.broadcast_new_cluster(cluster)
            
            async def watch_work_orders():
                async with self.db.work_orders.watch(work_orders_pipeline, full_document='updateLookup') as stream:
                    async for change in stream:
                        if change['operationType'] in ['insert', 'update']:
                            work_order = change.get('fullDocument')
                            if work_order:
                                await self.broadcast_work_order_update(work_order)
            
            async def watch_citations():
                async with self.db.citations.watch(citations_pipeline, full_document='updateLookup') as stream:
                    async for change in stream:
                        if change['operationType'] in ['insert', 'update']:
                            citation = change.get('fullDocument')
                            if citation:
                                await self.broadcast_citation_update(citation)
            
            async def watch_video_reviews():
                async with self.db.video_reviews.watch(video_reviews_pipeline, full_document='updateLookup') as stream:
                    async for change in stream:
                        if change['operationType'] in ['insert', 'update']:
                            video_review = change.get('fullDocument')
                            if video_review:
                                await self.broadcast_video_review_update(video_review)
            
            # Run all change stream watchers concurrently
            await asyncio.gather(
                watch_clusters(),
                watch_work_orders(), 
                watch_citations(),
                watch_video_reviews(),
                return_exceptions=True
            )
            
        except Exception as e:
            logger.error(f"❌ Change stream monitoring failed: {e}")

    async def connect(self, websocket: WebSocket, user_info: Dict = None):
        """Accept a new WebSocket connection with heartbeat"""
        await websocket.accept()
        self.active_connections.append(websocket)
        self.connection_info[websocket] = {
            "connected_at": datetime.utcnow(),
            "user_info": user_info or {},
            "message_count": 0,
            "last_ping": time.time()
        }
        
        # Start heartbeat task
        self.heartbeat_tasks[websocket] = asyncio.create_task(self._heartbeat_loop(websocket))
        
        logger.info(f"🔌 WebSocket connected with heartbeat. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection and cleanup"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        
        if websocket in self.connection_info:
            del self.connection_info[websocket]
            
        if websocket in self.heartbeat_tasks:
            self.heartbeat_tasks[websocket].cancel()
            del self.heartbeat_tasks[websocket]
            
        logger.info(f"🔌 WebSocket disconnected. Active connections: {len(self.active_connections)}")

    async def _heartbeat_loop(self, websocket: WebSocket):
        """Send periodic heartbeat pings to keep connection alive"""
        try:
            while websocket in self.active_connections:
                await asyncio.sleep(30)  # 30-second heartbeat
                
                if websocket in self.active_connections:
                    try:
                        ping_message = {
                            "type": "ping",
                            "timestamp": datetime.utcnow().isoformat()
                        }
                        await websocket.send_text(json.dumps(ping_message))
                        
                        if websocket in self.connection_info:
                            self.connection_info[websocket]["last_ping"] = time.time()
                            
                    except Exception as e:
                        logger.warning(f"⚠️ Heartbeat failed, disconnecting: {e}")
                        self.disconnect(websocket)
                        break
                        
        except asyncio.CancelledError:
            logger.debug("Heartbeat task cancelled")
        except Exception as e:
            logger.error(f"❌ Heartbeat loop error: {e}")

    async def send_personal_message(self, message: Dict, websocket: WebSocket):
        """Send a message to a specific WebSocket connection"""
        try:
            # Add timestamp and ensure message size is reasonable
            message["timestamp"] = message.get("timestamp", datetime.utcnow().isoformat())
            message_text = json.dumps(message)
            
            # Check message size (target <2KB)
            if len(message_text) > 2048:
                logger.warning(f"⚠️ Large WebSocket message: {len(message_text)} bytes")
            
            await websocket.send_text(message_text)
            
            if websocket in self.connection_info:
                self.connection_info[websocket]["message_count"] += 1
                
        except Exception as e:
            logger.error(f"❌ Error sending personal message: {e}")
            self.disconnect(websocket)

    async def broadcast(self, message: Dict):
        """Broadcast a message to all connected clients with latency tracking"""
        if not self.active_connections:
            return
            
        start_time = time.time()
        message["timestamp"] = message.get("timestamp", datetime.utcnow().isoformat())
        message_text = json.dumps(message)
        
        # Check message size
        if len(message_text) > 2048:
            logger.warning(f"⚠️ Large broadcast message: {len(message_text)} bytes")
        
        disconnected = []
        successful_sends = 0
        
        for connection in self.active_connections:
            try:
                await connection.send_text(message_text)
                successful_sends += 1
                
                if connection in self.connection_info:
                    self.connection_info[connection]["message_count"] += 1
                    
            except Exception as e:
                logger.warning(f"⚠️ Connection error, will disconnect: {e}")
                disconnected.append(connection)
        
        # Clean up failed connections
        for connection in disconnected:
            self.disconnect(connection)
        
        # Log broadcast performance
        broadcast_time = (time.time() - start_time) * 1000  # Convert to ms
        
        if successful_sends > 0:
            logger.debug(f"📡 Broadcast: {successful_sends} clients, {broadcast_time:.1f}ms latency")
            
            # Warn if latency is high
            if broadcast_time > 500:
                logger.warning(f"⚠️ High broadcast latency: {broadcast_time:.1f}ms")

    async def send_initial_data(self, websocket: WebSocket, db: AsyncIOMotorDatabase):
        """Send initial data when client connects with performance tracking"""
        start_time = time.time()
        
        try:
            # Get recent clusters (last 100)
            clusters = await db.event_clusters.find({}).sort("updated_at", -1).limit(100).to_list(100)
            
            # Get open work orders
            work_orders = await db.work_orders.find({
                "status": {"$in": ["open", "in_progress"]}
            }).sort("created_at", -1).to_list(50)
            
            # Get recent citations
            citations = await db.citations.find({}).sort("created_at", -1).limit(50).to_list(50)
            
            initial_message = {
                "type": "INITIAL_DATA",
                "data": {
                    "clusters": [self._format_cluster(c) for c in clusters],
                    "work_orders": [self._format_work_order(wo) for wo in work_orders],
                    "citations": [self._format_citation(c) for c in citations]
                },
                "timestamp": datetime.utcnow().isoformat()
            }
            
            await self.send_personal_message(initial_message, websocket)
            
            # Log performance
            load_time = (time.time() - start_time) * 1000
            logger.info(f"📊 Initial data sent: {len(clusters)} clusters, {len(work_orders)} work orders, {len(citations)} citations ({load_time:.1f}ms)")
            
        except Exception as e:
            logger.error(f"❌ Error sending initial data: {e}")

    def _format_cluster(self, cluster: Dict) -> Dict:
        """Format cluster data for WebSocket transmission"""
        return {
            "id": cluster["id"],
            "type": cluster["type"],
            "lat": cluster["lat"],
            "lon": cluster["lon"],
            "severity": cluster["severity"],
            "count": cluster["count"],
            "ts": cluster["ts"].isoformat() if isinstance(cluster["ts"], datetime) else cluster["ts"],
            "updated_at": cluster["updated_at"].isoformat() if isinstance(cluster["updated_at"], datetime) else cluster["updated_at"],
            "city": cluster.get("city", "phoenix")
        }

    def _format_work_order(self, work_order: Dict) -> Dict:
        """Format work order data for WebSocket transmission"""
        return {
            "id": work_order["id"],
            "event_id": work_order.get("event_id", ""),
            "type": work_order["type"],
            "description": work_order["description"],
            "status": work_order["status"],
            "created_at": work_order["created_at"].isoformat() if isinstance(work_order["created_at"], datetime) else work_order["created_at"],
            "updated_at": work_order["updated_at"].isoformat() if isinstance(work_order["updated_at"], datetime) else work_order["updated_at"],
            "estimated_sla_hours": work_order.get("estimated_sla_hours", 48)
        }

    def _format_citation(self, citation: Dict) -> Dict:
        """Format citation data for WebSocket transmission"""
        return {
            "id": citation["id"],
            "event_id": citation.get("event_id", ""),
            "type": citation["type"],
            "description": citation["description"],
            "fine_amount": citation["fine_amount"],
            "status": citation["status"],
            "created_at": citation["created_at"].isoformat() if isinstance(citation["created_at"], datetime) else citation["created_at"]
        }

    async def broadcast_new_cluster(self, cluster: Dict):
        """Broadcast a new or updated cluster"""
        message = {
            "type": "UPSERT_CLUSTER",
            "data": self._format_cluster(cluster),
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast(message)

    async def broadcast_work_order_update(self, work_order: Dict):
        """Broadcast work order creation or update"""
        message = {
            "type": "UPSERT_WORK_ORDER",
            "data": self._format_work_order(work_order),
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast(message)

    async def broadcast_citation_update(self, citation: Dict):
        """Broadcast citation creation or update"""
        message = {
            "type": "UPSERT_CITATION",
            "data": self._format_citation(citation),
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast(message)

    def get_connection_stats(self) -> Dict:
        """Get statistics about active connections"""
        current_time = time.time()
        
        return {
            "active_connections": len(self.active_connections),
            "total_messages_sent": sum(
                info.get("message_count", 0) 
                for info in self.connection_info.values()
            ),
            "heartbeat_status": {
                conn_id: {
                    "last_ping_seconds_ago": round(current_time - info.get("last_ping", current_time)),
                    "messages_sent": info.get("message_count", 0)
                }
                for conn_id, info in enumerate(self.connection_info.values())
            },
            "change_streams_active": self.change_stream_task is not None and not self.change_stream_task.done()
        }

    async def cleanup(self):
        """Cleanup resources on shutdown"""
        # Cancel all heartbeat tasks
        for task in self.heartbeat_tasks.values():
            task.cancel()
        
        # Cancel change stream monitoring
        if self.change_stream_task:
            self.change_stream_task.cancel()
        
        logger.info("🧹 WebSocket manager cleanup completed")

# Global connection manager instance
connection_manager = ConnectionManager()