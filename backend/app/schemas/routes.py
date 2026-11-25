"""Route and Stop Pydantic Schemas."""

import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class RouteOptimizeRequest(BaseModel):
    vehicle_id: int = Field(..., description="ID of the vehicle to assign the route to")
    order_ids: List[int] = Field(..., min_length=1, description="List of pending order IDs to deliver")


class RouteStopResponse(BaseModel):
    id: int
    route_id: int
    order_id: Optional[int] = None
    sequence_no: int
    stop_lat: Optional[float] = None
    stop_lng: Optional[float] = None
    eta: Optional[datetime.datetime] = None
    actual_arrival: Optional[datetime.datetime] = None
    delay_reason: Optional[str] = None
    status: str

    model_config = ConfigDict(from_attributes=True)


class RouteResponse(BaseModel):
    id: int
    vehicle_id: int
    route_date: datetime.date
    total_distance_km: Optional[float] = None
    total_time_min: Optional[float] = None
    status: str
    stops: List[RouteStopResponse] = []

    model_config = ConfigDict(from_attributes=True)


class RouteOptimizeResponse(BaseModel):
    route_id: int
    vehicle_id: int
    stop_order: List[int]
    leg_by_leg_km: List[float]
    total_km: float
    nearest_neighbor_km: float
    improvement_percent: float
    runtime_ms: float
    distance_source: str
    stops: List[RouteStopResponse] = []
