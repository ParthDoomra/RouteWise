"""Schemas package init."""

from app.schemas.orders import OrderCreate, OrderResponse
from app.schemas.vehicles import VehicleCreate, VehicleResponse
from app.schemas.drivers import DriverResponse
from app.schemas.maintenance import MaintenanceTicketResponse
from app.schemas.notifications import NotificationResponse
from app.schemas.routes import (
    RouteOptimizeRequest,
    RouteOptimizeResponse,
    RouteResponse,
    RouteStopResponse,
)
from app.schemas.tracking import PublicTrackingResponse

__all__ = [
    "OrderCreate",
    "OrderResponse",
    "VehicleCreate",
    "VehicleResponse",
    "DriverResponse",
    "MaintenanceTicketResponse",
    "NotificationResponse",
    "RouteOptimizeRequest",
    "RouteOptimizeResponse",
    "RouteResponse",
    "RouteStopResponse",
    "PublicTrackingResponse",
]
