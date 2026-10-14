import time
import random
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from app.config import settings
from app.database import get_database
from app.routers.auth import get_current_user_email
from app.models.complaint import (
    ComplaintCreate,
    ComplaintResponse,
    ComplaintUpdateStatus,
    ComplaintUpdateStaff
)

router = APIRouter(prefix="/complaints", tags=["complaints"])

def enrich_complaint_dict(c: dict) -> ComplaintResponse:
    now_ms = int(time.time() * 1000)
    appt_ms = c.get("appointment_at", now_ms)
    hours_until = (appt_ms - now_ms) / 3600000.0
    is_locked = hours_until <= settings.APPT_LOCK_HOURS and c.get("status") != "Resolved"
    is_within_2h = 0 < hours_until <= 2.5 and c.get("status") != "Resolved"
    
    return ComplaintResponse(
        id=str(c.get("_id", "")),
        token=c.get("token", ""),
        user_email=c.get("user_email"),
        user_name=c.get("user_name", "Citizen"),
        locality=c.get("locality", "Tech Park"),
        category=c.get("category", "General"),
        severity=c.get("severity", "Normal"),
        description=c.get("description", ""),
        mode=c.get("mode", "offline"),
        status=c.get("status", "Submitted"),
        assigned_staff=c.get("assigned_staff"),
        raised_at=c.get("raised_at", now_ms),
        resolution_hours=c.get("resolution_hours"),
        appointment_at=appt_ms,
        chart_attached=c.get("chart_attached", True),
        is_locked=is_locked,
        hours_until_appt=round(hours_until, 1),
        is_within_2h_alert=is_within_2h
    )

@router.get("", response_model=List[ComplaintResponse])
async def get_complaints(
    mine_only: bool = Query(True),
    status: Optional[str] = Query(None),
    locality: Optional[str] = Query(None),
    email: str = Depends(get_current_user_email)
):
    db = get_database()
    col = db.get_collection("complaints")
    
    query = {}
    if mine_only and email != "admin@gridpulse.app":
        query["user_email"] = email.lower()
    if status:
        query["status"] = status
    if locality:
        query["locality"] = locality
        
    cursor = col.find(query).sort("raised_at", -1)
    docs = await cursor.to_list(length=200)
    return [enrich_complaint_dict(d) for d in docs]

@router.post("", response_model=ComplaintResponse)
async def create_complaint(data: ComplaintCreate, email: str = Depends(get_current_user_email)):
    db = get_database()
    users_col = db.get_collection("users")
    complaints_col = db.get_collection("complaints")
    notif_col = db.get_collection("notifications")
    
    user = await users_col.find_one({"email": email.lower()}) or {}
    user_name = user.get("name", "Citizen")
    locality = user.get("locality", "Tech Park")
    
    token = f"GP-{random.randint(10000, 99999)}"
    now_ms = int(time.time() * 1000)
    assigned_staff = random.choice(settings.SUPPORT_STAFF)["name"]
    
    # 24 hours later for appointment slot
    appt_ms = now_ms + int(24 * 3600 * 1000)
    
    desc = data.description
    if data.chart_attached and "[Verified 60-Day IoT Telemetry & AI Forecast Attached]" not in desc:
        desc += " [Verified 60-Day IoT Telemetry & AI Forecast Attached]"
        
    doc = {
        "token": token,
        "user_email": email.lower(),
        "user_name": user_name,
        "locality": locality,
        "category": data.category,
        "severity": data.severity,
        "description": desc,
        "mode": data.mode,
        "status": "Submitted",
        "assigned_staff": assigned_staff,
        "raised_at": now_ms,
        "resolution_hours": None,
        "appointment_at": appt_ms,
        "chart_attached": data.chart_attached,
        "demo": False
    }
    
    res = await complaints_col.insert_one(doc)
    doc["_id"] = getattr(res, "inserted_id", str(res))
    
    # Add automated notification
    await notif_col.insert_one({
        "user_email": email.lower(),
        "text": f"Grievance token {token} ({data.category}) successfully registered. Scheduled slot assigned with {assigned_staff}.",
        "time": now_ms,
        "read": False
    })
    
    return enrich_complaint_dict(doc)

@router.patch("/{token}/status")
async def update_complaint_status(token: str, req: ComplaintUpdateStatus):
    db = get_database()
    col = db.get_collection("complaints")
    c = await col.find_one({"token": token})
    if not c:
        raise HTTPException(status_code=404, detail="Complaint token not found")
        
    update_data = {"status": req.status}
    if req.status == "Resolved" and not c.get("resolution_hours"):
        raised_at = c.get("raised_at", int(time.time() * 1000))
        hours = round((time.time() * 1000 - raised_at) / 3600000.0, 1)
        update_data["resolution_hours"] = max(1.2, hours)
        
    await col.update_one({"token": token}, {"$set": update_data})
    
    # Notify user if email exists
    if c.get("user_email"):
        notif_col = db.get_collection("notifications")
        await notif_col.insert_one({
            "user_email": c["user_email"],
            "text": f"Grievance status for token {token} has transitioned to '{req.status}'.",
            "time": int(time.time() * 1000),
            "read": False
        })
        
    return {"message": f"Token {token} updated to {req.status}", "token": token, "status": req.status}

@router.patch("/{token}/staff")
async def update_complaint_staff(token: str, req: ComplaintUpdateStaff):
    db = get_database()
    col = db.get_collection("complaints")
    c = await col.find_one({"token": token})
    if not c:
        raise HTTPException(status_code=404, detail="Complaint token not found")
        
    await col.update_one({"token": token}, {"$set": {"assigned_staff": req.assigned_staff}})
    return {"message": f"Assigned staff for {token} updated to {req.assigned_staff}", "token": token, "staff": req.assigned_staff}
