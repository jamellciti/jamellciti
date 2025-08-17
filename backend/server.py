from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class AgeGroup(str, Enum):
    EARLY_CHILDHOOD = "early_childhood"  # 2-6 years
    SCHOOL_AGE = "school_age"           # 7-13 years
    TEEN_ADULT = "teen_adult"           # 14+ years

class SymbolCategory(str, Enum):
    BASIC_NEEDS = "basic_needs"
    EMOTIONS = "emotions"
    ACTIONS = "actions"
    FOOD = "food"
    FAMILY = "family"
    SOCIAL = "social"
    EMERGENCY = "emergency"
    ACTIVITIES = "activities"
    SCHOOL = "school"
    TIME = "time"
    BODY_PARTS = "body_parts"
    PLACES = "places"
    TRANSPORT = "transport"
    WEATHER = "weather"
    COLORS = "colors"
    NUMBERS = "numbers"
    ANIMALS = "animals"
    CLOTHING = "clothing"
    MEDICAL = "medical"
    TECHNOLOGY = "technology"

class DifficultyLevel(int, Enum):
    BEGINNER = 1
    INTERMEDIATE = 2
    ADVANCED = 3

# Models
class SensoryProfile(BaseModel):
    contrast_level: float = Field(default=3.0, ge=1.0, le=5.0)
    reduce_motion: bool = Field(default=False)
    large_touch_targets: bool = Field(default=True)
    high_contrast_mode: bool = Field(default=False)

class UserProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    age: int
    age_group: AgeGroup
    developmental_level: DifficultyLevel = Field(default=DifficultyLevel.BEGINNER)
    sensory_profile: SensoryProfile = Field(default_factory=SensoryProfile)
    preferred_categories: List[SymbolCategory] = Field(default_factory=list)
    unlocked_symbols: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserProfileCreate(BaseModel):
    name: str
    age: int

