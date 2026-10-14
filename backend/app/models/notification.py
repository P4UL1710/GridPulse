from typing import Optional
from pydantic import BaseModel

class NotificationItem(BaseModel):
    id: Optional[str] = None
    user_email: Optional[str] = None
    text: str
    time: int
    read: bool = False

class NotificationCreate(BaseModel):
    text: str
