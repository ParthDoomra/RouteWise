"""Driver Portal Router for RouteWise (require_driver)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.driver import Driver
from app.models.route import Route
from app.schemas.routes import RouteResponse
from app.services.auth_deps import require_driver

router = APIRouter(tags=["Driver"])


@router.get("/driver/route", response_model=RouteResponse)
def get_driver_assigned_route(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_driver),
):
    """Retrieve ONLY the logged-in driver's own assigned vehicle route and stops.

    A driver cannot view any other driver's or vehicle's route.
    """
    driver_id = current_user.get("user_id")
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver record not found",
        )

    if not driver.vehicle_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver is not assigned to any vehicle",
        )

    # Fetch active route for driver's vehicle
    route = (
        db.query(Route)
        .filter(Route.vehicle_id == driver.vehicle_id, Route.status == "active")
        .order_by(Route.id.desc())
        .first()
    )
    if not route:
        # Fallback to latest route for that vehicle
        route = (
            db.query(Route)
            .filter(Route.vehicle_id == driver.vehicle_id)
            .order_by(Route.id.desc())
            .first()
        )

    if not route:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No delivery route assigned to driver's vehicle",
        )

    return route
