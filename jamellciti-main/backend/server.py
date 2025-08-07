from fastapi import FastAPI, APIRouter, Depends, HTTPException, Header, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import time
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import hashlib
import jwt
import json
from enum import Enum
import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

# Import our services
from services.clustering import get_clustering_service
from services.websocket_manager import connection_manager

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'aura-vision-dev-secret-2025')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="Aura Vision API", version="1.0.0")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Global scheduler instance
scheduler = None
clustering_service = None

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Enums
class EventType(str, Enum):
    POTHOLE = "pothole"
    STORM_DRAIN_CLOG = "storm_drain_clog"
    NEAR_MISS = "near_miss"
    LITTER_DUMPING = "litter_dumping"
    ADA_OBSTRUCTION = "ada_obstruction"
    # New enforcement event types
    ILLEGAL_UTURN = "illegal_uturn"
    FAILURE_TO_YIELD = "failure_to_yield"
    RECKLESS_MERGE = "reckless_merge"
    SPEEDING_SCHOOL_ZONE = "speeding_school_zone"

class WorkOrderStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    CLOSED = "closed"

class CitationStatus(str, Enum):
    ISSUED = "issued"
    PAID = "paid"
    CONTESTED = "contested"

class ReviewStatus(str, Enum):
    QUEUED = "queued"
    FORWARDED = "forwarded"
    REVIEWED = "reviewed"
    RESOLVED = "resolved"

class City(str, Enum):
    PHOENIX = "phoenix"
    TUCSON = "tucson"

