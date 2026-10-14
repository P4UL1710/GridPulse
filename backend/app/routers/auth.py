from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional
from app.database import get_database
from app.models.user import UserCreate, UserLogin, UserResponse, UserBudgetUpdate

router = APIRouter(prefix="/auth", tags=["auth"])

async def get_current_user_email(authorization: Optional[str] = Header(None)) -> Optional[str]:
    if not authorization:
        return "demo@gridpulse.app"
    # Support "Bearer email" or raw email
    token = authorization.replace("Bearer ", "").strip()
    return token if token else "demo@gridpulse.app"

@router.post("/login", response_model=UserResponse)
async def login(credentials: UserLogin):
    db = get_database()
    users_col = db.get_collection("users")
    user = await users_col.find_one({"email": credentials.email.lower()})
    if not user or user.get("password") != credentials.password:
        raise HTTPException(status_code=401, detail="Invalid credentials. Use demo@gridpulse.app / demo1234")
    
    return UserResponse(
        id=str(user.get("_id", "")),
        name=user["name"],
        email=user["email"],
        locality=user["locality"],
        meter=user["meter"],
        role=user.get("role", "citizen"),
        budget_low=user.get("budget_low", 1200.0),
        budget_high=user.get("budget_high", 1500.0)
    )

@router.post("/register", response_model=UserResponse)
async def register(data: UserCreate):
    db = get_database()
    users_col = db.get_collection("users")
    
    existing = await users_col.find_one({"email": data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email/mobile already exists.")
        
    meter_id = data.meter if data.meter else f"MTR-{10000 + hash(data.email) % 89999}"
    new_user = {
        "name": data.name,
        "email": data.email.lower(),
        "password": data.password,
        "locality": data.locality,
        "meter": meter_id,
        "role": data.role or "citizen",
        "budget_low": 1200.0,
        "budget_high": 1500.0
    }
    res = await users_col.insert_one(new_user)
    new_user["_id"] = getattr(res, "inserted_id", str(res))
    
    return UserResponse(
        id=str(new_user["_id"]),
        name=new_user["name"],
        email=new_user["email"],
        locality=new_user["locality"],
        meter=new_user["meter"],
        role=new_user["role"],
        budget_low=new_user["budget_low"],
        budget_high=new_user["budget_high"]
    )

@router.get("/me", response_model=UserResponse)
async def get_me(email: str = Depends(get_current_user_email)):
    db = get_database()
    users_col = db.get_collection("users")
    user = await users_col.find_one({"email": email.lower()})
    if not user:
        # Fallback to demo user
        user = await users_col.find_one({"email": "demo@gridpulse.app"})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
    return UserResponse(
        id=str(user.get("_id", "")),
        name=user["name"],
        email=user["email"],
        locality=user["locality"],
        meter=user["meter"],
        role=user.get("role", "citizen"),
        budget_low=user.get("budget_low", 1200.0),
        budget_high=user.get("budget_high", 1500.0)
    )

@router.put("/budget")
async def update_budget(budget: UserBudgetUpdate, email: str = Depends(get_current_user_email)):
    if budget.high <= budget.low:
        raise HTTPException(status_code=400, detail="Max budget must be greater than Min budget")
        
    db = get_database()
    users_col = db.get_collection("users")
    await users_col.update_one(
        {"email": email.lower()},
        {"$set": {"budget_low": budget.low, "budget_high": budget.high}}
    )
    return {"message": "Budget updated successfully", "budget_low": budget.low, "budget_high": budget.high}
