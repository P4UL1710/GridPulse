import time
import random
from fastapi import APIRouter, HTTPException, Depends
from app.config import settings
from app.database import get_database
from app.routers.auth import get_current_user_email

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/overview")
async def get_admin_overview():
    db = get_database()
    users_col = db.get_collection("users")
    complaints_col = db.get_collection("complaints")
    
    users = await users_col.find({}).to_list(length=500)
    complaints = await complaints_col.find({}).to_list(length=500)
    
    open_complaints = [c for c in complaints if c.get("status") != "Resolved"]
    in_progress = [c for c in open_complaints if c.get("status") == "In Progress"]
    new_submitted = [c for c in open_complaints if c.get("status") == "Submitted"]
    
    resolved = [c for c in complaints if c.get("resolution_hours") is not None]
    if resolved:
        avg_res = round(sum(c["resolution_hours"] for c in resolved) / len(resolved), 1)
    else:
        avg_res = 13.8
        
    locality_stats = [
        {"loc": "Green Hills", "kwh": 886, "complaints_in_area": 5, "status": "Peak Load", "pill": "pill-info"},
        {"loc": "Riverside", "kwh": 848, "complaints_in_area": 2, "status": "Normal Grid", "pill": "pill-good"},
        {"loc": "Sector 12", "kwh": 745, "complaints_in_area": 3, "status": "Elevated Complaints", "pill": "pill-warn"},
        {"loc": "Tech Park", "kwh": 724, "complaints_in_area": 3, "status": "Elevated Complaints", "pill": "pill-warn"},
        {"loc": "Lakeview", "kwh": 596, "complaints_in_area": 2, "status": "Normal Grid", "pill": "pill-good"},
        {"loc": "Old Town", "kwh": 569, "complaints_in_area": 2, "status": "Normal Grid", "pill": "pill-good"}
    ]
    
    # Recalculate complaint count by locality from real database
    for stat in locality_stats:
        actual_in_area = sum(1 for c in open_complaints if c.get("locality") == stat["loc"])
        if actual_in_area > 0:
            stat["complaints_in_area"] = actual_in_area
            if actual_in_area >= 4:
                stat["status"] = "Elevated Complaints"
                stat["pill"] = "pill-warn"
                
    category_counts = {
        "Billing discrepancy": 0,
        "Meter reading issue": 0,
        "Power outage": 0,
        "Voltage fluctuation": 0,
        "New connection / shifting": 0
    }
    for c in complaints:
        cat = c.get("category", "Billing discrepancy")
        if cat in category_counts:
            category_counts[cat] += 1
        else:
            category_counts[cat] = 1
            
    trend_days = [
        {"label": "23 Sep", "count": 3},
        {"label": "24 Sep", "count": 4},
        {"label": "25 Sep", "count": 2},
        {"label": "26 Sep", "count": 5},
        {"label": "27 Sep", "count": 7},
        {"label": "28 Sep", "count": 4},
        {"label": "29 Sep", "count": 3},
        {"label": "30 Sep", "count": 6},
        {"label": "1 Oct", "count": 5},
        {"label": "2 Oct", "count": 3},
        {"label": "3 Oct", "count": 4},
        {"label": "4 Oct", "count": 6},
        {"label": "5 Oct", "count": 4},
        {"label": "6 Oct", "count": len(new_submitted) or 3}
    ]
    
    return {
        "kpis": {
            "total_consumers": len(users) + 1274,
            "open_complaints_count": len(open_complaints),
            "in_progress_count": len(in_progress),
            "submitted_count": len(new_submitted),
            "avg_resolution_hours": avg_res,
            "peak_locality": locality_stats[0]["loc"],
            "peak_locality_kwh": locality_stats[0]["kwh"]
        },
        "locality_stats": locality_stats,
        "category_counts": category_counts,
        "trend_days": trend_days
    }

@router.get("/consumers")
async def get_consumers():
    db = get_database()
    users_col = db.get_collection("users")
    users = await users_col.find({}).to_list(length=200)
    
    results = []
    for u in users:
        results.append({
            "name": u["name"],
            "email": u["email"],
            "meter": u.get("meter", "MTR-00000"),
            "locality": u.get("locality", "Tech Park"),
            "mtd_units": 185 + (hash(u["email"]) % 120),
            "budget_low": u.get("budget_low", 1200.0),
            "budget_high": u.get("budget_high", 1500.0),
            "role": u.get("role", "citizen")
        })
    return results

@router.post("/simulate-consumer")
async def simulate_consumer():
    names = ["Kishore Kumar", "Sunil Joshi", "Radha Bhatt", "Naveen Chawla", "Pooja Hegde", "Manoj Saxena"]
    name = random.choice(names) + f" {random.randint(10, 99)}"
    locality = random.choice(settings.LOCALITIES)
    meter = f"MTR-{random.randint(10000, 89999)}"
    email = f"{name.lower().replace(' ', '')}@gridpulse.app"
    
    new_user = {
        "name": name,
        "email": email,
        "password": "password",
        "locality": locality,
        "meter": meter,
        "role": "citizen",
        "budget_low": 1200.0,
        "budget_high": 1600.0
    }
    
    db = get_database()
    users_col = db.get_collection("users")
    await users_col.insert_one(new_user)
    
    return {"message": f"Simulated consumer {name} created in {locality}", "user": new_user}

@router.post("/seed-more")
async def seed_more_complaints():
    cats = ["Billing discrepancy", "Power outage", "Voltage fluctuation"]
    names = ["Arun V.", "Deepa R.", "Farhan Q.", "Gita M.", "Harish P."]
    db = get_database()
    col = db.get_collection("complaints")
    now_ms = int(time.time() * 1000)
    
    added = []
    for i in range(5):
        token = f"GP-{random.randint(10000, 89999)}"
        c = {
            "token": token,
            "user_email": None,
            "user_name": names[i],
            "locality": random.choice(settings.LOCALITIES),
            "category": cats[i % len(cats)],
            "severity": "High" if i == 0 else "Normal",
            "description": "Simulated citizen issue reported via IVR/Smart Portal.",
            "mode": "online" if i % 2 == 0 else "offline",
            "status": "Submitted",
            "assigned_staff": settings.SUPPORT_STAFF[i % len(settings.SUPPORT_STAFF)]["name"],
            "raised_at": now_ms - (i + 1) * 3600 * 1000,
            "resolution_hours": None,
            "appointment_at": now_ms + (i + 5) * 3600 * 1000,
            "chart_attached": True,
            "demo": True
        }
        await col.insert_one(c)
        added.append(token)
        
    return {"message": "5 simulated complaints injected into urban queue", "tokens": added}
