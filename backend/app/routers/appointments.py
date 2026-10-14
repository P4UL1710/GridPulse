import time
import random
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from app.config import settings
from app.database import get_database
from app.routers.auth import get_current_user_email
from app.routers.complaints import enrich_complaint_dict
from app.models.complaint import ComplaintResponse, AppointmentModeUpdate

router = APIRouter(prefix="/appointments", tags=["appointments"])

@router.get("", response_model=List[ComplaintResponse])
async def get_appointments(email: str = Depends(get_current_user_email)):
    db = get_database()
    col = db.get_collection("complaints")
    
    query = {"status": {"$ne": "Resolved"}}
    if email != "admin@gridpulse.app":
        query["user_email"] = email.lower()
        
    cursor = col.find(query).sort("appointment_at", 1)
    docs = await cursor.to_list(length=100)
    return [enrich_complaint_dict(d) for d in docs]

@router.patch("/{token}/mode")
async def update_appointment_mode(token: str, req: AppointmentModeUpdate):
    db = get_database()
    col = db.get_collection("complaints")
    c = await col.find_one({"token": token})
    if not c:
        raise HTTPException(status_code=404, detail="Appointment ticket not found")
        
    now_ms = int(time.time() * 1000)
    appt_ms = c.get("appointment_at", now_ms)
    hours_left = (appt_ms - now_ms) / 3600000.0
    
    # Enforce SRS FR8 4-hour consultation lock rule!
    if hours_left <= settings.APPT_LOCK_HOURS:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot switch consultation mode: Appointment is within {settings.APPT_LOCK_HOURS} hours of schedule! Mode is locked."
        )
        
    await col.update_one({"token": token}, {"$set": {"mode": req.mode}})
    return {"message": f"Appointment mode changed to {req.mode}", "token": token, "mode": req.mode}

@router.post("/simulate", response_model=ComplaintResponse)
async def simulate_upcoming_appointment(email: str = Depends(get_current_user_email)):
    db = get_database()
    users_col = db.get_collection("users")
    complaints_col = db.get_collection("complaints")
    notif_col = db.get_collection("notifications")
    
    user = await users_col.find_one({"email": email.lower()}) or {}
    user_name = user.get("name", "Citizen")
    locality = user.get("locality", "Tech Park")
    
    token = f"GP-{random.randint(10000, 99999)}"
    now_ms = int(time.time() * 1000)
    # Target slot: in 2.5 hours -> directly inside 4h lock window & within 2h CSR reminder!
    target_appt = now_ms + int(2.5 * 3600 * 1000)
    
    doc = {
        "token": token,
        "user_email": email.lower(),
        "user_name": user_name,
        "locality": locality,
        "category": "Billing discrepancy",
        "severity": "High",
        "description": "Fast-approaching demonstration slot for 4-hour lock & 2-hour alert rules.",
        "mode": "offline",
        "status": "In Progress",
        "assigned_staff": "Priya Sharma",
        "raised_at": now_ms - int(20 * 3600 * 1000),
        "resolution_hours": None,
        "appointment_at": target_appt,
        "chart_attached": True,
        "demo": False
    }
    
    res = await complaints_col.insert_one(doc)
    doc["_id"] = getattr(res, "inserted_id", str(res))
    
    await notif_col.insert_one({
        "user_email": email.lower(),
        "text": f"Simulated appointment {token} created in 2.5h. 4h lock active & 2h CSR reminder alert dispatched.",
        "time": now_ms,
        "read": False
    })
    
    return enrich_complaint_dict(doc)
