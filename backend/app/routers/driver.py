"""Driver Portal Router for RouteWise (require_driver)."""

import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.algorithms.haversine import haversine_km
from app.config import AVG_SPEED_KMPH, DEPOT_LAT, DEPOT_LNG
from app.database import get_db
from app.models.driver import Driver
from app.models.order import Order
from app.models.route import Route
from app.models.route_stop import RouteStop
from app.models.vehicle import Vehicle
from app.schemas.routes import RouteResponse, RouteStopResponse
from app.services.auth_deps import require_driver

router = APIRouter(tags=["Driver"])


def _build_stop_response(stop: RouteStop, start_time: datetime.datetime, cum_km: float) -> RouteStopResponse:
    """Helper to convert RouteStop to RouteStopResponse, estimating ETA if not present."""
    is_estimated = False
    stop_eta = stop.eta

    if stop_eta is None:
        travel_hours = cum_km / max(AVG_SPEED_KMPH, 1.0)
        stop_eta = start_time + datetime.timedelta(hours=travel_hours)
        is_estimated = True

    return RouteStopResponse(
        id=stop.id,
        route_id=stop.route_id,
        order_id=stop.order_id,
        sequence_no=stop.sequence_no,
        stop_lat=float(stop.stop_lat) if stop.stop_lat is not None else None,
        stop_lng=float(stop.stop_lng) if stop.stop_lng is not None else None,
        eta=stop_eta,
        actual_arrival=stop.actual_arrival,
        delay_reason=stop.delay_reason,
        status=stop.status,
        picked_up_at=stop.picked_up_at,
        delivered_at=stop.delivered_at,
        is_estimated_eta=is_estimated,
        order_code=stop.order.order_code if stop.order else None,
        customer_name=stop.order.customer_name if stop.order else None,
        customer_phone=stop.order.customer_phone if stop.order else None,
        address=stop.order.drop_address if stop.order else None,
        weight_kg=float(stop.order.weight_kg) if (stop.order and stop.order.weight_kg is not None) else None,
    )


@router.get("/driver/route", response_model=RouteResponse)
def get_driver_assigned_route(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_driver),
):
    """Retrieve ONLY the logged-in driver's own assigned vehicle route and stops.

    A driver cannot view any other driver's or vehicle's route.
    If stops have no ETA field, computes an estimated ETA from cumulative leg distances.
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

    start_time = datetime.datetime.combine(route.route_date, datetime.time(9, 0, tzinfo=datetime.timezone.utc))
    prev_lat = float(DEPOT_LAT)
    prev_lng = float(DEPOT_LNG)
    cum_km = 0.0

    stop_responses: List[RouteStopResponse] = []
    for stop in route.stops:
        if stop.stop_lat is not None and stop.stop_lng is not None:
            leg = haversine_km(prev_lat, prev_lng, float(stop.stop_lat), float(stop.stop_lng))
            cum_km += leg
            prev_lat = float(stop.stop_lat)
            prev_lng = float(stop.stop_lng)
        stop_responses.append(_build_stop_response(stop, start_time, cum_km))

    return RouteResponse(
        id=route.id,
        vehicle_id=route.vehicle_id,
        route_date=route.route_date,
        total_distance_km=float(route.total_distance_km) if route.total_distance_km is not None else None,
        total_time_min=float(route.total_time_min) if route.total_time_min is not None else None,
        status=route.status,
        stops=stop_responses,
    )


@router.post("/driver/stops/{stop_id}/pickup", response_model=RouteStopResponse)
def pickup_route_stop(
    stop_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_driver),
):
    """Mark a route stop as picked up (Driver only).

    Rules:
    - Stop must belong to logged-in driver's assigned vehicle route (403 if other driver, 404 if unknown).
    - Status flow: assigned -> picked_up -> delivered.
    - Skipping or repeating a step returns 409 Conflict.
    """
    driver_id = current_user.get("user_id")
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver or not driver.vehicle_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Driver is not assigned to an active vehicle",
        )

    stop = db.query(RouteStop).filter(RouteStop.id == stop_id).first()
    if not stop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stop with ID {stop_id} not found",
        )

    route = db.query(Route).filter(Route.id == stop.route_id).first()
    if not route or route.vehicle_id != driver.vehicle_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Stop does not belong to driver's assigned vehicle route",
        )

    # Status validation: cannot repeat or skip
    if stop.status == "picked_up":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Stop has already been picked up",
        )
    if stop.status == "delivered":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Stop is already delivered and cannot be picked up again",
        )
    if stop.status not in ["pending", "assigned"]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot pick up stop with current status '{stop.status}'",
        )

    now = datetime.datetime.now(datetime.timezone.utc)
    stop.status = "picked_up"
    stop.picked_up_at = now

    if stop.order_id:
        order = db.query(Order).filter(Order.id == stop.order_id).first()
        if order:
            order.status = "picked_up"
            order.picked_up_at = now

    db.commit()
    db.refresh(stop)

    start_time = datetime.datetime.combine(route.route_date, datetime.time(9, 0, tzinfo=datetime.timezone.utc))
    return _build_stop_response(stop, start_time, 0.0)


@router.post("/driver/stops/{stop_id}/deliver", response_model=RouteStopResponse)
def deliver_route_stop(
    stop_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_driver),
):
    """Mark a route stop as delivered (Driver only).

    Rules:
    - Stop must belong to logged-in driver's assigned vehicle route (403 if other driver, 404 if unknown).
    - Can only be delivered after it has been picked up (409 Conflict if skipped).
    - Cannot deliver an already delivered stop (409 Conflict).
    - When the last stop of a route is delivered:
        * Mark route 'completed'
        * Set vehicle back to 'available'
        * Add route's total_distance_km to vehicle's mileage_km
    """
    driver_id = current_user.get("user_id")
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver or not driver.vehicle_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Driver is not assigned to an active vehicle",
        )

    stop = db.query(RouteStop).filter(RouteStop.id == stop_id).first()
    if not stop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stop with ID {stop_id} not found",
        )

    route = db.query(Route).filter(Route.id == stop.route_id).first()
    if not route or route.vehicle_id != driver.vehicle_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Stop does not belong to driver's assigned vehicle route",
        )

    # Status validation
    if stop.status == "delivered":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Stop is already delivered",
        )
    if stop.status != "picked_up":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Stop must be picked up before delivery (current status: '{stop.status}')",
        )

    now = datetime.datetime.now(datetime.timezone.utc)
    stop.status = "delivered"
    stop.delivered_at = now
    stop.actual_arrival = now

    if stop.order_id:
        order = db.query(Order).filter(Order.id == stop.order_id).first()
        if order:
            order.status = "delivered"
            order.delivered_at = now

    # Check if all stops on this route are now delivered
    all_stops = db.query(RouteStop).filter(RouteStop.route_id == route.id).all()
    all_delivered = all(s.id == stop.id or s.status == "delivered" for s in all_stops)

    if all_delivered:
        route.status = "completed"
        vehicle = db.query(Vehicle).filter(Vehicle.id == route.vehicle_id).first()
        if vehicle:
            vehicle.status = "available"
            route_km = float(route.total_distance_km or 0.0)
            vehicle.mileage_km = float(vehicle.mileage_km or 0.0) + route_km

    db.commit()
    db.refresh(stop)

    start_time = datetime.datetime.combine(route.route_date, datetime.time(9, 0, tzinfo=datetime.timezone.utc))
    return _build_stop_response(stop, start_time, 0.0)
