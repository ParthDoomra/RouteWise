"""Delay Reporting Pydantic Schemas."""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class DelayReason(str, Enum):
    TRAFFIC = "traffic"
    WEATHER = "weather"
    VEHICLE_ISSUE = "vehicle_issue"
    ADDRESS_ISSUE = "address_issue"
    HIGH_VOLUME = "high_volume"
    UNSPECIFIED = "unspecified"


class DelayReportRequest(BaseModel):
    reason: DelayReason = Field(..., description="Fixed delay reason")
    delay_minutes: int = Field(..., ge=1, le=240, description="Delay duration in minutes (1 to 240)")


class DelayReportResponse(BaseModel):
    order_id: int
    order_code: str
    reason: str
    delay_minutes: int
    message: str
    is_ai_generated: bool
    generation_source: str
    delivery_status: str = "simulated"
    note: str = "Real SMS or email delivery is simulated."

    model_config = ConfigDict(from_attributes=True)