# Models
class Event(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: EventType
    lat: float = Field(..., ge=33.44, le=33.47, description="Latitude (Phoenix bounds)")
    lon: float = Field(..., ge=-112.09, le=-112.07, description="Longitude (Phoenix bounds)")
    severity: int = Field(..., ge=1, le=5, description="Severity score 1-5")
    score: float = Field(default=0.0, ge=0.0, le=1.0, description="ML confidence score")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    city: City = Field(default=City.PHOENIX)
    status: str = Field(default="pending")
    processed: bool = Field(default=False)
    device_id: str = Field(default="sim-device-001")

class EventCreate(BaseModel):
    type: EventType
    lat: float = Field(..., ge=33.44, le=33.47)
    lon: float = Field(..., ge=-112.09, le=-112.07)
    severity: int = Field(..., ge=1, le=5)
    score: float = Field(default=0.0, ge=0.0, le=1.0)
    city: City = Field(default=City.PHOENIX)
    device_id: str = Field(default="sim-device-001")

class WorkOrder(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    type: str
    description: str
    status: WorkOrderStatus = Field(default=WorkOrderStatus.OPEN)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    estimated_sla_hours: int = Field(default=48)

class Citation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    type: str
    description: str
    fine_amount: float = Field(default=150.0)
    status: CitationStatus = Field(default=CitationStatus.ISSUED)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VideoReview(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    video_url: str = Field(default="")
    thumbnail_url: str = Field(default="")
    review_status: ReviewStatus = Field(default=ReviewStatus.QUEUED)
    destination_agency: str = Field(default="pd")
    confidence_score: float = Field(default=0.85)
    reviewer_comments: str = Field(default="")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    reviewed_at: Optional[datetime] = None

class APIKey(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    key_hash: str
    city: City
    active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password_hash: str
    role: str = Field(default="admin")
    city: City = Field(default=City.PHOENIX)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserLogin(BaseModel):
    email: str
    password: str

# Load rule engine configuration
RULE_ENGINE_CONFIG = {
    "pothole": {"severity_threshold": 3, "action": "work_order"},
    "storm_drain_clog": {"severity_threshold": 0, "action": "work_order"},
    "near_miss": {"score_threshold": 0.7, "action": "kpi_only"},
    "litter_dumping": {"severity_threshold": 2, "action": "citation", "fine": 200.0},
    "ada_obstruction": {"severity_threshold": 0, "action": "citation", "fine": 500.0},
    # New enforcement rules
    "illegal_uturn": {"severity_threshold": 0, "action": "citation_video", "fine": 150.0, "agency": "pd"},
    "failure_to_yield": {"severity_threshold": 0, "action": "citation_video", "fine": 175.0, "agency": "pd"},
    "reckless_merge": {"severity_threshold": 2, "action": "video_review", "fine": 300.0, "agency": "pd"},
    "speeding_school_zone": {"severity_threshold": 0, "action": "citation_video", "fine": 250.0, "agency": "school_zone_unit"}
}

# Authentication utilities
def hash_password(password: str) -> str:
    return hashlib.pbkdf2_hmac('sha256', password.encode(), b'aura-salt', 100000).hex()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

def create_jwt_token(user_data: dict) -> str:
    payload = {
        "user_id": user_data["id"],
        "email": user_data["email"],
        "role": user_data["role"],
        "city": user_data["city"],
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def verify_api_key(api_key: str = Header(..., alias="X-API-Key")) -> dict:
    key_hash = hashlib.sha256(api_key.encode()).hexdigest()
    api_key_doc = await db.api_keys.find_one({"key_hash": key_hash, "active": True})
    if not api_key_doc:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return api_key_doc

async def verify_user_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    return verify_jwt_token(token)

# Event processing logic
async def process_event(event: Event) -> Dict[str, Any]:
    """Apply rule engine to determine actions for an event"""
    results = {"work_orders": [], "citations": [], "video_reviews": [], "kpi_only": False}
    
    rule = RULE_ENGINE_CONFIG.get(event.type.value)
    if not rule:
        return results
    
    action = rule["action"]
    
    # Check thresholds
    trigger_action = False
    if "severity_threshold" in rule:
        trigger_action = event.severity >= rule["severity_threshold"]
    elif "score_threshold" in rule:
        trigger_action = event.score >= rule["score_threshold"]
    
    if not trigger_action:
        return results
    
    if action == "work_order":
        work_order = WorkOrder(
            event_id=event.id,
            type=event.type.value,
            description=f"{event.type.value.replace('_', ' ').title()} detected at {event.lat:.4f}, {event.lon:.4f} (severity: {event.severity})"
        )
        await db.work_orders.insert_one(work_order.dict())
        results["work_orders"].append(work_order.dict())
        
        # Broadcast work order update via WebSocket
        await connection_manager.broadcast_work_order_update(work_order.dict())
        
    elif action == "citation":
        citation = Citation(
            event_id=event.id,
            type=event.type.value,
            description=f"{event.type.value.replace('_', ' ').title()} violation at {event.lat:.4f}, {event.lon:.4f}",
            fine_amount=rule.get("fine", 150.0)
        )
        await db.citations.insert_one(citation.dict())
        results["citations"].append(citation.dict())
        
        # Broadcast citation update via WebSocket
        await connection_manager.broadcast_citation_update(citation.dict())
        
    elif action == "citation_video":
        # Create both citation and video review
        citation = Citation(
            event_id=event.id,
            type=event.type.value,
            description=f"{event.type.value.replace('_', ' ').title()} violation at {event.lat:.4f}, {event.lon:.4f}",
            fine_amount=rule.get("fine", 150.0)
        )
        await db.citations.insert_one(citation.dict())
        results["citations"].append(citation.dict())
        
        # Create video review entry
        video_review = VideoReview(
            event_id=event.id,
            video_url=f"https://aura-storage.s3.amazonaws.com/videos/{event.id}_clip.mp4",  # Simulated
            thumbnail_url=f"https://aura-storage.s3.amazonaws.com/thumbnails/{event.id}_thumb.jpg",  # Simulated
            destination_agency=rule.get("agency", "pd"),
            confidence_score=event.score
        )
        await db.video_reviews.insert_one(video_review.dict())
        results["video_reviews"].append(video_review.dict())
        
        # Broadcast updates
        await connection_manager.broadcast_citation_update(citation.dict())
        await connection_manager.broadcast_video_review_update(video_review.dict())
        
    elif action == "video_review":
        # Create video review only (for cases requiring manual review before citation)
        video_review = VideoReview(
            event_id=event.id,
            video_url=f"https://aura-storage.s3.amazonaws.com/videos/{event.id}_clip.mp4",  # Simulated
            thumbnail_url=f"https://aura-storage.s3.amazonaws.com/thumbnails/{event.id}_thumb.jpg",  # Simulated
            destination_agency=rule.get("agency", "pd"),
            confidence_score=event.score
        )
        await db.video_reviews.insert_one(video_review.dict())
        results["video_reviews"].append(video_review.dict())
        
        # Broadcast video review update
        await connection_manager.broadcast_video_review_update(video_review.dict())
        
    elif action == "kpi_only":
        results["kpi_only"] = True
    
    return results

# Background clustering task
async def run_clustering_job():
    """Background job to run event clustering"""
    try:
        if clustering_service:
            stats = await clustering_service.cluster_events()
            logger.info(f"🔄 Clustering completed: {stats}")
        else:
            logger.warning("⚠️ Clustering service not initialized")
    except Exception as e:
        logger.error(f"❌ Clustering job failed: {e}")

# Startup event handler
@app.on_event("startup")
async def startup_event():
    """Initialize services and background tasks"""
    global scheduler, clustering_service
    
    logger.info("🚀 Starting Aura Vision API...")
    
    # Initialize clustering service
    clustering_service = get_clustering_service(db)
    logger.info("✅ Clustering service initialized")
    
    # Initialize scheduler
    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        run_clustering_job,
        IntervalTrigger(seconds=30),
        id='clustering_job',
        replace_existing=True
    )
    scheduler.start()
    logger.info("✅ Background scheduler started")

# Shutdown event handler
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    global scheduler
    if scheduler:
        scheduler.shutdown()
    logger.info("👋 Aura Vision API shut down")

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Aura Vision API", "status": "active", "version": "1.0.0"}

@api_router.post("/ingest/events")
async def ingest_event(
    event_data: EventCreate,
    api_key: dict = Depends(verify_api_key)
):
    """Ingest a new IoT event from devices"""
    event = Event(**event_data.dict())
    
    # Store event in database
    await db.events.insert_one(event.dict())
    
    # Process through rule engine
    actions = await process_event(event)
    
    logger.info(f"📡 Event ingested: {event.type.value} | Actions: {len(actions.get('work_orders', []))} WO, {len(actions.get('citations', []))} citations, {len(actions.get('video_reviews', []))} videos")
    
    return {
        "event_id": event.id,
        "status": "processed",
        "actions": actions
    }

@api_router.get("/events")
async def get_events(
    limit: int = 100,
    event_type: Optional[str] = None,
    user: dict = Depends(verify_user_token)
):
    """Get recent events"""
    query = {}
    if event_type:
        query["type"] = event_type
    
    events = await db.events.find(query).sort("timestamp", -1).limit(limit).to_list(limit)
    return [Event(**event) for event in events]

@api_router.get("/work-orders")
async def get_work_orders(
    status: Optional[str] = None,
    user: dict = Depends(verify_user_token)
):
    """Get work orders"""
    query = {}
    if status:
        query["status"] = status
    
    work_orders = await db.work_orders.find(query).sort("created_at", -1).to_list(100)
    return [WorkOrder(**wo) for wo in work_orders]

@api_router.patch("/work-orders/{work_order_id}")
async def update_work_order(
    work_order_id: str,
    status: WorkOrderStatus,
    user: dict = Depends(verify_user_token)
):
    """Update work order status"""
    result = await db.work_orders.update_one(
        {"id": work_order_id},
        {
            "$set": {
                "status": status.value,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Work order not found")
    
    # Broadcast update
    updated_wo = await db.work_orders.find_one({"id": work_order_id})
    if updated_wo:
        await connection_manager.broadcast_work_order_update(updated_wo)
    
    return {"message": "Work order updated successfully"}

@api_router.get("/citations")
async def get_citations(
    status: Optional[str] = None,
    user: dict = Depends(verify_user_token)
):
    """Get citations"""
    query = {}
    if status:
        query["status"] = status
    
    citations = await db.citations.find(query).sort("created_at", -1).to_list(100)
    return [Citation(**citation) for citation in citations]

@api_router.patch("/citations/{citation_id}")
async def update_citation(
    citation_id: str,
    status: CitationStatus,
    user: dict = Depends(verify_user_token)
):
    """Update citation status"""
    result = await db.citations.update_one(
        {"id": citation_id},
        {"$set": {"status": status.value}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Citation not found")
    
    return {"message": "Citation updated successfully"}

# New Video Review Endpoints
@api_router.get("/video-reviews")
async def get_video_reviews(
    status: Optional[str] = None,
    user: dict = Depends(verify_user_token)
):
    """Get video reviews"""
    query = {}
    if status:
        query["review_status"] = status
    
    video_reviews = await db.video_reviews.find(query).sort("created_at", -1).to_list(100)
    return [VideoReview(**vr) for vr in video_reviews]

@api_router.patch("/video-reviews/{review_id}")
async def update_video_review(
    review_id: str,
    status: ReviewStatus,
    comments: Optional[str] = None,
    user: dict = Depends(verify_user_token)
):
    """Update video review status"""
    update_data = {
        "review_status": status.value,
        "reviewed_at": datetime.utcnow()
    }
    if comments:
        update_data["reviewer_comments"] = comments
    
    result = await db.video_reviews.update_one(
        {"id": review_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Video review not found")
    
    return {"message": "Video review updated successfully"}

@api_router.post("/video-reviews/{review_id}/forward")
async def forward_video_review(
    review_id: str,
    agency: str,
    user: dict = Depends(verify_user_token)
):
    """Forward video review to enforcement agency"""
    result = await db.video_reviews.update_one(
        {"id": review_id},
        {
            "$set": {
                "review_status": ReviewStatus.FORWARDED.value,
                "destination_agency": agency,
                "reviewed_at": datetime.utcnow()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Video review not found")
    
    return {"message": f"Video review forwarded to {agency}"}

@api_router.get("/kpis")
async def get_kpis(user: dict = Depends(verify_user_token)):
    """Get dashboard KPIs including enforcement metrics"""
    # Get basic KPIs
    events_today = await db.events.count_documents({
        "timestamp": {"$gte": datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)}
    })
    
    open_work_orders = await db.work_orders.count_documents({"status": "open"})
    closed_work_orders = await db.work_orders.count_documents({"status": "closed"})
    
    citations_issued = await db.citations.count_documents({"status": "issued"})
    citations_paid = await db.citations.count_documents({"status": "paid"})
    citations_contested = await db.citations.count_documents({"status": "contested"})
    
    # Calculate total fine value
    fine_pipeline = [
        {"$group": {"_id": None, "total": {"$sum": "$fine_amount"}}}
    ]
    fine_result = await db.citations.aggregate(fine_pipeline).to_list(1)
    total_fine_value = fine_result[0]["total"] if fine_result else 0.0
    
    # Calculate average SLA
    sla_pipeline = [
        {"$group": {"_id": None, "avg_sla": {"$avg": "$estimated_sla_hours"}}}
    ]
    sla_result = await db.work_orders.aggregate(sla_pipeline).to_list(1)
    avg_sla_hours = sla_result[0]["avg_sla"] if sla_result else 0.0
    
    # New enforcement KPIs
    video_reviews_queued = await db.video_reviews.count_documents({"review_status": "queued"})
    video_reviews_confirmed = await db.video_reviews.count_documents({"review_status": "reviewed"})
    total_video_reviews = await db.video_reviews.count_documents({})
    
    # Calculate enforcement metrics
    dispute_rate = (citations_contested / citations_issued * 100) if citations_issued > 0 else 0
    video_confirm_rate = (video_reviews_confirmed / total_video_reviews * 100) if total_video_reviews > 0 else 0
    avg_fine_value = (total_fine_value / citations_issued) if citations_issued > 0 else 0
    
    return {
        "events_today": events_today,
        "work_orders_open": open_work_orders,
        "work_orders_closed": closed_work_orders,
        "citations_issued": citations_issued,
        "citations_paid": citations_paid,
        "citations_contested": citations_contested,
        "total_fine_value": total_fine_value,
        "avg_sla_hours": round(avg_sla_hours, 1),
        "grant_potential": round(total_fine_value * 0.15, 0),  # 15% grant conversion
        # New enforcement KPIs
        "video_reviews_queued": video_reviews_queued,
        "video_reviews_confirmed": video_reviews_confirmed,
        "dispute_rate": round(dispute_rate, 1),
        "video_confirm_rate": round(video_confirm_rate, 1),
        "avg_fine_value": round(avg_fine_value, 0),
        "warnings_sent": 0  # Placeholder for future implementation
    }

@api_router.get("/clusters")
async def get_clusters(user: dict = Depends(verify_user_token)):
    """Get current event clusters"""
    clusters = await db.clusters.find().to_list(100)
    return clusters

# Authentication endpoints
@api_router.post("/auth/login")
async def login(user_login: UserLogin):
    """Authenticate user and return JWT token"""
    user = await db.users.find_one({"email": user_login.email})
    if not user or not verify_password(user_login.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "role": user["role"],
            "city": user["city"],
            "created_at": user["created_at"]
        }
    }

@api_router.post("/auth/register")
async def register(email: str, password: str, role: str = "admin", city: City = City.PHOENIX):
    """Register a new user"""
    # Check if user already exists
    existing_user = await db.users.find_one({"email": email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    user = User(
        email=email,
        password_hash=hash_password(password),
        role=role,
        city=city
    )
    
    await db.users.insert_one(user.dict())
    return {"message": "User created successfully", "user_id": user.id}

@api_router.get("/users")
async def get_users(user: dict = Depends(verify_user_token)):
    """Get all users (admin only)"""
    users = await db.users.find({}, {"password_hash": 0}).to_list(100)
    return users

# API Key management
@api_router.post("/admin/api-keys")
async def create_api_key(
    name: str,
    city: City,
    user: dict = Depends(verify_user_token)
):
    """Create a new API key"""
    api_key = f"aura_{uuid.uuid4().hex[:12]}"
    key_hash = hashlib.sha256(api_key.encode()).hexdigest()
    
    api_key_doc = APIKey(
        name=name,
        key_hash=key_hash,
        city=city
    )
    
    await db.api_keys.insert_one(api_key_doc.dict())
    
    return {
        "api_key": api_key,
        "name": name,
        "city": city.value,
        "created_at": api_key_doc.created_at
    }

@api_router.get("/admin/api-keys")
async def get_api_keys(user: dict = Depends(verify_user_token)):
    """Get all API keys"""
    api_keys = await db.api_keys.find({}, {"key_hash": 0}).to_list(100)
    return api_keys

# WebSocket endpoint
@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await connection_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Echo: {data}")
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)