from typing import List, Optional, Dict
from pydantic import BaseModel

class SlabDetail(BaseModel):
    slab_name: str
    units: float
    rate: float
    amount: float

class BillForecastResponse(BaseModel):
    projected_bill: float
    projected_units: float
    avg_daily_kwh: float
    day_of_month: int
    days_in_month: int
    cycle_progress_pct: float
    slab_breakdown: List[SlabDetail]
    fixed_charge: float
    duty_amount: float
    base_cost: float

class BillVerifyRequest(BaseModel):
    actual_bill: float

class BillVerifyResponse(BaseModel):
    actual_bill: float
    predicted_bill: float
    difference: float
    is_discrepancy: bool
    threshold: float
    status: str
    message: str
    suggested_dispute_desc: Optional[str] = None

class BillingHistoryRecord(BaseModel):
    month: str
    units: float
    predicted: float
    actual: float
    diff: float
    is_discrepancy: bool

class ApplianceBreakdownItem(BaseModel):
    name: str
    icon: str
    share_pct: int
    monthly_kwh: float
    monthly_cost: float
    advice: str

class BudgetStatusResponse(BaseModel):
    budget_low: float
    budget_high: float
    projected_bill: float
    status: str  # "On Track" or "Projected Over Budget"
    pill_class: str
    over_by: float
    trim_pct: float
    target_kwh_cut: float
    appliance_breakdown: List[ApplianceBreakdownItem]
    tips: List[str]
