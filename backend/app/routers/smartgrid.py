import math
import random
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException

from app.services.telemetry_sim import telemetry_engine
from app.routers.auth import get_current_user_email

router = APIRouter(prefix="/smartgrid", tags=["smartgrid"])

# In-memory GIS state so admin dispatches persist during runtime
GIS_FEEDERS = [
    {
        "id": "SS-01",
        "name": "Sector 4 North Substation",
        "location": "Sector 4 Civic Center",
        "lat": 28.6139,
        "lng": 77.2090,
        "rating_kva": 500,
        "load_pct": 68.4,
        "oil_temp_c": 58.2,
        "voltage_a": 231.2,
        "voltage_b": 229.8,
        "voltage_c": 230.5,
        "power_factor": 0.96,
        "status": "NORMAL",
        "consumers_count": 1420,
        "crew_dispatched": False,
        "solar_penetration_pct": 24.5
    },
    {
        "id": "SS-02",
        "name": "Sector 7 Commercial Complex",
        "location": "Sector 7 Market Road",
        "lat": 28.6250,
        "lng": 77.2180,
        "rating_kva": 750,
        "load_pct": 92.1,
        "oil_temp_c": 74.5,
        "voltage_a": 224.1,
        "voltage_b": 221.4,
        "voltage_c": 226.0,
        "power_factor": 0.89,
        "status": "OVERLOAD_WARNING",
        "consumers_count": 850,
        "crew_dispatched": False,
        "solar_penetration_pct": 8.2
    },
    {
        "id": "SS-03",
        "name": "Industrial Area Phase 1",
        "location": "Phase 1 Heavy Feeder",
        "lat": 28.6380,
        "lng": 77.1950,
        "rating_kva": 1000,
        "load_pct": 78.0,
        "oil_temp_c": 65.1,
        "voltage_a": 228.4,
        "voltage_b": 230.1,
        "voltage_c": 229.0,
        "power_factor": 0.84,
        "status": "POWER_FACTOR_ALERT",
        "consumers_count": 320,
        "crew_dispatched": False,
        "solar_penetration_pct": 14.0
    },
    {
        "id": "SS-04",
        "name": "Cyber Park Sector 18 Feeder",
        "location": "IT Expressway Hub",
        "lat": 28.6010,
        "lng": 77.2340,
        "rating_kva": 630,
        "load_pct": 54.3,
        "oil_temp_c": 52.0,
        "voltage_a": 232.0,
        "voltage_b": 233.1,
        "voltage_c": 231.5,
        "power_factor": 0.98,
        "status": "NORMAL",
        "consumers_count": 2100,
        "crew_dispatched": False,
        "solar_penetration_pct": 38.0
    },
    {
        "id": "SS-05",
        "name": "Green Valley Renewable Hub",
        "location": "Eco Zone Sector 22",
        "lat": 28.5890,
        "lng": 77.2020,
        "rating_kva": 500,
        "load_pct": 41.2,
        "oil_temp_c": 48.3,
        "voltage_a": 234.5,
        "voltage_b": 233.8,
        "voltage_c": 235.1,
        "power_factor": 0.99,
        "status": "SOLAR_FEEDBACK",
        "consumers_count": 1250,
        "crew_dispatched": False,
        "solar_penetration_pct": 65.4
    },
    {
        "id": "SS-06",
        "name": "Residential Block C Transformer #4",
        "location": "Block C Lane 8",
        "lat": 28.6420,
        "lng": 77.2250,
        "rating_kva": 315,
        "load_pct": 98.4,
        "oil_temp_c": 82.6,
        "voltage_a": 215.3,
        "voltage_b": 218.0,
        "voltage_c": 212.7,
        "power_factor": 0.91,
        "status": "CRITICAL_OVERHEAT",
        "consumers_count": 410,
        "crew_dispatched": False,
        "solar_penetration_pct": 11.8
    }
]

