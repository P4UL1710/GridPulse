import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "GridPulse API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "gridpulse_db")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "gridpulse-secret-key-2026")
    
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    LOCALITIES: list[str] = [
        "Sector 12",
        "Riverside",
        "Old Town",
        "Tech Park",
        "Green Hills",
        "Lakeview"
    ]
    
    SUPPORT_STAFF: list[dict] = [
        {"name": "Rajesh Kumar", "role": "Sr. Electrical Engineer"},
        {"name": "Ananya Sen", "role": "Billing Specialist"},
        {"name": "Vikram Malhotra", "role": "Grid Dispatch Officer"},
        {"name": "Priya Sharma", "role": "Consumer Grievance Lead"},
        {"name": "Amit Verma", "role": "Field Technician"}
    ]
    
    TARIFF_SLABS: list[dict] = [
        {"upto": 100, "rate": 4.5},
        {"upto": 300, "rate": 6.5},
        {"upto": float("inf"), "rate": 8.2}
    ]
    
    FIXED_CHARGE: float = 60.0
    ELECTRICITY_DUTY_PCT: float = 0.05
    BILL_ALERT_THRESHOLD: float = 150.0  # ₹ threshold for discrepancy alert
    APPT_LOCK_HOURS: float = 4.0        # Hours threshold before scheduled slot

settings = Settings()
