from typing import List, Dict, Tuple
from app.config import settings

def calculate_slab_bill(units: float) -> Tuple[float, List[Dict], float, float, float]:
    """
    Computes slab-based electricity bill according to urban multi-slab tariff structure:
      - 0 to 100 kWh: ₹4.50/unit
      - 101 to 300 kWh: ₹6.50/unit
      - >300 kWh: ₹8.20/unit
    Plus Fixed Meter Charge (₹60) and 5% Electricity Duty.
    Returns: (total_bill, breakdown_slabs, fixed_charge, duty_amount, base_cost)
    """
    remaining = max(0.0, float(units))
    last_cap = 0.0
    base_cost = 0.0
    breakdown = []
    
    for i, slab in enumerate(settings.TARIFF_SLABS):
        cap = slab["upto"]
        rate = slab["rate"]
        band_size = cap - last_cap
        
        consumed_in_slab = min(remaining, band_size)
        slab_cost = consumed_in_slab * rate
        base_cost += slab_cost
        
        if cap == float("inf"):
            label = f"> {int(last_cap)} units (@ ₹{rate}/unit)"
        else:
            label = f"{int(last_cap + 1)}–{int(cap)} units (@ ₹{rate}/unit)"
            
        breakdown.append({
            "slab_name": label,
            "units": round(consumed_in_slab, 1),
            "rate": rate,
            "amount": round(slab_cost, 2)
        })
        
        remaining -= consumed_in_slab
        last_cap = cap
        if remaining <= 0:
            break
            
    fixed_charge = settings.FIXED_CHARGE
    duty_amount = round(base_cost * settings.ELECTRICITY_DUTY_PCT, 2)
    total_bill = round(base_cost + fixed_charge + duty_amount, 2)
    
    return total_bill, breakdown, fixed_charge, duty_amount, round(base_cost, 2)
