import time
from typing import List
from fastapi import APIRouter, Depends
from app.database import get_database
from app.routers.auth import get_current_user_email
from app.models.notification import NotificationItem, NotificationCreate

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("", response_model=List[NotificationItem])
async def get_notifications(email: str = Depends(get_current_user_email)):
    db = get_database()
    col = db.get_collection("notifications")
    cursor = col.find({"user_email": email.lower()}).sort("time", -1)
    docs = await cursor.to_list(length=50)
    return [
        NotificationItem(
            id=str(d.get("_id", "")),
            user_email=d.get("user_email"),
            text=d["text"],
            time=d["time"],
            read=d.get("read", False)
        )
        for d in docs
    ]

@router.post("", response_model=NotificationItem)
async def create_notification(req: NotificationCreate, email: str = Depends(get_current_user_email)):
    db = get_database()
    col = db.get_collection("notifications")
    now_ms = int(time.time() * 1000)
    doc = {
        "user_email": email.lower(),
        "text": req.text,
        "time": now_ms,
        "read": False
    }
    res = await col.insert_one(doc)
    doc["_id"] = getattr(res, "inserted_id", str(res))
    return NotificationItem(
        id=str(doc["_id"]),
        user_email=doc["user_email"],
        text=doc["text"],
        time=doc["time"],
        read=doc["read"]
    )

@router.delete("")
async def clear_notifications(email: str = Depends(get_current_user_email)):
    db = get_database()
    col = db.get_collection("notifications")
    await col.delete_many({"user_email": email.lower()})
    return {"message": "All notifications cleared"}

@router.patch("/read")
async def mark_notifications_read(email: str = Depends(get_current_user_email)):
    db = get_database()
    col = db.get_collection("notifications")
    await col.update_one({"user_email": email.lower()}, {"$set": {"read": True}})
    return {"message": "Notifications marked as read"}
