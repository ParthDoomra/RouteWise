"""Order Management Router for RouteWise (require_manager)."""

import secrets
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.order import Order
from app.models.route_stop import RouteStop
from app.schemas.delays import DelayReportRequest, DelayReportResponse
from app.schemas.orders import OrderCreate, OrderResponse
from app.services.auth_deps import require_manager
from app.services.delay_notification_service import record_or_update_delay

router = APIRouter(tags=["Orders"])


def _generate_unique_order_code(db: Session) -> str:
    """Generate a unique order_code in the format ORD-xxxx."""
    for _ in range(100):
        # Generate 4-digit integer between 1000 and 9999
        code = f"ORD-{secrets.randbelow(9000) + 1000}"
        if not db.query(Order).filter(Order.order_code == code).first():
            return code
    # Fallback to 4 uppercase hex characters if 4-digit space is dense
    while True:
        code = f"ORD-{secrets.token_hex(2).upper()}"
        if not db.query(Order).filter(Order.order_code == code).first():
            return code


@router.get("/orders", response_model=List[OrderResponse])
def get_orders(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by order status"),
    db: Session = Depends(get_db),
    _current_user: dict = Depends(require_manager),
):
    """List orders, optionally filtered by status (Manager only)."""
    query = db.query(Order)
    if status_filter:
        query = query.filter(Order.status == status_filter.strip())
    return query.order_by(Order.id.asc()).all()


@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    _current_user: dict = Depends(require_manager),
):
    """Create a new delivery order with unique order_code and tracking_uuid (Manager only)."""
    order_code = _generate_unique_order_code(db)
    tracking_uuid = str(uuid.uuid4())

    # Derive or clean zone
    zone = payload.zone
    if not zone and payload.drop_address:
        # Default extraction from address
        for kw in ["HSR Layout", "MG Road", "Jayanagar", "BTM Layout", "Malleshwaram", "Frazer Town", "Bellandur", "JP Nagar", "Hoodi", "Indiranagar", "Whitefield", "Koramangala"]:
            if kw.lower() in payload.drop_address.lower():
                zone = kw
                break
        if not zone:
            zone = "Central Bengaluru"

    new_order = Order(
        order_code=order_code,
        tracking_uuid=tracking_uuid,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        pickup_address=payload.pickup_address,
        drop_address=payload.drop_address,
        zone=zone,
        pickup_lat=payload.pickup_lat,
        pickup_lng=payload.pickup_lng,
        drop_lat=payload.drop_lat,
        drop_lng=payload.drop_lng,
        weight_kg=payload.weight_kg,
        time_window_start=payload.time_window_start,
        time_window_end=payload.time_window_end,
        status="pending",
        vehicle_id=None,
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    return new_order


@router.get("/orders/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    _current_user: dict = Depends(require_manager),
):
    """Get a specific order by ID (Manager only)."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found",
        )
    return order


@router.post("/orders/{order_id}/flag-delay", response_model=DelayReportResponse)
def flag_order_delay(
    order_id: int,
    payload: DelayReportRequest,
    db: Session = Depends(get_db),
    _current_user: dict = Depends(require_manager),
):
    """Flag a delivery delay on an order (Manager only).

    Generates customer explanation using Claude (or deterministic template fallback),
    updates or creates an open delay event without duplicates, stores latest delay
    message on the order, and saves a simulated notification row.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found",
        )

    stop = db.query(RouteStop).filter(RouteStop.order_id == order.id).first()
    stop_id = stop.id if stop else None

    delay_event, notif, _is_repeat = record_or_update_delay(
        db=db,
        order=order,
        reason=payload.reason.value,
        delay_minutes=payload.delay_minutes,
        stop_id=stop_id,
    )

    return DelayReportResponse(
        order_id=order.id,
        order_code=order.order_code,
        reason=delay_event.reason,
        delay_minutes=delay_event.delay_minutes,
        message=notif.message,
        is_ai_generated=notif.is_ai_generated,
        generation_source=notif.generation_source,
        delivery_status=notif.delivery_status,
        note="Real SMS or email delivery is simulated.",
    )
