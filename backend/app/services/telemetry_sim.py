import math
import random
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any

# Initial sparkline seed buffer
DEFAULT_SPARKLINE = [
    1.42, 1.48, 1.55, 1.62, 1.58, 1.51, 1.45, 1.68, 1.82, 1.95,
    2.10, 1.88, 1.74, 1.65, 1.58, 1.72, 1.85, 1.92, 1.88, 1.76,
    1.69, 1.75, 1.82, 1.90, 1.86, 1.81, 1.84, 1.86
]

class TelemetryEngine:
    def __init__(self):
        self.scenario = "normal"
        self.live_base_kw = 1.35
        self.today_units_accum = 18.4
        self.solar_today_accum = 9.8
        self.export_today_accum = 3.6
        self.spark_buffer = list(DEFAULT_SPARKLINE)
        self.last_tick_time = time.time()
        self.solar_enabled = True
        self.solar_capacity_kw = 3.5

    def set_scenario(self, scenario: str):
        if scenario in ["normal", "peak", "ac", "leak", "solar_boost", "inductive_sag"]:
            self.scenario = scenario
        return self.scenario

    def toggle_solar(self, enabled: bool):
        self.solar_enabled = enabled
        return self.solar_enabled

    def get_current_reading(self) -> Dict[str, Any]:
        now_dt = datetime.now()
        hour = now_dt.hour
        minute = now_dt.minute
        
        # Base diurnal multiplier
        if 18 <= hour <= 22:
            mult = 1.4
        elif 0 <= hour <= 5:
            mult = 0.45
        else:
            mult = 1.0
            
        # Scenario override
        if self.scenario == "peak":
            mult = 2.8
        elif self.scenario == "ac":
            mult = 3.6
        elif self.scenario == "leak":
            mult = 5.2
        elif self.scenario == "inductive_sag":
            mult = 3.2
            
        noise = (random.random() - 0.5) * 0.35
        gross_kw = max(0.4, round(self.live_base_kw * mult + noise, 2))
        
        # Calculate real-time Solar generation curve
        # Solar active between 6:00 and 18:00
        solar_kw = 0.0
        if self.solar_enabled:
            time_decimal = hour + (minute / 60.0)
            if 6.0 <= time_decimal <= 18.0:
                # Bell-shaped irradiance profile peaking at 12:30
                solar_angle = math.pi * (time_decimal - 6.0) / 12.0
                irradiance_factor = math.sin(solar_angle) ** 1.35
                sun_noise = 0.92 + (random.random() * 0.16)
                solar_kw = round(self.solar_capacity_kw * irradiance_factor * sun_noise, 2)
                if self.scenario == "solar_boost":
                    solar_kw = round(self.solar_capacity_kw * 1.15, 2)
            else:
                solar_kw = 0.0

        # Net Grid import or export
        net_grid_kw = round(gross_kw - solar_kw, 2)
        grid_import_kw = max(0.0, net_grid_kw)
        grid_export_kw = max(0.0, round(solar_kw - gross_kw, 2)) if net_grid_kw < 0 else 0.0

        # Update sparkline buffer (tracking net grid draw)
        self.spark_buffer.append(gross_kw)
        if len(self.spark_buffer) > 28:
            self.spark_buffer.pop(0)
            
        # Accumulate kWh (assuming elapsed interval)
        now_ts = time.time()
        elapsed = min(10.0, max(1.0, now_ts - self.last_tick_time))
        self.last_tick_time = now_ts
        self.today_units_accum += grid_import_kw * (elapsed / 3600.0)
        self.solar_today_accum += solar_kw * (elapsed / 3600.0)
        self.export_today_accum += grid_export_kw * (elapsed / 3600.0)
        
        # Grid Power Quality Parameters
        base_v = 230.0
        v_drop = 6.2 if gross_kw > 4.0 or self.scenario == "inductive_sag" else (3.2 if gross_kw > 3.0 else 0.0)
        voltage = round(base_v + (random.random() - 0.5) * 3.5 - v_drop, 1)
        current_amps = round((gross_kw * 1000.0) / max(180.0, voltage), 1)
        frequency = round(50.0 + (random.random() - 0.5) * 0.08, 2)
        
        # Power factor & Harmonics
        if self.scenario == "inductive_sag":
            pf = round(0.82 + (random.random() * 0.03), 2)  # Poor PF! Triggers penalty alert
            thd = round(7.8 + (random.random() * 1.2), 1)   # High THD
        elif gross_kw > 3.5:
            pf = round(0.92 - (random.random() * 0.03), 2)
            thd = round(4.5 + (random.random() * 0.8), 1)
        else:
            pf = round(0.98 - (random.random() * 0.02), 2)
            thd = round(2.8 + (random.random() * 0.6), 1)

        # Dynamic Time-of-Use Rate
        # Peak: 18 to 22 (6 PM - 10 PM) -> 1.4x
        # Solar / Off-Peak: 11 to 16 (11 AM - 4 PM) & 0 to 5 -> 0.75x
        # Normal: all other hours -> 1.0x
        if 18 <= hour <= 22:
            tou_period = "Peak Tariff (1.4x)"
            tou_rate_inr = 9.10
            tou_badge = "pill-danger"
        elif (11 <= hour <= 16) or (0 <= hour <= 5):
            tou_period = "Off-Peak / Solar Surplus (0.75x)"
            tou_rate_inr = 4.88
            tou_badge = "pill-good"
        else:
            tou_period = "Standard Rate (1.0x)"
            tou_rate_inr = 6.50
            tou_badge = "pill-info"

        return {
            "kw": gross_kw,
            "gross_kw": gross_kw,
            "solar_kw": solar_kw,
            "net_grid_kw": net_grid_kw,
            "grid_import_kw": grid_import_kw,
            "grid_export_kw": grid_export_kw,
            "solar_enabled": self.solar_enabled,
            "solar_capacity_kw": self.solar_capacity_kw,
            "solar_today_kwh": round(self.solar_today_accum, 2),
            "export_today_kwh": round(self.export_today_accum, 2),
            "voltage": voltage,
            "current_amps": current_amps,
            "frequency": frequency,
            "power_factor": pf,
            "thd_pct": thd,
            "timestamp": now_dt.strftime("%I:%M:%S %p"),
            "today_kwh": round(self.today_units_accum, 1),
            "avg_7day_kwh": 6.8,
            "sparkline": list(self.spark_buffer),
            "scenario": self.scenario,
            "tou": {
                "period": tou_period,
                "rate_inr": tou_rate_inr,
                "badge": tou_badge,
                "hour": hour
            }
        }

