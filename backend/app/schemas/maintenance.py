"""Maintenance Ticket Pydantic Schemas."""

import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class MaintenanceTicketResponse(BaseModel):
    id: int
    vehicle_id: int
    trigger_type: str
    description: Optional[str] = None
    status: str
    created_at: Optional[datetime.datetime] = None
    resolved_at: Optional[datetime.datetime] = None

    model_config = ConfigDict(from_attributes=True)
