"""Vehicle Pydantic Schemas."""

import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class VehicleCreate(BaseModel):
    plate_no: str = Field(..., min_length=1, max_length=20, description="Unique vehicle registration plate")
    model: Optional[str] = None
    capacity_kg: float = Field(..., gt=0.0, description="Payload capacity in kg (> 0)")
    status: Optional[str] = "available"
    current_lat: Optional[float] = Field(None, ge=-90.0, le=90.0)
    current_lng: Optional[float] = Field(None, ge=-180.0, le=180.0)
    mileage_km: Optional[float] = Field(0.0, ge=0.0)
    last_service_date: Optional[datetime.date] = None


class VehicleResponse(BaseModel):
    id: int
    plate_no: str
    model: Optional[str] = None
    capacity_kg: float
    status: str
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    mileage_km: float
    last_service_date: Optional[datetime.date] = None

    model_config = ConfigDict(from_attributes=True)
