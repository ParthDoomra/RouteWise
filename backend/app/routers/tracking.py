"""Public Customer Tracking Router for RouteWise (No Authentication Required)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.driver import Driver
from app.models.notification import Notification
from app.models.order import Order
from app.models.route_stop import RouteStop
from app.models.vehicle import Vehicle
from app.schemas.tracking import PublicTrackingResponse

router = APIRouter(tags=["Public Tracking"])


@router.get("/track/{tracking_uuid}", response_model=PublicTrackingResponse)
def get_public_order_tracking(
    tracking_uuid: str,
    db: Session = Depends(get_db),
):
    """Retrieve limited public tracking information for an order by its unique tracking UUID.

    Security & Privacy Rules:
    - No authentication required.
    - Lookup is STRICTLY by tracking_uuid (UUID4). Lookup by order_code is never permitted and returns 404.
    - Bad or unknown tracking UUID returns 404.
    - Leaks NO customer or driver phone numbers, NO other orders, NO internal database IDs,
      and NO full address list. Only returns order_code, status, ETA, driver's first name,
      vehicle position, and delay message if any.
    """
    cleaned_uuid = str(tracking_uuid).strip()

    # Reject lookup attempts by order_code (e.g. ORD-8942)
    if cleaned_uuid.startswith("ORD-"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order tracking not found",
        )

    order = db.query(Order).filter(Order.tracking_uuid == cleaned_uuid).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order tracking not found",
        )

    # 1. Driver first name & vehicle position (if vehicle assigned)
    driver_first_name = None
    vehicle_position = None

    if order.vehicle_id:
        vehicle = db.query(Vehicle).filter(Vehicle.id == order.vehicle_id).first()
        if vehicle:
            if vehicle.current_lat is not None and vehicle.current_lng is not None:
                vehicle_position = {
                    "lat": float(vehicle.current_lat),
                    "lng": float(vehicle.current_lng),
                }
            driver = db.query(Driver).filter(Driver.vehicle_id == vehicle.id).first()
            if driver and driver.name:
                # Return strictly the driver's first name for privacy
                driver_first_name = driver.name.strip().split()[0]

    # 2. ETA: from route stop if available, or order time_window_end
    stop = db.query(RouteStop).filter(RouteStop.order_id == order.id).first()
    eta = stop.eta if (stop and stop.eta) else order.time_window_end

    # 3. Delay message (from notification or delay_reason)
    delay_message = None
    latest_notif = (
        db.query(Notification)
        .filter(Notification.order_id == order.id)
        .order_by(Notification.sent_at.desc())
        .first()
    )
    if latest_notif and (order.status == "delayed" or latest_notif.is_ai_generated):
        delay_message = latest_notif.message
    elif order.delay_reason:
        delay_message = order.delay_reason

    return PublicTrackingResponse(
        order_code=order.order_code,
        status=order.status,
        eta=eta,
        driver_first_name=driver_first_name,
        vehicle_position=vehicle_position,
        delay_message=delay_message,
    )
