from typing import Optional
from pydantic import BaseModel, Field

class ComplaintCreate(BaseModel):
    category: str
    severity: str = "Normal"
    description: str
    mode: str = "offline"  # default to offline as per SRS FR7
    chart_attached: bool = True

class ComplaintUpdateStatus(BaseModel):
    status: str

class ComplaintUpdateStaff(BaseModel):
    assigned_staff: str

class AppointmentModeUpdate(BaseModel):
    mode: str  # "online" or "offline"

class ComplaintResponse(BaseModel):
    id: Optional[str] = None
    token: str
    user_email: Optional[str] = None
    user_name: str
    locality: str
    category: str
    severity: str
    description: str
    mode: str
    status: str
    assigned_staff: Optional[str] = None
    raised_at: int  # timestamp ms
    resolution_hours: Optional[float] = None
    appointment_at: int  # timestamp ms
    chart_attached: bool = True
    is_locked: bool = False
    hours_until_appt: Optional[float] = None
    is_within_2h_alert: bool = False
