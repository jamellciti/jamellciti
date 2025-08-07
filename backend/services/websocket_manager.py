import json
import logging
from typing import List
from fastapi import WebSocket

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"🔌 WebSocket connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"🔌 WebSocket disconnected. Total connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"❌ Error sending personal message: {e}")
            self.disconnect(websocket)
    
    async def broadcast(self, message: str):
        """Broadcast message to all connected clients"""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"❌ Error broadcasting to connection: {e}")
                disconnected.append(connection)
        
        # Clean up disconnected clients
        for connection in disconnected:
            self.disconnect(connection)
    
    async def broadcast_event_update(self, event_data: dict):
        """Broadcast new event to all clients"""
        message = json.dumps({
            "type": "event_update",
            "data": event_data
        })
        await self.broadcast(message)
    
    async def broadcast_work_order_update(self, work_order_data: dict):
        """Broadcast work order update to all clients"""
        message = json.dumps({
            "type": "work_order_update", 
            "data": work_order_data
        })
        await self.broadcast(message)
    
    async def broadcast_citation_update(self, citation_data: dict):
        """Broadcast citation update to all clients"""
        message = json.dumps({
            "type": "citation_update",
            "data": citation_data
        })
        await self.broadcast(message)
    
    async def broadcast_video_review_update(self, video_review_data: dict):
        """Broadcast video review update to all clients"""
        message = json.dumps({
            "type": "video_review_update",
            "data": video_review_data
        })
        await self.broadcast(message)
    
    async def broadcast_cluster_update(self, cluster_data: dict):
        """Broadcast cluster update to all clients"""
        message = json.dumps({
            "type": "cluster_update",
            "data": cluster_data
        })
        await self.broadcast(message)

# Global connection manager instance
connection_manager = ConnectionManager()