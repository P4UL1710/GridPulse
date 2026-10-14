from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class TelemetryReading(BaseModel):
    kw: float
    gross_kw: Optional[float] = None
    solar_kw: Optional[float] = 0.0
    net_grid_kw: Optional[float] = None
    grid_import_kw: Optional[float] = None
    grid_export_kw: Optional[float] = 0.0
    solar_enabled: Optional[bool] = True
    solar_capacity_kw: Optional[float] = 3.5
    solar_today_kwh: Optional[float] = 0.0
    export_today_kwh: Optional[float] = 0.0
    voltage: float
    current_amps: float
    frequency: float
    power_factor: float
    thd_pct: Optional[float] = 2.8
    timestamp: str
    today_kwh: float
    avg_7day_kwh: float
    sparkline: List[float]
    scenario: str
    tou: Optional[Dict[str, Any]] = None

class TelemetrySimScenario(BaseModel):
    scenario: str  # "normal", "peak", "ac", "leak", "solar_boost", "inductive_sag"

class SolarToggleRequest(BaseModel):
    enabled: bool