class Symbol(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: SymbolCategory
    emoji: str
    description: str
    difficulty_level: DifficultyLevel
    frequency_score: int = Field(default=0)
    age_groups: List[AgeGroup]
    tts_text: str
    is_emergency: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CommunicationEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    symbols_used: List[str]
    text_output: str
    success: bool = Field(default=True)
    response_time_ms: int
    assistance_level: str = Field(default="independent")  # independent, prompted, assisted
    context: str = Field(default="general")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class CommunicationEventCreate(BaseModel):
    user_id: str
    symbols_used: List[str]
    text_output: str
    success: bool = Field(default=True)
    response_time_ms: int
    assistance_level: str = Field(default="independent")
    context: str = Field(default="general")

# Helper function to determine age group from age
def get_age_group(age: int) -> AgeGroup:
    if age <= 6:
        return AgeGroup.EARLY_CHILDHOOD
    elif age <= 13:
        return AgeGroup.SCHOOL_AGE
    else:
        return AgeGroup.TEEN_ADULT

# Initialize default symbols
async def initialize_default_symbols():
    """Initialize the database with default symbols if empty"""
    existing_count = await db.symbols.count_documents({})
    if existing_count > 0:
        return
    
    default_symbols = [
        # Emergency symbols
        {"name": "Help", "category": "emergency", "emoji": "🆘", "description": "I need help", "difficulty_level": 1, "age_groups": ["early_childhood", "school_age", "teen_adult"], "tts_text": "I need help!", "is_emergency": True},
        {"name": "Bathroom", "category": "emergency", "emoji": "🚽", "description": "I need to use the bathroom", "difficulty_level": 1, "age_groups": ["early_childhood", "school_age", "teen_adult"], "tts_text": "I need to use the bathroom", "is_emergency": True},
        {"name": "Pain", "category": "emergency", "emoji": "😣", "description": "I am hurt or in pain", "difficulty_level": 1, "age_groups": ["early_childhood", "school_age", "teen_adult"], "tts_text": "I am hurt", "is_emergency": True},
        
        # Basic needs
        {"name": "Water", "category": "basic_needs", "emoji": "💧", "description": "I want water", "difficulty_level": 1, "age_groups": ["early_childhood", "school_age", "teen_adult"], "tts_text": "I want water", "is_emergency": False},
        {"name": "Food", "category": "basic_needs", "emoji": "🍎", "description": "I am hungry", "difficulty_level": 1, "age_groups": ["early_childhood", "school_age", "teen_adult"], "tts_text": "I am hungry", "is_emergency": False},
        {"name": "Sleep", "category": "basic_needs", "emoji": "😴", "description": "I am tired", "difficulty_level": 1, "age_groups": ["early_childhood", "school_age", "teen_adult"], "tts_text": "I am tired", "is_emergency": False},
        
        # Emotions
        {"name": "Happy", "category": "emotions", "emoji": "😊", "description": "I am happy", "difficulty_level": 1, "age_groups": ["early_childhood", "school_age", "teen_adult"], "tts_text": "I am happy", "is_emergency": False},
        {"name": "Sad", "category": "emotions", "emoji": "😢", "description": "I am sad", "difficulty_level": 1, "age_groups": ["early_childhood", "school_age", "teen_adult"], "tts_text": "I am sad", "is_emergency": False},
        {"name": "Mad", "category": "emotions", "emoji": "😡", "description": "I am angry", "difficulty_level": 1, "age_groups": ["early_childhood", "school_age", "teen_adult"], "tts_text": "I am angry", "is_emergency": False},
        {"name": "Scared", "category": "emotions", "emoji": "😰", "description": "I am scared", "difficulty_level": 1, "age_groups": ["early_childhood", "school_age", "teen_adult"], "tts_text": "I am scared", "is_emergency": False},
        
        # Actions
        {"name": "Please", "category": "actions", "emoji": "🙏", "description": "Please", "difficulty_level": 1, "age_groups": ["early_childhood", "school_age", "teen_adult"], "tts_text": "Please", "is_emergency": False},
        {"name": "Thank You", "category": "actions", "emoji": "👍", "description": "Thank you", "difficulty_level": 1, "age_groups": ["early_childhood", "school_age", "teen_adult"], "tts_text": "Thank you", "is_emergency": False},
        {"name": "Yes", "category": "actions", "emoji": "✅", "description": "Yes", "difficulty_level": 1, "age_groups": ["early_childhood", "school_age", "teen_adult"], "tts_text": "Yes", "is_emergency": False},
        {"name": "No", "category": "actions", "emoji": "❌", "description": "No", "difficulty_level": 1, "age_groups": ["early_childhood", "school_age", "teen_adult"], "tts_text": "No", "is_emergency": False},
        
        # Family
        {"name": "Mom", "category": "family", "emoji": "👩", "description": "Mom or mother", "difficulty_level": 1, "age_groups": ["early_childhood", "school_age", "teen_adult"], "tts_text": "Mom", "is_emergency": False},
        {"name": "Dad", "category": "family", "emoji": "👨", "description": "Dad or father", "difficulty_level": 1, "age_groups": ["early_childhood", "school_age", "teen_adult"], "tts_text": "Dad", "is_emergency": False},
        {"name": "Family", "category": "family", "emoji": "👨‍👩‍👧‍👦", "description": "Family", "difficulty_level": 1, "age_groups": ["early_childhood", "school_age", "teen_adult"], "tts_text": "Family", "is_emergency": False},
        
        # Food
        {"name": "Apple", "category": "food", "emoji": "🍎", "description": "Apple fruit", "difficulty_level": 1, "age_groups": ["early_childhood", "school_age", "teen_adult"], "tts_text": "Apple", "is_emergency": False},
        {"name": "Milk", "category": "food", "emoji": "🥛", "description": "Milk", "difficulty_level": 1, "age_groups": ["early_childhood", "school_age", "teen_adult"], "tts_text": "Milk", "is_emergency": False},
        {"name": "Bread", "category": "food", "emoji": "🍞", "description": "Bread", "difficulty_level": 1, "age_groups": ["early_childhood", "school_age", "teen_adult"], "tts_text": "Bread", "is_emergency": False},
        
        # Activities
        {"name": "Play", "category": "activities", "emoji": "🎯", "description": "I want to play", "difficulty_level": 1, "age_groups": ["early_childhood", "school_age", "teen_adult"], "tts_text": "I want to play", "is_emergency": False},
        {"name": "Book", "category": "activities", "emoji": "📖", "description": "I want to read", "difficulty_level": 1, "age_groups": ["early_childhood", "school_age", "teen_adult"], "tts_text": "I want to read", "is_emergency": False},
        {"name": "Music", "category": "activities", "emoji": "🎵", "description": "I want music", "difficulty_level": 2, "age_groups": ["school_age", "teen_adult"], "tts_text": "I want music", "is_emergency": False},
        
        # Social
        {"name": "Hi", "category": "social", "emoji": "👋", "description": "Hello or hi", "difficulty_level": 1, "age_groups": ["early_childhood", "school_age", "teen_adult"], "tts_text": "Hi", "is_emergency": False},
        {"name": "Bye", "category": "social", "emoji": "👋", "description": "Goodbye", "difficulty_level": 1, "age_groups": ["early_childhood", "school_age", "teen_adult"], "tts_text": "Bye", "is_emergency": False},
        {"name": "Friend", "category": "social", "emoji": "👫", "description": "Friend", "difficulty_level": 2, "age_groups": ["school_age", "teen_adult"], "tts_text": "Friend", "is_emergency": False},
    ]
    
    # Insert symbols
    for symbol_data in default_symbols:
        symbol = Symbol(**symbol_data)
        await db.symbols.insert_one(symbol.dict())
    
    logging.info(f"Initialized {len(default_symbols)} default symbols")

# User Profile Routes
@api_router.post("/users", response_model=UserProfile)
async def create_user_profile(user_data: UserProfileCreate):
    age_group = get_age_group(user_data.age)
    
    # Get default symbols for this age group
    symbols_cursor = db.symbols.find({
        "age_groups": {"$in": [age_group.value]},
        "difficulty_level": {"$lte": 1}  # Start with beginner symbols
    })
    default_symbols = await symbols_cursor.to_list(1000)
    unlocked_symbol_ids = [symbol["id"] for symbol in default_symbols]
    
    user_profile = UserProfile(
        name=user_data.name,
        age=user_data.age,
        age_group=age_group,
        unlocked_symbols=unlocked_symbol_ids[:20]  # Start with first 20 symbols
    )
    
    await db.user_profiles.insert_one(user_profile.dict())
    return user_profile

@api_router.get("/users/{user_id}", response_model=UserProfile)
async def get_user_profile(user_id: str):
    user = await db.user_profiles.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserProfile(**user)

@api_router.get("/users", response_model=List[UserProfile])
async def get_all_users():
    users = await db.user_profiles.find().to_list(1000)
    return [UserProfile(**user) for user in users]

@api_router.put("/users/{user_id}/sensory", response_model=UserProfile)
async def update_sensory_profile(user_id: str, sensory_profile: SensoryProfile):
    result = await db.user_profiles.update_one(
        {"id": user_id},
        {"$set": {"sensory_profile": sensory_profile.dict(), "updated_at": datetime.utcnow()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = await db.user_profiles.find_one({"id": user_id})
    return UserProfile(**user)

# Symbol Routes
@api_router.get("/symbols", response_model=List[Symbol])
async def get_symbols(
    category: Optional[SymbolCategory] = None,
    age_group: Optional[AgeGroup] = None,
    difficulty_level: Optional[DifficultyLevel] = None,
    emergency_only: bool = False
):
    filter_query = {}
    
    if category:
        filter_query["category"] = category.value
    
    if age_group:
        filter_query["age_groups"] = {"$in": [age_group.value]}
    
    if difficulty_level:
        filter_query["difficulty_level"] = {"$lte": difficulty_level.value}
    
    if emergency_only:
        filter_query["is_emergency"] = True
    
    symbols = await db.symbols.find(filter_query).to_list(1000)
    return [Symbol(**symbol) for symbol in symbols]

@api_router.get("/symbols/user/{user_id}", response_model=List[Symbol])
async def get_user_symbols(user_id: str):
    user = await db.user_profiles.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_profile = UserProfile(**user)
    
    # Get symbols appropriate for user's age group and unlocked symbols
    symbols = await db.symbols.find({
        "age_groups": {"$in": [user_profile.age_group.value]},
        "difficulty_level": {"$lte": user_profile.developmental_level.value},
        "id": {"$in": user_profile.unlocked_symbols}
    }).to_list(1000)
    
    return [Symbol(**symbol) for symbol in symbols]

@api_router.get("/symbols/emergency", response_model=List[Symbol])
async def get_emergency_symbols():
    symbols = await db.symbols.find({"is_emergency": True}).to_list(1000)
    return [Symbol(**symbol) for symbol in symbols]

# Communication Events
@api_router.post("/communication", response_model=CommunicationEvent)
async def create_communication_event(event_data: CommunicationEventCreate):
    event = CommunicationEvent(**event_data.dict())
    await db.communication_events.insert_one(event.dict())
    
    # Update symbol frequency scores
    for symbol_id in event_data.symbols_used:
        await db.symbols.update_one(
            {"id": symbol_id},
            {"$inc": {"frequency_score": 1}}
        )
    
    return event

@api_router.get("/communication/user/{user_id}", response_model=List[CommunicationEvent])
async def get_user_communication_history(user_id: str, limit: int = 100):
    events = await db.communication_events.find(
        {"user_id": user_id}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    return [CommunicationEvent(**event) for event in events]

# Analytics and Progress
@api_router.get("/analytics/user/{user_id}")
async def get_user_analytics(user_id: str):
    # Get communication stats
    total_communications = await db.communication_events.count_documents({"user_id": user_id})
    successful_communications = await db.communication_events.count_documents({
        "user_id": user_id,
        "success": True
    })
    
    # Get most used symbols
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$unwind": "$symbols_used"},
        {"$group": {"_id": "$symbols_used", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    
    most_used_symbols = await db.communication_events.aggregate(pipeline).to_list(10)
    
    # Calculate success rate
    success_rate = (successful_communications / total_communications * 100) if total_communications > 0 else 0
    
    return {
        "total_communications": total_communications,
        "successful_communications": successful_communications,
        "success_rate": success_rate,
        "most_used_symbols": most_used_symbols
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    await initialize_default_symbols()
    logger.info("AutismSpeak Pro API started successfully")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()