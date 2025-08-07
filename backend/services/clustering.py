import asyncio
import math
from datetime import datetime, timedelta
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)

class EventClusteringService:
    def __init__(self, db):
        self.db = db
        self.cluster_radius_meters = 20  # 20 meter clustering radius
        self.time_window_seconds = 120   # 2 minute time window
    
    def haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate the great circle distance between two points on earth in meters"""
        R = 6371000  # Earth's radius in meters
        
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)
        
        a = (math.sin(delta_phi/2) * math.sin(delta_phi/2) +
             math.cos(phi1) * math.cos(phi2) *
             math.sin(delta_lambda/2) * math.sin(delta_lambda/2))
        
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return R * c
    
    async def cluster_events(self) -> Dict[str, Any]:
        """Main clustering algorithm - spatial and temporal grouping"""
        try:
            # Get recent unprocessed events
            cutoff_time = datetime.utcnow() - timedelta(seconds=self.time_window_seconds * 2)
            
            events = await self.db.events.find({
                "timestamp": {"$gte": cutoff_time},
                "processed": False
            }).sort("timestamp", 1).to_list(1000)
            
            if not events:
                return {"clusters_created": 0, "events_processed": 0}
            
            logger.info(f"🔍 Clustering {len(events)} events...")
            
            clusters = []
            processed_events = set()
            
            for i, event in enumerate(events):
                if event["id"] in processed_events:
                    continue
                
                # Start new cluster with this event
                cluster = {
                    "id": f"cluster_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{i}",
                    "center_lat": event["lat"],
                    "center_lon": event["lon"],
                    "event_ids": [event["id"]],
                    "event_types": [event["type"]],
                    "max_severity": event["severity"],
                    "total_events": 1,
                    "created_at": datetime.utcnow(),
                    "time_window_start": event["timestamp"],
                    "time_window_end": event["timestamp"]
                }
                
                processed_events.add(event["id"])
                
                # Find nearby events in time and space
                for j, other_event in enumerate(events[i+1:], i+1):
                    if other_event["id"] in processed_events:
                        continue
                    
                    # Check time window
                    time_diff = abs((other_event["timestamp"] - event["timestamp"]).total_seconds())
                    if time_diff > self.time_window_seconds:
                        continue
                    
                    # Check spatial distance
                    distance = self.haversine_distance(
                        event["lat"], event["lon"],
                        other_event["lat"], other_event["lon"]
                    )
                    
                    if distance <= self.cluster_radius_meters:
                        # Add to cluster
                        cluster["event_ids"].append(other_event["id"])
                        cluster["event_types"].append(other_event["type"])
                        cluster["max_severity"] = max(cluster["max_severity"], other_event["severity"])
                        cluster["total_events"] += 1
                        
                        # Update time window
                        cluster["time_window_start"] = min(cluster["time_window_start"], other_event["timestamp"])
                        cluster["time_window_end"] = max(cluster["time_window_end"], other_event["timestamp"])
                        
                        # Recalculate cluster center (simple average for now)
                        total_lat = sum(e["lat"] for e in events if e["id"] in cluster["event_ids"])
                        total_lon = sum(e["lon"] for e in events if e["id"] in cluster["event_ids"])
                        cluster["center_lat"] = total_lat / cluster["total_events"]
                        cluster["center_lon"] = total_lon / cluster["total_events"]
                        
                        processed_events.add(other_event["id"])
                
                clusters.append(cluster)
            
            # Store clusters in database
            if clusters:
                await self.db.clusters.insert_many(clusters)
                logger.info(f"📊 Created {len(clusters)} clusters from {len(processed_events)} events")
            
            # Mark events as processed
            if processed_events:
                await self.db.events.update_many(
                    {"id": {"$in": list(processed_events)}},
                    {"$set": {"processed": True}}
                )
            
            return {
                "clusters_created": len(clusters),
                "events_processed": len(processed_events),
                "avg_events_per_cluster": round(len(processed_events) / len(clusters), 2) if clusters else 0
            }
            
        except Exception as e:
            logger.error(f"❌ Clustering error: {e}")
            return {"error": str(e), "clusters_created": 0, "events_processed": 0}

def get_clustering_service(db) -> EventClusteringService:
    """Factory function to create clustering service"""
    return EventClusteringService(db)