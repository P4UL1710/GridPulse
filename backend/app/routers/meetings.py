import time
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.config import settings
from app.database import get_database
from app.routers.auth import get_current_user_email
from app.services.telemetry_sim import telemetry_engine

router = APIRouter(prefix="/meetings", tags=["meetings"])

class MeetingChatMessage(BaseModel):
    sender: str
    role: str  # "citizen" or "csr"
    text: str

class ResolveMeetingRequest(BaseModel):
    verdict: str
    rebate_amount: Optional[float] = 0.0
    resolution_notes: str

# In-memory storage for active meeting room chat sessions
MEETING_CHATS = {}

@router.get("/{token}")
async def get_meeting_room(token: str, email: str = Depends(get_current_user_email)):
    db = get_database()
    col = db.get_collection("complaints")
    c = await col.find_one({"token": token})
    if not c:
        # Fallback to create temporary demo ticket if token doesn't exist
        c = {
            "token": token,
            "user_email": email,
            "user_name": "Asha Rao",
            "locality": "Tech Park",
            "category": "Billing discrepancy",
            "severity": "High",
            "description": "Actual billed amount exceeded AI prediction by ₹340.",
            "mode": "online",
            "status": "In Progress",
            "assigned_staff": "Ananya Sen",
            "raised_at": int(time.time() * 1000) - 3600000,
            "appointment_at": int(time.time() * 1000) + 1800000,
            "chart_attached": True
        }

    # Match assigned officer role
    staff_name = c.get("assigned_staff", "Ananya Sen")
    staff_role = "Senior Billing Specialist & Dispute Arbitrator"
    for s in settings.SUPPORT_STAFF:
        if s["name"] == staff_name:
            staff_role = f"{s['role']} & Dispute Arbitrator"
            break

    # Seed default CSR message in meeting chat if new
    if token not in MEETING_CHATS:
        MEETING_CHATS[token] = [
            {
                "id": "msg-1",
                "sender": staff_name,
                "role": "csr",
                "text": f"Namaste {c.get('user_name', 'Citizen')}! I am {staff_name} from Urban Electricity Operations. I have your verified IoT telemetry and AI slab forecast for token {token} open on my terminal. How can I assist you with this grievance today?",
                "time": int(time.time() * 1000)
            }
        ]

    live_tele = telemetry_engine.get_current_reading()

    return {
        "room_id": f"room_{token}",
        "token": token,
        "consumer_name": c.get("user_name", "Citizen"),
        "consumer_email": c.get("user_email", email),
        "locality": c.get("locality", "Tech Park"),
        "meter": "MTR-40210",
        "category": c.get("category", "Billing discrepancy"),
        "severity": c.get("severity", "Normal"),
        "description": c.get("description", ""),
        "mode": c.get("mode", "online"),
        "status": c.get("status", "In Progress"),
        "assigned_staff": staff_name,
        "csr_role": staff_role,
        "appointment_at": c.get("appointment_at", int(time.time() * 1000)),
        "is_live": True,
        "telemetry_snapshot": live_tele,
        "messages": MEETING_CHATS[token]
    }

@router.post("/{token}/messages")
async def send_meeting_message(token: str, msg: MeetingChatMessage):
    if token not in MEETING_CHATS:
        MEETING_CHATS[token] = []

    now_ms = int(time.time() * 1000)
    new_msg = {
        "id": f"msg-{len(MEETING_CHATS[token]) + 1}",
        "sender": msg.sender,
        "role": msg.role,
        "text": msg.text,
        "time": now_ms
    }
    MEETING_CHATS[token].append(new_msg)

    # Automated intelligent CSR reply simulation if citizen sent message
    csr_reply = None
    if msg.role == "citizen":
        text_lower = msg.text.lower()
        if "bill" in text_lower or "discrepancy" in text_lower or "tariff" in text_lower or "extra" in text_lower:
            csr_reply = "I see the variance in your cycle! Our smart meter recorded 185 units, but the municipal bill charged for 240 units due to an incorrect feeder multiplier. I can authorize an instant credit adjustment."
        elif "surge" in text_lower or "voltage" in text_lower or "drop" in text_lower:
            csr_reply = "I've reviewed the feeder substation logs between 19:30 and 21:45. Transformer #4 in Tech Park experienced a localized phase imbalance. Field technicians have re-balanced the load tap."
        elif "refund" in text_lower or "settle" in text_lower or "resolve" in text_lower:
            csr_reply = "I am ready to authorize the resolution and issue a certified grievance settlement credit. Click 'Approve Settlement' or let me know if you agree to the adjustment."
        else:
            csr_reply = "Understood. The 60-day telemetry audit log is verified and timestamped. Let me document this in the official Urban Operations registry."

        if csr_reply:
            csr_msg = {
                "id": f"msg-{len(MEETING_CHATS[token]) + 2}",
                "sender": "Ananya Sen (CSR)",
                "role": "csr",
                "text": csr_reply,
                "time": now_ms + 1200
            }
            MEETING_CHATS[token].append(csr_msg)

    return {"message": "Message sent", "data": new_msg, "all_messages": MEETING_CHATS[token]}

@router.post("/{token}/resolve")
async def resolve_meeting_grievance(token: str, req: ResolveMeetingRequest):
    db = get_database()
    col = db.get_collection("complaints")
    notif_col = db.get_collection("notifications")

    c = await col.find_one({"token": token})
    now_ms = int(time.time() * 1000)

    raised_at = c.get("raised_at", now_ms - 3600000) if c else (now_ms - 3600000)
    res_hours = round((now_ms - raised_at) / 3600000.0, 1)

    resolution_code = f"RES-CREDIT-{token.replace('GP-', '')}-{int(time.time()) % 10000}"

    update_doc = {
        "status": "Resolved",
        "resolution_hours": max(0.5, res_hours),
        "resolution_verdict": req.verdict,
        "rebate_amount": req.rebate_amount,
        "resolution_notes": req.notes if hasattr(req, 'notes') else req.resolution_notes,
        "resolution_code": resolution_code
    }

    if c:
        await col.update_one({"token": token}, {"$set": update_doc})
        if c.get("user_email"):
            await notif_col.insert_one({
                "user_email": c["user_email"],
                "text": f"Grievance {token} resolved during virtual consultation! Resolution Code: {resolution_code} (Rebate: ₹{req.rebate_amount})",
                "time": now_ms,
                "read": False
            })

    # Add resolution message in meeting chat
    if token in MEETING_CHATS:
        MEETING_CHATS[token].append({
            "id": f"msg-{len(MEETING_CHATS[token]) + 1}",
            "sender": "System",
            "role": "system",
            "text": f"✅ Dispute officially resolved! Verdict: {req.verdict} | Credit Rebate: ₹{req.rebate_amount} | Settlement Code: {resolution_code}",
            "time": now_ms
        })

    return {
        "message": f"Complaint {token} resolved successfully",
        "token": token,
        "resolution_code": resolution_code,
        "rebate_amount": req.rebate_amount,
        "status": "Resolved"
    }
