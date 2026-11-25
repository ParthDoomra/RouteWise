"""Order Management Router for RouteWise (require_manager)."""

import secrets
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.order import Order
from app.schemas.orders import OrderCreate, OrderResponse
from app.services.auth_deps import require_manager

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

    new_order = Order(
        order_code=order_code,
        tracking_uuid=tracking_uuid,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        pickup_address=payload.pickup_address,
        drop_address=payload.drop_address,
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
