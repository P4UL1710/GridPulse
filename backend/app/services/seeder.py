import time
from app.config import settings
from app.services.telemetry_sim import hash_str, mulberry32

DEMO_USERS = [
    {"name": "Asha Rao", "email": "demo@gridpulse.app", "password": "demo1234", "locality": "Tech Park", "meter": "MTR-40210", "role": "citizen", "budget_low": 1200.0, "budget_high": 1500.0},
    {"name": "Utility Admin", "email": "admin@gridpulse.app", "password": "admin", "locality": "Tech Park", "meter": "HQ-OPS-01", "role": "admin", "budget_low": 1500.0, "budget_high": 2500.0},
    {"name": "Rajesh Patel", "email": "rajesh@gridpulse.app", "password": "password", "locality": "Sector 12", "meter": "MTR-10842", "role": "citizen", "budget_low": 1000.0, "budget_high": 1400.0},
    {"name": "Sunita Verma", "email": "sunita@gridpulse.app", "password": "password", "locality": "Riverside", "meter": "MTR-29381", "role": "citizen", "budget_low": 1100.0, "budget_high": 1600.0},
    {"name": "Deepak Sharma", "email": "deepak@gridpulse.app", "password": "password", "locality": "Green Hills", "meter": "MTR-55421", "role": "citizen", "budget_low": 1400.0, "budget_high": 2000.0},
    {"name": "Kavita Menon", "email": "kavita@gridpulse.app", "password": "password", "locality": "Lakeview", "meter": "MTR-33910", "role": "citizen", "budget_low": 900.0, "budget_high": 1300.0},
    {"name": "Tariq Ansari", "email": "tariq@gridpulse.app", "password": "password", "locality": "Old Town", "meter": "MTR-88129", "role": "citizen", "budget_low": 850.0, "budget_high": 1250.0},
    {"name": "Rohan Mehra", "email": "rohan@gridpulse.app", "password": "password", "locality": "Sector 12", "meter": "MTR-12940", "role": "citizen", "budget_low": 1300.0, "budget_high": 1700.0},
    {"name": "Meera Nair", "email": "meera@gridpulse.app", "password": "password", "locality": "Tech Park", "meter": "MTR-40391", "role": "citizen", "budget_low": 1200.0, "budget_high": 1500.0},
    {"name": "Arjun Das", "email": "arjun@gridpulse.app", "password": "password", "locality": "Green Hills", "meter": "MTR-55823", "role": "citizen", "budget_low": 1600.0, "budget_high": 2200.0}
]

