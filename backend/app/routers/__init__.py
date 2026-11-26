"""RouteWise API Routers Package."""

from app.routers.auth import router as auth_router
from app.routers.driver import router as driver_router
from app.routers.maintenance import router as maintenance_router
from app.routers.notifications import router as notifications_router
from app.routers.orders import router as orders_router
from app.routers.routes import router as routes_router
from app.routers.simulator import router as simulator_router
from app.routers.tracking import router as tracking_router
from app.routers.vehicles import router as vehicles_router

__all__ = [
    "auth_router",
    "orders_router",
    "vehicles_router",
    "maintenance_router",
    "notifications_router",
    "routes_router",
    "driver_router",
    "tracking_router",
    "simulator_router",
]