# Request & Response Schemas
class EvScheduleRequest(BaseModel):
    load_type: str = "4_wheeler"  # "2_wheeler", "4_wheeler", "washing_machine", "water_heater"
    battery_kwh: float = 30.0
    charger_kw: float = 7.4
    target_departure_hour: int = 8  # 8 AM next day
    current_soc_pct: int = 25
    target_soc_pct: int = 90

class AiAdvisorRequest(BaseModel):
    query: str
    consumer_context: Optional[Dict[str, Any]] = None

@router.get("/tou")
async def get_tou_schedule():
    """
    Returns 24-hour dynamic Time-of-Use tariff profile, current tier, and peak hour windows.
    """
    now = datetime.now()
    current_hour = now.hour

    hours = []
    for h in range(24):
        if 18 <= h <= 22:
            tier = "Peak"
            rate = 9.10
            badge = "danger"
            description = "High grid demand - 1.4x surcharge"
        elif (11 <= h <= 16) or (0 <= h <= 5):
            tier = "Off-Peak"
            rate = 4.88
            badge = "good"
            description = "Solar surplus & overnight - 25% discount"
        else:
            tier = "Normal"
            rate = 6.50
            badge = "info"
            description = "Standard baseline tariff"
        hours.append({
            "hour": h,
            "label": f"{h:02d}:00",
            "tier": tier,
            "rate_inr": rate,
            "badge": badge,
            "description": description,
            "is_current": (h == current_hour)
        })

    # Current status
    current_tier_data = hours[current_hour]
    
    # Calculate time to next transition
    next_hour = (current_hour + 1) % 24
    while hours[next_hour]["tier"] == current_tier_data["tier"]:
        next_hour = (next_hour + 1) % 24
    
    hours_to_transition = (next_hour - current_hour) % 24
    if hours_to_transition == 0:
        hours_to_transition = 24

    return {
        "current_hour": current_hour,
        "current_tier": current_tier_data["tier"],
        "current_rate_inr": current_tier_data["rate_inr"],
        "current_badge": current_tier_data["badge"],
        "hours_to_transition": hours_to_transition,
        "next_tier": hours[next_hour]["tier"],
        "next_rate_inr": hours[next_hour]["rate_inr"],
        "schedule": hours,
        "recommendation": "Shift EV charging, laundry, and water heating to Off-Peak hours (11:00-16:00 or 23:00-05:00) to cut costs by up to 46% vs peak rate."
    }

@router.post("/ev-schedule")
async def calculate_ev_charging_schedule(req: EvScheduleRequest):
    """
    Smart EV / Heavy Appliance Charging Scheduler that identifies the cheapest
    tariff windows and calculates ₹ savings vs charging during peak hours.
    """
    # Energy needed
    soc_diff = max(5, req.target_soc_pct - req.current_soc_pct)
    kwh_needed = round((req.battery_kwh * (soc_diff / 100.0)), 2)
    hours_needed = round(kwh_needed / max(1.0, req.charger_kw), 1)

    # 24h rates
    def get_rate_at_hour(h: int) -> float:
        if 18 <= h <= 22:
            return 9.10
        elif (11 <= h <= 16) or (0 <= h <= 5):
            return 4.88
        else:
            return 6.50

    # Best overnight charging window: start at 23:00 or 00:00
    start_hour = 0
    end_hour = int((start_hour + math.ceil(hours_needed)) % 24)

    # Cost calculations
    # Off-peak cost
    avg_optimized_rate = 4.88
    optimized_cost = round(kwh_needed * avg_optimized_rate, 2)

    # Peak cost if user plugged in immediately at 7 PM (19:00)
    unoptimized_rate = 9.10
    unoptimized_cost = round(kwh_needed * unoptimized_rate, 2)

    savings_inr = round(unoptimized_cost - optimized_cost, 2)
    savings_pct = round((savings_inr / unoptimized_cost) * 100, 1) if unoptimized_cost > 0 else 0.0

    # Carbon offset (0.82 kg CO2 per kWh grid reduction / solar sync)
    carbon_offset_kg = round(kwh_needed * 0.42, 2)

    return {
        "load_type": req.load_type,
        "battery_capacity_kwh": req.battery_kwh,
        "kwh_required": kwh_needed,
        "charger_speed_kw": req.charger_kw,
        "charging_duration_hours": hours_needed,
        "recommended_window": {
            "start": "11:30 PM",
            "end": f"{int((23.5 + hours_needed) % 24):02d}:30 AM",
            "tariff_tier": "Off-Peak (₹4.88/kWh)",
            "ready_by": f"{req.target_departure_hour:02d}:00 AM"
        },
        "optimized_cost_inr": optimized_cost,
        "unoptimized_cost_inr": unoptimized_cost,
        "savings_inr": savings_inr,
        "savings_pct": savings_pct,
        "carbon_offset_kg": carbon_offset_kg,
        "smart_tip": f"Scheduled automated smart charge will save you ₹{savings_inr} per full charge cycle, saving ₹{int(savings_inr * 15)} monthly."
    }