async def seed_database(db):
    # 1. Seed users
    users_col = db.get_collection("users")
    user_count = await users_col.count_documents({})
    if user_count == 0:
        for u in DEMO_USERS:
            await users_col.insert_one(u)
        print(f"[Seeder] Seeded {len(DEMO_USERS)} default users.")

    # 2. Seed complaints
    complaints_col = db.get_collection("complaints")
    complaint_count = await complaints_col.count_documents({})
    if complaint_count == 0:
        now_ms = int(time.time() * 1000)
        rng = mulberry32(hash_str('gridpulse-urban-ops-v3'))
        
        cats = [
            "Billing discrepancy",
            "Meter reading issue",
            "Power outage",
            "Voltage fluctuation",
            "New connection / shifting"
        ]
        statuses = ["Resolved", "Resolved", "In Progress", "Under Review", "Submitted"]
        names = ["Rohan Roy", "Kavita S.", "Tariq A.", "Meenakshi K.", "Deepak N.", "Sunil V.", "Preeti C.", "Vikrant B."]
        
        initial_complaints = []
        
        # Pre-seed 4 specific tickets for Asha Rao
        initial_complaints.append({
            "token": "GP-50142",
            "user_email": "demo@gridpulse.app",
            "user_name": "Asha Rao",
            "locality": "Tech Park",
            "category": "Billing discrepancy",
            "severity": "High",
            "description": "Actual billed amount of ₹2,180 exceeded AI prediction by ₹340. [Verified 60-Day IoT Telemetry & AI Forecast Attached]",
            "mode": "online",
            "status": "In Progress",
            "assigned_staff": "Ananya Sen",
            "raised_at": now_ms - int(36 * 3600 * 1000),
            "resolution_hours": None,
            "appointment_at": now_ms + int(2.5 * 3600 * 1000),  # In 2.5 hours -> inside 4h lock!
            "chart_attached": True,
            "demo": True
        })
        initial_complaints.append({
            "token": "GP-49820",
            "user_email": "demo@gridpulse.app",
            "user_name": "Asha Rao",
            "locality": "Tech Park",
            "category": "Voltage fluctuation",
            "severity": "Normal",
            "description": "Frequent night drops to 195V recorded between 7:30 PM and 9:45 PM.",
            "mode": "offline",
            "status": "Under Review",
            "assigned_staff": "Vikram Malhotra",
            "raised_at": now_ms - int(18 * 3600 * 1000),
            "resolution_hours": None,
            "appointment_at": now_ms + int(26 * 3600 * 1000),  # 26h away -> unlocked!
            "chart_attached": True,
            "demo": True
        })
        initial_complaints.append({
            "token": "GP-48190",
            "user_email": "demo@gridpulse.app",
            "user_name": "Asha Rao",
            "locality": "Tech Park",
            "category": "Meter reading issue",
            "severity": "Normal",
            "description": "Smart meter telemetry was frozen during afternoon peak.",
            "mode": "offline",
            "status": "Resolved",
            "assigned_staff": "Rajesh Kumar",
            "raised_at": now_ms - int(6 * 86400 * 1000),
            "resolution_hours": 11.4,
            "appointment_at": now_ms - int(5 * 86400 * 1000),
            "chart_attached": True,
            "demo": True
        })
        initial_complaints.append({
            "token": "GP-46905",
            "user_email": "demo@gridpulse.app",
            "user_name": "Asha Rao",
            "locality": "Tech Park",
            "category": "New connection / shifting",
            "severity": "Normal",
            "description": "Sanctioned load upgrade to 3.0 kW completed.",
            "mode": "online",
            "status": "Resolved",
            "assigned_staff": "Amit Verma",
            "raised_at": now_ms - int(18 * 86400 * 1000),
            "resolution_hours": 16.8,
            "appointment_at": now_ms - int(17 * 86400 * 1000),
            "chart_attached": True,
            "demo": True
        })
        
        # Seed 42 city-wide complaints for urban operations
        for i in range(42):
            days_ago = int(rng() * 14)
            raised = now_ms - int(days_ago * 86400 * 1000) - int(rng() * 72000 * 1000)
            status = statuses[int(rng() * len(statuses))]
            staff = settings.SUPPORT_STAFF[int(rng() * len(settings.SUPPORT_STAFF))]["name"]
            res_hours = round(6.0 + rng() * 28.0, 1) if status == "Resolved" else None
            mode = "online" if rng() > 0.45 else "offline"
            
            initial_complaints.append({
                "token": f"GP-{10000 + int(rng() * 89999)}",
                "user_email": None,
                "user_name": names[int(rng() * len(names))],
                "locality": settings.LOCALITIES[int(rng() * len(settings.LOCALITIES))],
                "category": cats[int(rng() * len(cats))],
                "severity": "High" if rng() > 0.7 else "Normal",
                "description": "Logged into urban operations queue for resolution.",
                "mode": mode,
                "status": status,
                "assigned_staff": staff,
                "raised_at": raised,
                "resolution_hours": res_hours,
                "appointment_at": raised + int(86400 * 1000) + int(rng() * 43200 * 1000),
                "chart_attached": True,
                "demo": True
            })
            
        for c in initial_complaints:
            await complaints_col.insert_one(c)
        print(f"[Seeder] Seeded {len(initial_complaints)} complaints.")

    # 3. Seed notifications
    notif_col = db.get_collection("notifications")
    notif_count = await notif_col.count_documents({})
    if notif_count == 0:
        now_ms = int(time.time() * 1000)
        sample_notifs = [
            {"user_email": "demo@gridpulse.app", "text": "Welcome to GridPulse: Smart Electricity Monitoring active.", "time": now_ms - 3600000, "read": True},
            {"user_email": "demo@gridpulse.app", "text": "Reminder: Slot for GP-50142 locks in 1.2 hours.", "time": now_ms - 1800000, "read": False},
            {"user_email": "demo@gridpulse.app", "text": "Notice: Verified discrepancy evidence ready for cycle #26-09.", "time": now_ms - 900000, "read": False}
        ]
        for n in sample_notifs:
            await notif_col.insert_one(n)
        print("[Seeder] Seeded initial notifications.")
