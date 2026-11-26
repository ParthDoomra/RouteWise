"""Route Optimization & Management Router for RouteWise (require_manager)."""

import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.algorithms.optimizer import optimize_route
from app.config import DEPOT_LAT, DEPOT_LNG
from app.database import get_db
from app.models.order import Order
from app.models.route import Route
from app.models.route_stop import RouteStop
from app.models.vehicle import Vehicle
from app.schemas.routes import (
    RouteOptimizeRequest,
    RouteOptimizeResponse,
    RouteResponse,
    RouteStopResponse,
)
from app.services.auth_deps import require_manager
from app.services.distance_provider import get_distance_matrix

router = APIRouter(tags=["Route Optimization"])


@router.post("/routes/optimize", response_model=RouteOptimizeResponse)
def optimize_vehicle_route(
    payload: RouteOptimizeRequest,
    db: Session = Depends(get_db),
    _current_user: dict = Depends(require_manager),
):
    """Optimize delivery route for assigned orders and vehicle (Manager only).

    Validation:
    - Vehicle must exist.
    - All order IDs must exist.
    - Orders must not be already assigned (status must be 'pending' with no vehicle_id).
    - Total order weight must not exceed vehicle capacity.
    """
    # 1. Verify vehicle exists
    vehicle = db.query(Vehicle).filter(Vehicle.id == payload.vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with ID {payload.vehicle_id} not found",
        )

    # 1b. Verify vehicle is not under an open maintenance ticket
    from app.models.maintenance_ticket import MaintenanceTicket
    open_ticket = (
        db.query(MaintenanceTicket)
        .filter(
            MaintenanceTicket.vehicle_id == vehicle.id,
            MaintenanceTicket.status == "open",
        )
        .first()
    )
    if open_ticket:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vehicle {vehicle.plate_no} (ID {vehicle.id}) has an open maintenance ticket and cannot be assigned to a route",
        )

    # 2. Verify all orders exist
    orders = db.query(Order).filter(Order.id.in_(payload.order_ids)).all()
    order_map = {o.id: o for o in orders}
    missing_ids = [oid for oid in payload.order_ids if oid not in order_map]
    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Orders not found: {missing_ids}",
        )

    ordered_orders = [order_map[oid] for oid in payload.order_ids]

    # 3. Verify none of the orders are already assigned
    for o in ordered_orders:
        if o.status != "pending" or o.vehicle_id is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Order {o.id} ({o.order_code}) is already assigned (status: '{o.status}')",
            )

    # 4. Verify total weight does not exceed vehicle capacity
    total_weight = sum(float(o.weight_kg or 0.0) for o in ordered_orders)
    if total_weight > float(vehicle.capacity_kg):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Total order weight ({total_weight:.2f} kg) exceeds vehicle "
                f"capacity ({float(vehicle.capacity_kg):.2f} kg)"
            ),
        )

    # 5. Build coordinates list with Depot as points[0]
    depot_point = (float(DEPOT_LAT), float(DEPOT_LNG))
    points = [depot_point] + [
        (float(o.drop_lat), float(o.drop_lng)) for o in ordered_orders
    ]

    # 6. Fetch distance matrix via distance provider (road mode with Haversine fallback)
    matrix_km, source = get_distance_matrix(points, mode="road")

    # 7. Execute route optimization using self-built Nearest Neighbor + 2-opt
    opt_result = optimize_route(
        points=points,
        return_to_depot=True,
        matrix=matrix_km,
        distance_source=source,
    )

    # 8. Calculate leg-by-leg distances along the optimized tour
    order_indices = opt_result["order"]
    full_tour = order_indices + [0]
    leg_by_leg: List[float] = [
        round(float(matrix_km[full_tour[i]][full_tour[i + 1]]), 2)
        for i in range(len(order_indices))
    ]

    # 9. Supersede previous active route for this vehicle
    db.query(Route).filter(
        Route.vehicle_id == vehicle.id,
        Route.status == "active",
    ).update({"status": "completed"})

    # 10. Persist new Route record
    route = Route(
        vehicle_id=vehicle.id,
        route_date=datetime.date.today(),
        total_distance_km=opt_result["total_km"],
        total_time_min=round(opt_result["total_km"] * 2.0, 2),
        status="active",
    )
    db.add(route)
    db.flush()

    # 11. Persist RouteStop records in visit order and update orders & vehicle
    stop_order: List[int] = []
    saved_stops: List[RouteStop] = []
    seq = 1

    for idx in order_indices:
        if idx == 0:
            continue  # index 0 represents the starting depot
        order = ordered_orders[idx - 1]
        stop_order.append(order.id)

        stop = RouteStop(
            route_id=route.id,
            order_id=order.id,
            sequence_no=seq,
            stop_lat=order.drop_lat,
            stop_lng=order.drop_lng,
            status="pending",
        )
        db.add(stop)
        saved_stops.append(stop)

        # Mark order assigned to this vehicle
        order.status = "assigned"
        order.vehicle_id = vehicle.id
        seq += 1

    # Mark vehicle on route
    vehicle.status = "on_route"

    db.commit()
    db.refresh(route)
    for s in saved_stops:
        db.refresh(s)

    return RouteOptimizeResponse(
        route_id=route.id,
        vehicle_id=vehicle.id,
        stop_order=stop_order,
        leg_by_leg_km=leg_by_leg,
        total_km=opt_result["total_km"],
        nearest_neighbor_km=opt_result["nearest_neighbor_km"],
        improvement_percent=opt_result["improvement_percent"],
        runtime_ms=opt_result["runtime_ms"],
        distance_source=opt_result["distance_source"],
        stops=[RouteStopResponse.model_validate(s) for s in saved_stops],
    )


@router.get("/routes/{vehicle_id}", response_model=RouteResponse)
def get_vehicle_current_route(
    vehicle_id: int,
    db: Session = Depends(get_db),
    _current_user: dict = Depends(require_manager),
):
    """Get the current active delivery route and stops for a vehicle (Manager only)."""
    # Check if vehicle exists
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with ID {vehicle_id} not found",
        )

    # Find active route
    route = (
        db.query(Route)
        .filter(Route.vehicle_id == vehicle_id, Route.status == "active")
        .order_by(Route.id.desc())
        .first()
    )
    if not route:
        # Fall back to latest route for that vehicle
        route = (
            db.query(Route)
            .filter(Route.vehicle_id == vehicle_id)
            .order_by(Route.id.desc())
            .first()
        )

    if not route:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No route found for vehicle {vehicle_id}",
        )

    return route
