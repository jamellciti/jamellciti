"""
Aura Vision Event Clustering Service
Spatial and temporal clustering of events to reduce noise and group related incidents
Optimized with GeoJSON storage and 2dsphere indexing for production performance
"""

import asyncio
import logging
import time
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import uuid
from geopy.distance import distance
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

# Clustering parameters
CLUSTER_WINDOW_SECONDS = 120  # 2 minutes
CLUSTER_RADIUS_METERS = 20    # 20 meters
CLUSTER_BATCH_SIZE = 100      # Process events in batches

class EventClusteringService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        
    async def create_indexes(self):
        """Create necessary database indexes for efficient clustering"""
        try:
            # 2dsphere index for clusters with GeoJSON location
            await self.db.event_clusters.create_index([
                ("location", "2dsphere"),
                ("type", 1),
                ("ts", 1)
            ])
            
            # Compound index on events for clustering queries
            await self.db.events.create_index([
                ("cluster_id", 1),
                ("timestamp", 1),
                ("type", 1),
                ("processed", 1)
            ])
            
            # Index for change streams
            await self.db.event_clusters.create_index([("updated_at", 1)])
            await self.db.work_orders.create_index([("updated_at", 1)])
            await self.db.citations.create_index([("created_at", 1)])
            
            logger.info("✅ Optimized clustering indexes created successfully")
        except Exception as e:
            logger.error(f"❌ Error creating indexes: {e}")

    def _coords_to_geojson(self, lat: float, lon: float) -> Dict:
        """Convert lat/lon to GeoJSON Point format"""
        return {
            "type": "Point",
            "coordinates": [lon, lat]  # GeoJSON uses [longitude, latitude]
        }

    def _geojson_to_coords(self, geojson: Dict) -> tuple:
        """Convert GeoJSON Point to (lat, lon) tuple"""
        coords = geojson.get("coordinates", [0, 0])
        return (coords[1], coords[0])  # Return as (lat, lon)

    async def cluster_events(self, now: Optional[datetime] = None) -> Dict[str, int]:
        """
        Main clustering algorithm - groups nearby events in time and space
        Optimized with performance monitoring and GeoJSON spatial queries
        """
        start_time = time.time()
        
        if now is None:
            now = datetime.utcnow()
            
        window_start = now - timedelta(seconds=CLUSTER_WINDOW_SECONDS)
        
        stats = {
            "events_processed": 0,
            "new_clusters": 0,
            "merged_events": 0,
            "errors": 0,
            "processing_time_ms": 0
        }
        
        try:
            # Find unprocessed events within the time window
            query = {
                "$or": [
                    {"cluster_id": {"$exists": False}},
                    {"cluster_id": None}
                ],
                "timestamp": {"$gte": window_start, "$lte": now},
                "processed": True  # Only cluster already processed events
            }
            
            unclustered_events = await self.db.events.find(query).limit(CLUSTER_BATCH_SIZE).to_list(CLUSTER_BATCH_SIZE)
            
            if not unclustered_events:
                logger.debug("No unclustered events found")
                return stats
            
            logger.info(f"🔄 Processing {len(unclustered_events)} unclustered events")
            
            for event in unclustered_events:
                try:
                    stats["events_processed"] += 1
                    cluster_result = await self._process_single_event_optimized(event, window_start, now)
                    
                    if cluster_result["action"] == "new_cluster":
                        stats["new_clusters"] += 1
                    elif cluster_result["action"] == "merged":
                        stats["merged_events"] += 1
                        
                except Exception as e:
                    logger.error(f"Error processing event {event.get('id', 'unknown')}: {e}")
                    stats["errors"] += 1
            
            # Calculate performance metrics
            processing_time = (time.time() - start_time) * 1000  # Convert to milliseconds
            stats["processing_time_ms"] = round(processing_time, 2)
            
            # Log performance warning if too slow
            events_per_second = len(unclustered_events) / (processing_time / 1000) if processing_time > 0 else 0
            if processing_time > 150 and len(unclustered_events) >= 10:
                logger.warning(f"⚠️ Clustering performance: {processing_time:.1f}ms for {len(unclustered_events)} events ({events_per_second:.1f} events/sec)")
            else:
                logger.info(f"📊 Clustering performance: {processing_time:.1f}ms for {len(unclustered_events)} events ({events_per_second:.1f} events/sec)")
            
            logger.info(f"📊 Clustering stats: {stats}")
            return stats
            
        except Exception as e:
            logger.error(f"❌ Clustering operation failed: {e}")
            stats["errors"] += 1
            stats["processing_time_ms"] = round((time.time() - start_time) * 1000, 2)
            return stats

    async def _process_single_event_optimized(self, event: Dict, window_start: datetime, window_end: datetime) -> Dict[str, str]:
        """Process a single event for clustering using optimized geospatial queries"""
        event_time = event["timestamp"]
        event_type = event["type"]
        event_lat = event["lat"] 
        event_lon = event["lon"]
        event_severity = event["severity"]
        
        # Use GeoJSON for spatial queries
        event_location = self._coords_to_geojson(event_lat, event_lon)
        
        # Optimized geospatial query using $geoWithin and $centerSphere
        # $centerSphere takes [longitude, latitude, radius_in_radians]
        # radius_in_radians = radius_in_meters / earth_radius_in_meters
        radius_radians = CLUSTER_RADIUS_METERS / 6378100.0  # Earth radius in meters
        
        cluster_query = {
            "type": event_type,
            "ts": {
                "$gte": event_time - timedelta(seconds=CLUSTER_WINDOW_SECONDS),
                "$lte": event_time + timedelta(seconds=CLUSTER_WINDOW_SECONDS)
            },
            "location": {
                "$geoWithin": {
                    "$centerSphere": [[event_lon, event_lat], radius_radians]
                }
            }
        }
        
        existing_clusters = await self.db.event_clusters.find(cluster_query).limit(10).to_list(10)
        
        if existing_clusters:
            # Merge into the first (most recent) matching cluster
            cluster = existing_clusters[0]
            await self._merge_event_into_cluster(event, cluster)
            return {"action": "merged", "cluster_id": cluster["id"]}
        else:
            # No nearby cluster found - create new cluster
            cluster_id = await self._create_new_cluster_geojson(event)
            return {"action": "new_cluster", "cluster_id": cluster_id}

    async def _merge_event_into_cluster(self, event: Dict, cluster: Dict):
        """Merge an event into an existing cluster"""
        cluster_id = cluster["id"]
        
        # Update cluster with max severity and increment count
        update_operations = {
            "$max": {"severity": event["severity"]},
            "$inc": {"count": 1},
            "$set": {"updated_at": event["timestamp"]}
        }
        
        # Update the cluster
        await self.db.event_clusters.update_one(
            {"id": cluster_id},
            update_operations
        )
        
        # Mark event as clustered
        await self.db.events.update_one(
            {"id": event["id"]},
            {"$set": {"cluster_id": cluster_id}}
        )
        
        logger.debug(f"📍 Event {event['id']} merged into cluster {cluster_id}")

    async def _create_new_cluster_geojson(self, event: Dict) -> str:
        """Create a new cluster from an event using GeoJSON format"""
        cluster_id = str(uuid.uuid4())
        
        cluster_doc = {
            "id": cluster_id,
            "type": event["type"],
            "lat": event["lat"],      # Keep for backward compatibility
            "lon": event["lon"],      # Keep for backward compatibility
            "location": self._coords_to_geojson(event["lat"], event["lon"]),  # GeoJSON for spatial queries
            "severity": event["severity"],
            "count": 1,
            "ts": event["timestamp"],
            "created_at": event["timestamp"],
            "updated_at": event["timestamp"],
            "city": event.get("city", "phoenix")
        }
        
        # Insert new cluster
        await self.db.event_clusters.insert_one(cluster_doc)
        
        # Mark event as clustered
        await self.db.events.update_one(
            {"id": event["id"]},
            {"$set": {"cluster_id": cluster_id}}
        )
        
        logger.debug(f"🆕 Created new cluster {cluster_id} for {event['type']} with GeoJSON location")
        return cluster_id

    async def get_active_clusters(self, hours_back: int = 24) -> List[Dict]:
        """Get active clusters for dashboard display"""
        cutoff_time = datetime.utcnow() - timedelta(hours=hours_back)
        
        clusters = await self.db.event_clusters.find({
            "updated_at": {"$gte": cutoff_time}
        }).sort("updated_at", -1).to_list(1000)
        
        # Convert ObjectId to string for JSON serialization
        for cluster in clusters:
            if "_id" in cluster:
                cluster["_id"] = str(cluster["_id"])
        
        return clusters

    async def cleanup_old_clusters(self, days_old: int = 7):
        """Clean up old clusters to prevent database growth"""
        cutoff_time = datetime.utcnow() - timedelta(days=days_old)
        
        result = await self.db.event_clusters.delete_many({
            "updated_at": {"$lt": cutoff_time}
        })
        
        logger.info(f"🧹 Cleaned up {result.deleted_count} old clusters")
        return result.deleted_count

    async def get_clustering_performance_stats(self) -> Dict:
        """Get performance statistics for clustering operations"""
        try:
            # Count unclustered events
            unclustered_count = await self.db.events.count_documents({
                "$or": [
                    {"cluster_id": {"$exists": False}},
                    {"cluster_id": None}
                ],
                "processed": True
            })
            
            # Count active clusters
            active_clusters = await self.db.event_clusters.count_documents({
                "updated_at": {"$gte": datetime.utcnow() - timedelta(hours=24)}
            })
            
            return {
                "unclustered_events": unclustered_count,
                "active_clusters_24h": active_clusters,
                "cluster_radius_meters": CLUSTER_RADIUS_METERS,
                "cluster_window_seconds": CLUSTER_WINDOW_SECONDS
            }
        except Exception as e:
            logger.error(f"Error getting performance stats: {e}")
            return {"error": str(e)}

# Singleton instance
clustering_service = None

def get_clustering_service(db: AsyncIOMotorDatabase) -> EventClusteringService:
    """Get or create clustering service instance"""
    global clustering_service
    if clustering_service is None:
        clustering_service = EventClusteringService(db)
    return clustering_service