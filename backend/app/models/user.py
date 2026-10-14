from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class UserBase(BaseModel):
    name: str
    email: str
    locality: str
    meter: str
    role: str = "citizen"  # "citizen" or "admin"

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    locality: str
    meter: Optional[str] = None
    role: str = "citizen"

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(UserBase):
    id: Optional[str] = None
    budget_low: float = 1200.0
    budget_high: float = 1500.0

class UserBudgetUpdate(BaseModel):
    low: float = Field(..., gt=0)
    high: float = Field(..., gt=0)
