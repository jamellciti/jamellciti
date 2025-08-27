from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from enum import Enum
import uuid

class UserRole(str, Enum):
    PARENT = "parent"
    CHILD = "child"

class TaskStatus(str, Enum):
    SCHEDULED = "scheduled"
    SUBMITTED = "submitted" 
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPIRED = "expired"

class TransactionType(str, Enum):
    EARN = "earn"
    REDEEM = "redeem"
    ADJUST = "adjust"

class RewardType(str, Enum):
    PERK = "perk"
    CASH = "cash"
    CUSTOM = "custom"

# User Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password_hash: str
    display_name: str
    avatar_url: Optional[str] = None
    role: UserRole
    created_at: datetime = Field(default_factory=datetime.utcnow)
    family_id: Optional[str] = None

class UserCreate(BaseModel):
    email: str
    password: str
    display_name: str
    role: UserRole

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    display_name: str
    avatar_url: Optional[str] = None
    role: UserRole
    family_id: Optional[str] = None
    created_at: datetime

# Family Models
class Family(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    created_by: str  # parent user id
    created_at: datetime = Field(default_factory=datetime.utcnow)
    invite_code: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])

class FamilyCreate(BaseModel):
    name: str

class FamilyMember(BaseModel):
    user_id: str
    family_id: str
    joined_at: datetime = Field(default_factory=datetime.utcnow)

# Task Models
class Task(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    family_id: str
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    icon: Optional[str] = None
    reward_points: int = 0
    reward_cash_cents: int = 0
    requires_proof: bool = False
    created_by: str  # parent user id
    is_recurring: bool = False
    recurrence_pattern: Optional[str] = None  # daily, weekly, monthly
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    icon: Optional[str] = None
    reward_points: int = 0
    reward_cash_cents: int = 0
    requires_proof: bool = False
    is_recurring: bool = False
    recurrence_pattern: Optional[str] = None

class TaskInstance(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    task_id: str
    child_id: str
    family_id: str
    title: str  # copied from task for efficiency
    description: Optional[str] = None
    reward_points: int = 0
    requires_proof: bool = False
    due_at: datetime
    status: TaskStatus = TaskStatus.SCHEDULED
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

class TaskInstanceCreate(BaseModel):
    task_id: str
    child_id: str
    due_at: datetime

# Submission Models
class Submission(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    task_instance_id: str
    child_id: str
    media_base64: Optional[str] = None  # base64 encoded image
    media_type: Optional[str] = None  # image/jpeg, image/png
    caption: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SubmissionCreate(BaseModel):
    media_base64: Optional[str] = None
    media_type: Optional[str] = None
    caption: Optional[str] = None

class Approval(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    submission_id: str
    task_instance_id: str
    parent_id: str
    decision: str  # "approved" or "rejected"
    reason: Optional[str] = None
    decided_at: datetime = Field(default_factory=datetime.utcnow)

class ApprovalCreate(BaseModel):
    decision: str
    reason: Optional[str] = None

# Wallet Models
class Wallet(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    child_id: str
    family_id: str
    points_balance: int = 0
    cash_balance_cents: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    wallet_id: str
    child_id: str
    type: TransactionType
    amount_points: int = 0
    amount_cents: int = 0
    memo: Optional[str] = None
    task_instance_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Reward Models
class Reward(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    family_id: str
    title: str
    type: RewardType
    cost_points: int = 0
    cost_cents: int = 0
    description: Optional[str] = None
    icon: Optional[str] = None
    stock: Optional[int] = None
    created_by: str  # parent user id
    created_at: datetime = Field(default_factory=datetime.utcnow)

class RewardCreate(BaseModel):
    title: str
    type: RewardType
    cost_points: int = 0
    cost_cents: int = 0
    description: Optional[str] = None
    icon: Optional[str] = None
    stock: Optional[int] = None

class Redemption(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    reward_id: str
    child_id: str
    wallet_id: str
    status: str = "pending"  # pending, fulfilled, canceled
    fulfilled_by: Optional[str] = None
    fulfilled_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class RedemptionCreate(BaseModel):
    reward_id: str