@router.get("/gis-map")
async def get_gis_distribution_map():
    """
    Returns real-time urban feeder substations, transformer health, oil temperature,
    and active phase diagnostic status for smart grid operations.
    """
    total_transformers = len(GIS_FEEDERS)
    overloaded = sum(1 for f in GIS_FEEDERS if f["status"] in ["OVERLOAD_WARNING", "CRITICAL_OVERHEAT"])
    avg_pf = round(sum(f["power_factor"] for f in GIS_FEEDERS) / total_transformers, 2)
    total_consumers = sum(f["consumers_count"] for f in GIS_FEEDERS)

    return {
        "feeders": GIS_FEEDERS,
        "summary": {
            "total_feeders": total_transformers,
            "overloaded_count": overloaded,
            "average_grid_pf": avg_pf,
            "total_consumers_monitored": total_consumers,
            "grid_frequency_hz": 50.02,
            "system_health": "WARNING" if overloaded > 0 else "OPTIMAL"
        }
    }

@router.post("/gis-dispatch/{feeder_id}")
async def dispatch_gis_crew(feeder_id: str):
    """
    Simulates emergency line crew dispatch to balance load and cool transformer.
    """
    feeder = next((f for f in GIS_FEEDERS if f["id"] == feeder_id), None)
    if not feeder:
        raise HTTPException(status_code=404, detail="Feeder substation not found")

    feeder["crew_dispatched"] = True
    # Simulate partial load shedding or cooling
    if feeder["status"] == "CRITICAL_OVERHEAT":
        feeder["load_pct"] = round(feeder["load_pct"] * 0.78, 1)
        feeder["oil_temp_c"] = 62.4
        feeder["status"] = "MAINTENANCE_IN_PROGRESS"
    elif feeder["status"] == "OVERLOAD_WARNING":
        feeder["load_pct"] = round(feeder["load_pct"] * 0.85, 1)
        feeder["oil_temp_c"] = 59.0
        feeder["status"] = "NORMAL"

    return {
        "message": f"Emergency Grid Line Crew dispatched to {feeder['name']} ({feeder_id}). Phase balancing initiated.",
        "feeder": feeder
    }

