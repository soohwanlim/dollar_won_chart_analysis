from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ChartDataPoint(BaseModel):
    date: str  # YYYY-MM-DD
    close: float
    real_price_usd: Optional[float] = None
    real_price_cpi: Optional[float] = None
    gold_price_don: Optional[float] = None
    gold_price_oz: Optional[float] = None
    gold_base_price: Optional[float] = None
    benchmark_real_price: Optional[float] = None
    alpha: Optional[float] = None

class ChartResponse(BaseModel):
    ticker: str
    company_name: Optional[str] = None
    benchmark_name: Optional[str] = None
    period: str
    data: List[ChartDataPoint]
    overall_alpha: Optional[float] = None
