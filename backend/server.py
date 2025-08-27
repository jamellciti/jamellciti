from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import logging
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Optional

# Import our models and utilities
from models import *
from auth import *
from database import connect_to_mongo, close_mongo_connection, get_collection

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create FastAPI app
app = FastAPI(title="Family Tasks & Rewards API", version="1.0.0")

# Create API router
api_router = APIRouter(prefix="/api")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()
    logger.info("Connected to MongoDB")

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()
    logger.info("Disconnected from MongoDB")

# Health check endpoint
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# ===== AUTHENTICATION ENDPOINTS =====

@api_router.post("/auth/register", response_model=UserResponse)
async def register_user(user_data: UserCreate):
    users_collection = get_collection("users")
    
    # Check if user already exists
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password and create user
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        password_hash=hashed_password,
        display_name=user_data.display_name,
        role=user_data.role
    )
    
    # Insert user into database
    await users_collection.insert_one(user.dict())
    
    # Create wallet for child users
    if user.role == UserRole.CHILD:
        wallet = Wallet(child_id=user.id, family_id="")  # Will be updated when they join family
        await get_collection("wallets").insert_one(wallet.dict())
    
    return UserResponse(**user.dict())

@api_router.post("/auth/login")
async def login_user(login_data: UserLogin):
    users_collection = get_collection("users")
    
    # Find user by email
    user_doc = await users_collection.find_one({"email": login_data.email})
    if not user_doc or not verify_password(login_data.password, user_doc["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create access token
    access_token = create_access_token(
        data={
            "sub": user_doc["id"],
            "email": user_doc["email"],
            "role": user_doc["role"],
            "family_id": user_doc.get("family_id")
        }
    )
    
    user_response = UserResponse(**user_doc)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    users_collection = get_collection("users")
    user_doc = await users_collection.find_one({"id": current_user["sub"]})
    
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(**user_doc)

# ===== FAMILY ENDPOINTS =====

@api_router.post("/families", response_model=Family)
async def create_family(family_data: FamilyCreate, current_user: dict = Depends(get_current_parent_user)):
    families_collection = get_collection("families")
    users_collection = get_collection("users")
    
    # Create family
    family = Family(
        name=family_data.name,
        created_by=current_user["sub"]
    )
    
    await families_collection.insert_one(family.dict())
    
    # Update user with family_id
    await users_collection.update_one(
        {"id": current_user["sub"]},
        {"$set": {"family_id": family.id}}
    )
    
    return family

@api_router.post("/families/join/{invite_code}")
async def join_family(invite_code: str, current_user: dict = Depends(get_current_user)):
    families_collection = get_collection("families")
    users_collection = get_collection("users")
    
    # Find family by invite code
    family_doc = await families_collection.find_one({"invite_code": invite_code})
    if not family_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid invite code"
        )
    
    # Update user with family_id
    await users_collection.update_one(
        {"id": current_user["sub"]},
        {"$set": {"family_id": family_doc["id"]}}
    )
    
    # Update wallet if child user
    if current_user["role"] == UserRole.CHILD:
        wallets_collection = get_collection("wallets")
        await wallets_collection.update_one(
            {"child_id": current_user["sub"]},
            {"$set": {"family_id": family_doc["id"]}}
        )
    
    return {"message": "Successfully joined family", "family_name": family_doc["name"]}

@api_router.get("/families/members")
async def get_family_members(current_user: dict = Depends(get_current_user)):
    if not current_user.get("family_id"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not part of any family"
        )
    
    users_collection = get_collection("users")
    members = await users_collection.find(
        {"family_id": current_user["family_id"]},
        {"password_hash": 0}  # Exclude password hash
    ).to_list(100)
    
    return [UserResponse(**member) for member in members]

# ===== TASK ENDPOINTS =====

@api_router.post("/tasks", response_model=Task)
async def create_task(task_data: TaskCreate, current_user: dict = Depends(get_current_parent_user)):
    if not current_user.get("family_id"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not part of any family"
        )
    
    tasks_collection = get_collection("tasks")
    
    task = Task(
        **task_data.dict(),
        family_id=current_user["family_id"],
        created_by=current_user["sub"]
    )
    
    await tasks_collection.insert_one(task.dict())
    return task

@api_router.get("/tasks", response_model=List[Task])
async def get_tasks(current_user: dict = Depends(get_current_user)):
    if not current_user.get("family_id"):
        return []
    
    tasks_collection = get_collection("tasks")
    tasks = await tasks_collection.find({"family_id": current_user["family_id"]}).to_list(1000)
    
    return [Task(**task) for task in tasks]

@api_router.post("/tasks/{task_id}/assign", response_model=TaskInstance)
async def assign_task(
    task_id: str, 
    assignment: TaskInstanceCreate,
    current_user: dict = Depends(get_current_parent_user)
):
    tasks_collection = get_collection("tasks")
    task_instances_collection = get_collection("task_instances")
    
    # Get the original task
    task_doc = await tasks_collection.find_one({"id": task_id, "family_id": current_user["family_id"]})
    if not task_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Create task instance
    task_instance = TaskInstance(
        task_id=task_id,
        child_id=assignment.child_id,
        family_id=current_user["family_id"],
        title=task_doc["title"],
        description=task_doc.get("description"),
        reward_points=task_doc["reward_points"],
        requires_proof=task_doc["requires_proof"],
        due_at=assignment.due_at
    )
    
    await task_instances_collection.insert_one(task_instance.dict())
    return task_instance

# ===== TASK INSTANCE ENDPOINTS =====

@api_router.get("/task-instances", response_model=List[TaskInstance])
async def get_task_instances(
    status: Optional[TaskStatus] = None,
    current_user: dict = Depends(get_current_user)
):
    if not current_user.get("family_id"):
        return []
    
    task_instances_collection = get_collection("task_instances")
    
    # Build query
    query = {"family_id": current_user["family_id"]}
    
    # Filter by child for child users
    if current_user["role"] == UserRole.CHILD:
        query["child_id"] = current_user["sub"]
    
    # Filter by status if provided
    if status:
        query["status"] = status
    
    task_instances = await task_instances_collection.find(query).sort("due_at", 1).to_list(1000)
    
    return [TaskInstance(**instance) for instance in task_instances]

@api_router.post("/task-instances/{instance_id}/submit")
async def submit_task(
    instance_id: str,
    submission_data: SubmissionCreate,
    current_user: dict = Depends(get_current_child_user)
):
    task_instances_collection = get_collection("task_instances")
    submissions_collection = get_collection("submissions")
    
    # Get task instance
    instance_doc = await task_instances_collection.find_one({
        "id": instance_id,
        "child_id": current_user["sub"],
        "status": TaskStatus.SCHEDULED
    })
    
    if not instance_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task instance not found or already submitted"
        )
    
    # Create submission
    submission = Submission(
        task_instance_id=instance_id,
        child_id=current_user["sub"],
        **submission_data.dict()
    )
    
    await submissions_collection.insert_one(submission.dict())
    
    # Update task instance status
    await task_instances_collection.update_one(
        {"id": instance_id},
        {
            "$set": {
                "status": TaskStatus.SUBMITTED,
                "completed_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "Task submitted successfully", "submission_id": submission.id}

@api_router.post("/task-instances/{instance_id}/approve")
async def approve_task(
    instance_id: str,
    approval_data: ApprovalCreate,
    current_user: dict = Depends(get_current_parent_user)
):
    task_instances_collection = get_collection("task_instances")
    submissions_collection = get_collection("submissions")
    approvals_collection = get_collection("approvals")
    
    # Get task instance
    instance_doc = await task_instances_collection.find_one({
        "id": instance_id,
        "family_id": current_user["family_id"],
        "status": TaskStatus.SUBMITTED
    })
    
    if not instance_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task instance not found or not submitted"
        )
    
    # Get submission
    submission_doc = await submissions_collection.find_one({"task_instance_id": instance_id})
    
    # Create approval record
    approval = Approval(
        submission_id=submission_doc["id"],
        task_instance_id=instance_id,
        parent_id=current_user["sub"],
        **approval_data.dict()
    )
    
    await approvals_collection.insert_one(approval.dict())
    
    # Update task instance status
    new_status = TaskStatus.APPROVED if approval_data.decision == "approved" else TaskStatus.REJECTED
    await task_instances_collection.update_one(
        {"id": instance_id},
        {"$set": {"status": new_status}}
    )
    
    # Award points if approved
    if approval_data.decision == "approved" and instance_doc["reward_points"] > 0:
        await award_points(instance_doc["child_id"], instance_doc["reward_points"], instance_id)
    
    return {"message": f"Task {approval_data.decision} successfully"}

# ===== WALLET ENDPOINTS =====

@api_router.get("/wallet", response_model=Wallet)
async def get_wallet(current_user: dict = Depends(get_current_child_user)):
    wallets_collection = get_collection("wallets")
    
    wallet_doc = await wallets_collection.find_one({"child_id": current_user["sub"]})
    if not wallet_doc:
        # Create wallet if it doesn't exist
        wallet = Wallet(child_id=current_user["sub"], family_id=current_user.get("family_id", ""))
        await wallets_collection.insert_one(wallet.dict())
        return wallet
    
    return Wallet(**wallet_doc)

@api_router.get("/wallet/transactions", response_model=List[Transaction])
async def get_transactions(current_user: dict = Depends(get_current_child_user)):
    transactions_collection = get_collection("transactions")
    
    transactions = await transactions_collection.find(
        {"child_id": current_user["sub"]}
    ).sort("created_at", -1).to_list(1000)
    
    return [Transaction(**transaction) for transaction in transactions]

# Helper function to award points
async def award_points(child_id: str, points: int, task_instance_id: str = None):
    wallets_collection = get_collection("wallets")
    transactions_collection = get_collection("transactions")
    
    # Update wallet balance
    wallet_doc = await wallets_collection.find_one({"child_id": child_id})
    if wallet_doc:
        new_balance = wallet_doc["points_balance"] + points
        await wallets_collection.update_one(
            {"child_id": child_id},
            {"$set": {"points_balance": new_balance}}
        )
        
        # Create transaction record
        transaction = Transaction(
            wallet_id=wallet_doc["id"],
            child_id=child_id,
            type=TransactionType.EARN,
            amount_points=points,
            memo="Task completion reward",
            task_instance_id=task_instance_id
        )
        
        await transactions_collection.insert_one(transaction.dict())

# Include the router in the main app
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)