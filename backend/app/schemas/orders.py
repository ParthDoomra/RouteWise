"""Order Pydantic Schemas."""

import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class OrderCreate(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    pickup_address: Optional[str] = None
    drop_address: Optional[str] = None
    pickup_lat: float = Field(..., ge=-90.0, le=90.0, description="Pickup latitude must be between -90 and 90")
    pickup_lng: float = Field(..., ge=-180.0, le=180.0, description="Pickup longitude must be between -180 and 180")
    drop_lat: float = Field(..., ge=-90.0, le=90.0, description="Drop latitude must be between -90 and 90")
    drop_lng: float = Field(..., ge=-180.0, le=180.0, description="Drop longitude must be between -180 and 180")
    weight_kg: float = Field(..., gt=0.0, description="Weight must be strictly greater than 0")
    time_window_start: Optional[datetime.datetime] = None
    time_window_end: Optional[datetime.datetime] = None


class OrderResponse(BaseModel):
    id: int
    order_code: str
    tracking_uuid: str
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    pickup_address: Optional[str] = None
    drop_address: Optional[str] = None
    pickup_lat: float
    pickup_lng: float
    drop_lat: float
    drop_lng: float
    weight_kg: Optional[float] = None
    time_window_start: Optional[datetime.datetime] = None
    time_window_end: Optional[datetime.datetime] = None
    status: str
    delay_reason: Optional[str] = None
    vehicle_id: Optional[int] = None
    created_at: Optional[datetime.datetime] = None

    model_config = ConfigDict(from_attributes=True)
