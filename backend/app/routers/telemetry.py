from fastapi import APIRouter, Depends
from app.models.telemetry import TelemetryReading, TelemetrySimScenario, SolarToggleRequest
from app.services.telemetry_sim import telemetry_engine, generate_user_history
from app.routers.auth import get_current_user_email

router = APIRouter(prefix="/telemetry", tags=["telemetry"])

@router.get("/live", response_model=TelemetryReading)
async def get_live_telemetry():
    reading = telemetry_engine.get_current_reading()
    return TelemetryReading(**reading)

@router.post("/scenario")
async def set_simulator_scenario(req: TelemetrySimScenario):
    active_scenario = telemetry_engine.set_scenario(req.scenario)
    return {"message": f"Scenario set to {active_scenario}", "scenario": active_scenario}

@router.post("/solar-toggle")
async def toggle_solar_rooftop(req: SolarToggleRequest):
    status = telemetry_engine.toggle_solar(req.enabled)
    return {"message": f"Solar PV array {'activated' if status else 'disconnected'}", "solar_enabled": status}

@router.get("/history")
async def get_telemetry_history(email: str = Depends(get_current_user_email)):
    history = generate_user_history(email, days_count=90)
    return {"email": email, "days": history, "total_days": len(history)}