telemetry_engine = TelemetryEngine()

def hash_str(s: str) -> int:
    h = 0
    for char in s:
        h = (31 * h + ord(char)) & 0xFFFFFFFF
    return h

def mulberry32(seed: int):
    state = seed
    def rng():
        nonlocal state
        state = (state + 0x6D2B79F5) & 0xFFFFFFFF
        t = ((state ^ (state >> 15)) * (1 | state)) & 0xFFFFFFFF
        t = (t + (((t ^ (t >> 7)) * (61 | t)) & 0xFFFFFFFF)) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296.0
    return rng

def generate_user_history(email: str, days_count: int = 90) -> List[Dict[str, Any]]:
    rng = mulberry32(hash_str(email + "-history-v3"))
    base = 5.2
    days = []
    today = datetime.now().date()
    
    for i in range(days_count, -1, -1):
        d = today - timedelta(days=i)
        weekday = d.weekday()
        weekend_boost = 1.35 if weekday in (5, 6) else 1.0
        noise = 0.85 + rng() * 0.35
        units = round(base * weekend_boost * noise, 2)
        solar_gen = round(3.8 * (0.8 + rng() * 0.4), 2)
        peak_kw = round((units / 5.2) + rng() * 0.7, 2)
        days.append({
            "date": d.isoformat(),
            "units": units,
            "solar_kwh": solar_gen,
            "net_kwh": max(0.5, round(units - solar_gen * 0.65, 2)),
            "peak_kw": peak_kw
        })
    return days
