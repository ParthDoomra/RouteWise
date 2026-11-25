"""Public Customer Tracking Pydantic Schemas."""

import datetime
from typing import Dict, Optional
from pydantic import BaseModel


class PublicTrackingResponse(BaseModel):
    order_code: str
    status: str
    eta: Optional[datetime.datetime] = None
    driver_first_name: Optional[str] = None
    vehicle_position: Optional[Dict[str, float]] = None
    delay_message: Optional[str] = None
