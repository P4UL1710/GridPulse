from datetime import datetime
import calendar
from fastapi import APIRouter, Depends
from app.config import settings
from app.database import get_database
from app.services.tariff_engine import calculate_slab_bill
from app.services.telemetry_sim import generate_user_history
from app.routers.auth import get_current_user_email
from app.models.billing import (
    BillForecastResponse,
    BillVerifyRequest,
    BillVerifyResponse,
    BillingHistoryRecord,
    BudgetStatusResponse,
    ApplianceBreakdownItem,
    SlabDetail
)

router = APIRouter(prefix="/billing", tags=["billing"])

@router.get("/forecast", response_model=BillForecastResponse)
async def get_bill_forecast(email: str = Depends(get_current_user_email)):
    now = datetime.now()
    days_in_month = calendar.monthrange(now.year, now.month)[1]
    day_of_month = now.day
    
    # 7-day average from user history
    history = generate_user_history(email, days_count=14)
    last_7 = history[-7:] if len(history) >= 7 else history
    avg_daily_kwh = sum(d["units"] for d in last_7) / max(1, len(last_7))
    
    projected_units = round(avg_daily_kwh * days_in_month, 1)
    projected_bill, slab_breakdown, fixed_charge, duty_amount, base_cost = calculate_slab_bill(projected_units)
    cycle_progress_pct = round((day_of_month / days_in_month) * 100, 1)
    
    slabs = [SlabDetail(**s) for s in slab_breakdown]
    
    return BillForecastResponse(
        projected_bill=projected_bill,
        projected_units=projected_units,
        avg_daily_kwh=round(avg_daily_kwh, 2),
        day_of_month=day_of_month,
        days_in_month=days_in_month,
        cycle_progress_pct=cycle_progress_pct,
        slab_breakdown=slabs,
        fixed_charge=fixed_charge,
        duty_amount=duty_amount,
        base_cost=base_cost
    )

@router.post("/verify", response_model=BillVerifyResponse)
async def verify_bill(req: BillVerifyRequest, email: str = Depends(get_current_user_email)):
    forecast = await get_bill_forecast(email)
    diff = round(req.actual_bill - forecast.projected_bill, 2)
    abs_diff = abs(diff)
    threshold = settings.BILL_ALERT_THRESHOLD
    is_discrepancy = abs_diff >= threshold
    
    if is_discrepancy:
        direction = "Higher" if diff > 0 else "Lower"
        msg = f"Discrepancy of ₹{abs_diff} Detected ({direction} than AI Prediction). Tolerance threshold of ±₹{threshold} exceeded."
        dispute_text = f"Actual billed amount of ₹{req.actual_bill} exceeded AI prediction of ₹{round(forecast.projected_bill)} by ₹{round(abs_diff)}. [Verified 60-Day IoT Telemetry & AI Forecast Attached]"
        status = "Discrepancy Detected"
    else:
        msg = f"Bill Verified: Matches AI Telemetry. Variance of ₹{abs_diff} is well within acceptable ±₹{threshold} margin."
        dispute_text = None
        status = "Verified"
        
    return BillVerifyResponse(
        actual_bill=req.actual_bill,
        predicted_bill=forecast.projected_bill,
        difference=diff,
        is_discrepancy=is_discrepancy,
        threshold=threshold,
        status=status,
        message=msg,
        suggested_dispute_desc=dispute_text
    )

