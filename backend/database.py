from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

class Database:
    client: Optional[AsyncIOMotorClient] = None
    database = None

db_instance = Database()

async def get_database():
    return db_instance.database

def get_collection(collection_name: str):
    return db_instance.database[collection_name]

async def connect_to_mongo():
    """Create database connection"""
    mongo_url = os.getenv("MONGO_URL")
    db_name = os.getenv("DB_NAME", "family_tasks")
    
    db_instance.client = AsyncIOMotorClient(mongo_url)
    db_instance.database = db_instance.client[db_name]
    
    # Create indexes for better performance
    await create_indexes()

async def close_mongo_connection():
    """Close database connection"""
    if db_instance.client:
        db_instance.client.close()

async def create_indexes():
    """Create database indexes for better performance"""
    # Users collection indexes
    await db_instance.database.users.create_index("email", unique=True)
    await db_instance.database.users.create_index("family_id")
    
    # Task instances indexes
    await db_instance.database.task_instances.create_index([("child_id", 1), ("due_at", 1)])
    await db_instance.database.task_instances.create_index("family_id")
    await db_instance.database.task_instances.create_index("status")
    
    # Submissions indexes
    await db_instance.database.submissions.create_index("task_instance_id")
    await db_instance.database.submissions.create_index("child_id")
    
    # Wallets indexes  
    await db_instance.database.wallets.create_index("child_id", unique=True)
    await db_instance.database.wallets.create_index("family_id")
    
    # Transactions indexes
    await db_instance.database.transactions.create_index([("child_id", 1), ("created_at", -1)])
    await db_instance.database.transactions.create_index("wallet_id")
    
    # Families indexes
    await db_instance.database.families.create_index("invite_code", unique=True)