"""Notification Pydantic Schemas."""

import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    id: int
    order_id: Optional[int] = None
    message: str
    channel: str
    is_ai_generated: bool
    generation_source: Optional[str] = "template"
    delivery_status: Optional[str] = "simulated"
    sent_at: Optional[datetime.datetime] = None

    model_config = ConfigDict(from_attributes=True)