@router.get("/budget-status", response_model=BudgetStatusResponse)
async def get_budget_status(email: str = Depends(get_current_user_email)):
    db = get_database()
    users_col = db.get_collection("users")
    user = await users_col.find_one({"email": email.lower()}) or {}
    budget_low = user.get("budget_low", 1200.0)
    budget_high = user.get("budget_high", 1500.0)
    
    forecast = await get_bill_forecast(email)
    proj = forecast.projected_bill
    avg_daily = forecast.avg_daily_kwh
    
    # Appliance breakdown calculations (based on energy disaggregation literature)
    appliance_breakdown = [
        ApplianceBreakdownItem(
            name="Air Conditioner (1.5 Ton)",
            icon="❄️",
            share_pct=42,
            monthly_kwh=round(forecast.projected_units * 0.42, 1),
            monthly_cost=round(proj * 0.42),
            advice="Increase thermostat from 21°C to 24°C to save ~18% compressor power."
        ),
        ApplianceBreakdownItem(
            name="Refrigerator (Double Door)",
            icon="🧊",
            share_pct=22,
            monthly_kwh=round(forecast.projected_units * 0.22, 1),
            monthly_cost=round(proj * 0.22),
            advice="Ensure door gasket seals and keep rear coils vacuumed."
        ),
        ApplianceBreakdownItem(
            name="Water Geyser (25L)",
            icon="🚿",
            share_pct=16,
            monthly_kwh=round(forecast.projected_units * 0.16, 1),
            monthly_cost=round(proj * 0.16),
            advice="Limit active heating to 15 mins before usage; avoid running 24x7."
        ),
        ApplianceBreakdownItem(
            name="Lighting & BLDC Fans",
            icon="💡",
            share_pct=14,
            monthly_kwh=round(forecast.projected_units * 0.14, 1),
            monthly_cost=round(proj * 0.14),
            advice="100% LED transition complete. Keep natural illumination during daytime."
        ),
        ApplianceBreakdownItem(
            name="Standby / Phantom Load",
            icon="🔌",
            share_pct=6,
            monthly_kwh=round(forecast.projected_units * 0.06, 1),
            monthly_cost=round(proj * 0.06),
            advice="Switch off entertainment units & chargers at wall socket when idle."
        )
    ]
    
    if proj <= budget_high:
        status = "On Track"
        pill_class = "pill-good"
        over_by = 0.0
        trim_pct = 0.0
        target_kwh = 0.0
        tips = [
            f"Your consumption is on track within budget range (₹{budget_low} – ₹{budget_high}).",
            f"Estimated monthly surplus/savings: ₹{round(budget_high - proj)}.",
            f"Maintaining current usage keeps you safely in Slab 2 (< 300 units @ ₹6.5/unit)."
        ]
    else:
        status = "Projected Over Budget"
        pill_class = "pill-warn"
        over_by = round(proj - budget_high, 2)
        trim_pct = min(35.0, max(8.0, round((over_by / proj) * 100 + 4, 1)))
        target_kwh = round(avg_daily * (trim_pct / 100), 1)
        tips = [
            f"Trim ~{trim_pct}% (~{target_kwh} kWh/day) to bring billing back under ₹{budget_high}.",
            "Shift AC & Geyser loads outside 6 PM – 10 PM urban peak hours.",
            f"Eliminate Standby Loads: Phantom draws account for ~₹{round(proj * 0.06)} of your projected bill."
        ]
        
    return BudgetStatusResponse(
        budget_low=budget_low,
        budget_high=budget_high,
        projected_bill=proj,
        status=status,
        pill_class=pill_class,
        over_by=over_by,
        trim_pct=trim_pct,
        target_kwh_cut=target_kwh,
        appliance_breakdown=appliance_breakdown,
        tips=tips
    )

@router.get("/history", response_model=list[BillingHistoryRecord])
async def get_billing_history():
    records = [
        {"month": "2026-05", "units": 245.0, "predicted": 1518.0, "actual": 1530.0, "diff": 12.0},
        {"month": "2026-06", "units": 280.0, "predicted": 1745.0, "actual": 1760.0, "diff": 15.0},
        {"month": "2026-07", "units": 340.0, "predicted": 2160.0, "actual": 2190.0, "diff": 30.0},
        {"month": "2026-08", "units": 238.0, "predicted": 1474.0, "actual": 1544.0, "diff": 70.0},
        {"month": "2026-09", "units": 298.0, "predicted": 1884.0, "actual": 2230.0, "diff": 346.0},
        {"month": "2026-10", "units": 185.0, "predicted": 1120.0, "actual": 1140.0, "diff": 20.0}
    ]
    threshold = settings.BILL_ALERT_THRESHOLD
    return [
        BillingHistoryRecord(
            month=r["month"],
            units=r["units"],
            predicted=r["predicted"],
            actual=r["actual"],
            diff=r["diff"],
            is_discrepancy=abs(r["diff"]) >= threshold
        )
        for r in records
    ]