@router.get("/power-quality")
async def get_power_quality_diagnostics():
    """
    Returns deep electrical power quality diagnostics:
    Power Factor, Total Harmonic Distortion (THD), Reactive Power (kVAR),
    and APFC capacitor bank sizing recommendations.
    """
    reading = telemetry_engine.get_current_reading()
    pf = reading["power_factor"]
    thd = reading["thd_pct"]
    kw = reading["kw"]
    voltage = reading["voltage"]

    # Calculate reactive power kVAR: Q = P * tan(acos(pf))
    try:
        phi = math.acos(min(1.0, max(0.5, pf)))
        kvar = round(kw * math.tan(phi), 2)
    except Exception:
        kvar = 0.45

    # Target PF = 0.98
    target_phi = math.acos(0.98)
    target_kvar = kw * math.tan(target_phi)
    required_cap_kvar = max(0.0, round(kvar - target_kvar, 2))

    # Penalty risk assessment: Statutory threshold is 0.90
    if pf < 0.90:
        pf_status = "PENALTY_RISK"
        penalty_inr_mo = round((0.90 - pf) * 100 * 85.0, 0)
        action_required = f"PF is {pf} (below 0.90 threshold). High inductive load from AC compressors or motors detected. Monthly reactive surcharge risk: ₹{penalty_inr_mo}."
    elif pf < 0.95:
        pf_status = "MODERATE"
        penalty_inr_mo = 0.0
        action_required = f"PF is {pf}. Acceptable, but room for optimization to reach 0.98+ for peak efficiency."
    else:
        pf_status = "EXCELLENT"
        penalty_inr_mo = 0.0
        action_required = "Power factor is outstanding (>0.95). Negligible reactive losses on internal wiring."

    # Harmonic analysis (IEEE 519 standard: THD < 5.0%)
    if thd > 5.0:
        thd_status = "HARMONIC_DISTORTION_HIGH"
        thd_note = f"THD is {thd}% (exceeds IEEE 519 5% guideline). Inverter switching noise or non-linear electronics detected. Consider line reactor choke."
    else:
        thd_status = "CLEAN_SINE_WAVE"
        thd_note = f"THD is {thd}%, well within safe operational limits (< 5.0%). Clean sinusoidal voltage wave."

    return {
        "active_power_kw": kw,
        "reactive_power_kvar": kvar,
        "voltage_rms": voltage,
        "power_factor": pf,
        "pf_status": pf_status,
        "penalty_risk_inr": penalty_inr_mo,
        "thd_pct": thd,
        "thd_status": thd_status,
        "thd_note": thd_note,
        "recommended_apfc_kvar": required_cap_kvar,
        "action_required": action_required,
        "frequency_hz": reading["frequency"],
        "voltage_sag_detected": voltage < 220.0
    }

