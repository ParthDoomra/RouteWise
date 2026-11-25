"""Driver Pydantic Schemas."""

import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class DriverResponse(BaseModel):
    id: int
    name: str
    phone: Optional[str] = None
    vehicle_id: Optional[int] = None
    shift_start: Optional[datetime.time] = None
    shift_end: Optional[datetime.time] = None

    model_config = ConfigDict(from_attributes=True)