@router.post("/ai-advisor")
async def get_ai_energy_advisor(req: AiAdvisorRequest):
    """
    AI Energy Advisor that provides conversational analysis, tariff arbitrage tips,
    and personalized savings recommendations based on consumer's live load & telemetry.
    """
    reading = telemetry_engine.get_current_reading()
    q = req.query.lower()

    if "solar" in q or "panel" in q or "net-metering" in q:
        reply = (
            "Based on your recent 90-day consumption (avg 6.8 kWh/day), a **3.5 kW Rooftop Solar PV system** "
            "is ideally sized for your connection. At an average generation of 13.5 kWh/day, you would offset 100% "
            "of your daytime load and export approx 4.2 kWh/day back to the grid under net-metering (credited at ₹3.80/kWh). "
            "This will reduce your average monthly bill from ~₹1,850 down to the minimum fixed charge of ~₹280, "
            "delivering an estimated ROI payback period of 3.2 years with central PM Surya Ghar Muft Bijli Yojana subsidies."
        )
        action = "Explore Net-Metering Registration"
        savings_est = "₹18,840 / year"
    elif "ev" in q or "car" in q or "scooter" in q or "charge" in q:
        reply = (
            "To maximize savings on EV charging, always schedule charging during our **Off-Peak ToU window** "
            "(11:30 PM to 05:30 AM) where the tariff drops to **₹4.88/kWh** compared to the peak rate of **₹9.10/kWh**. "
            "For a 30 kWh 4-wheeler EV battery, charging overnight costs just ₹146 per full cycle versus ₹273 at peak hours, "
            "saving you ₹127 every single charge. Enable our Smart EV Scheduler to automate this switch."
        )
        action = "Open EV Smart Scheduler"
        savings_est = "₹1,900 / month"
    elif "ac" in q or "cool" in q or "temperature" in q or "air condition" in q:
        reply = (
            "Raising your AC thermostat by just 2°C (from 22°C to 24°C) cuts compressor duty cycle by 18-24%, saving "
            "approximately 1.8 units (kWh) per 8-hour cycle. In addition, cleaning condenser coils reduces inrush power spikes. "
            "We also recommend pre-cooling your living space between 2:00 PM and 4:00 PM (during solar off-peak rates) "
            "and setting AC to Eco/25°C between 6:00 PM and 10:00 PM (Peak Tariff window)."
        )
        action = "Set AC Peak Saver Reminder"
        savings_est = "₹460 / month"
    elif "bill" in q or "reduce" in q or "save" in q or "high" in q:
        reply = (
            f"Your meter is currently pulling {reading['kw']} kW. Your projected monthly usage is ~204 units. "
            "Here are your top 3 immediate cost-cutting actions:\n"
            "1. **Peak Tariff Avoidance (6 PM - 10 PM)**: Shift heavy washing machines and geysers away from this 1.4x surcharge window (Save ~₹320/mo).\n"
            "2. **Phantom / Standby Load**: Turn off idle set-top boxes, microwave displays, and PC peripherals overnight (Save ~₹140/mo).\n"
            "3. **Power Factor Optimization**: Your current PF is {reading['power_factor']}. Maintaining PF above 0.95 prevents inductive surcharges."
        )
        action = "Apply Energy Budget Cap"
        savings_est = "₹580 / month"
    elif "power factor" in q or "voltage" in q or "thd" in q:
        reply = (
            f"Grid diagnostics indicate your current Power Factor is **{reading['power_factor']}** and voltage is **{reading['voltage']}V**. "
            "A lagging power factor below 0.90 triggers inductive penalty charges on commercial meters. "
            "For homes, low PF increases current flow, causing heating losses in wiring. If you are operating heavy inductive motors "
            "(water pump, workshop tools), installing a small capacitor bank will stabilize voltage and protect your appliances."
        )
        action = "Review Power Quality HUD"
        savings_est = "₹340 / month"
    else:
        reply = (
            f"GridPulse AI Advisor is active. Your real-time draw is **{reading['kw']} kW** at **{reading['voltage']}V** "
            f"under the **{reading.get('tou', {}).get('period', 'Standard')}** tariff (₹{reading.get('tou', {}).get('rate_inr', '6.50')}/kWh). "
            "You can ask me about Solar Net-Metering ROI, EV charging schedules, Peak tariff avoidance, or AC temperature efficiency."
        )
        action = "Check ToU Rate Schedule"
        savings_est = "₹400 / month"

    return {
        "reply": reply,
        "suggested_action": action,
        "projected_savings": savings_est,
        "active_kw": reading["kw"],
        "tariff_tier": reading.get("tou", {}).get("period", "Standard Rate"),
        "timestamp": datetime.now().strftime("%I:%M %p")
    }

@router.get("/leaderboard")
async def get_sustainability_leaderboard():
    """
    Returns urban sector energy efficiency & rooftop solar prosumer community leaderboard.
    """
    sectors = [
        {"rank": 1, "sector": "Sector 22 (Green Valley)", "solar_gen_mwh": 142.8, "efficiency_score": 96, "co2_offset_tons": 58.4, "badge": "Platinum Green"},
        {"rank": 2, "sector": "Sector 18 (Cyber Park)", "solar_gen_mwh": 118.4, "efficiency_score": 91, "co2_offset_tons": 48.2, "badge": "Gold Clean"},
        {"rank": 3, "sector": "Sector 4 (Civic Enclave)", "solar_gen_mwh": 84.2, "efficiency_score": 85, "co2_offset_tons": 34.6, "badge": "Silver Solar"},
        {"rank": 4, "sector": "Sector 7 (Market Central)", "solar_gen_mwh": 62.1, "efficiency_score": 79, "co2_offset_tons": 25.4, "badge": "Bronze"},
        {"rank": 5, "sector": "Block C (West Extension)", "solar_gen_mwh": 45.0, "efficiency_score": 72, "co2_offset_tons": 18.5, "badge": "Participant"}
    ]
    return {
        "leaderboard": sectors,
        "city_total_solar_mwh": 452.5,
        "total_co2_offset_tons": 185.1,
        "your_sector": "Sector 4 (Civic Enclave)",
        "your_rank": 3
    }
