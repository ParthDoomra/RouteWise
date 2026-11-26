"""Tests for Vehicle Position Simulator, Maintenance Triggers, and Service Clock Management.

Covers:
1. step_position moves the right distance, never overshoots, and reports arrival.
2. Simulator tick logic moves vehicle toward next undelivered stop, waits at stop, and does NOT change mileage.
3. check_maintenance opens one ticket at threshold, not below, and never duplicates.
4. Resolving a ticket resets service clock (last_service_mileage_km = vehicle.mileage_km, last_service_date = today).
5. Optimizing a route for a vehicle with an open maintenance ticket is refused with 400.
6. Simulator endpoints reject driver tokens (403) and unauthenticated calls (401), and validate speed multiplier (1 to 200).
"""

import datetime
import uuid
import pytest
from fastapi.testclient import TestClient

from app.algorithms.haversine import haversine_km
from app.config import SERVICE_INTERVAL_KM
from app.database import SessionLocal
from app.main import app
from app.models.driver import Driver
from app.models.maintenance_ticket import MaintenanceTicket
from app.models.order import Order
from app.models.route import Route
from app.models.route_stop import RouteStop
from app.models.vehicle import Vehicle
from app.services.auth_deps import create_access_token
from app.services.auth_rate_limiter import reset_rate_limiter
from app.services.maintenance import check_maintenance
from app.services.simulator import simulate_tick, step_position


@pytest.fixture(autouse=True)
def clean_rate_limits():
    """Reset rate limiter before and after each test."""
    reset_rate_limiter()
    yield
    reset_rate_limiter()


@pytest.fixture
def client():
    """FastAPI TestClient fixture."""
    return TestClient(app)


@pytest.fixture
def db():
    """Database session fixture."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def manager_headers():
    token = create_access_token(user_id=1, role="manager", name="Fleet Operations Manager")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def driver_headers():
    token = create_access_token(user_id=1, role="driver", name="Rahul Sharma")
    return {"Authorization": f"Bearer {token}"}


# =============================================================================
# 1. Pure step_position Unit Tests
# =============================================================================

def test_step_position_distance_and_arrival():
    """step_position accurately interpolates, never overshoots, and reports arrival."""
    start = (12.9716, 77.5946)  # Bengaluru center
    target = (12.9800, 77.6080)
    total_dist = haversine_km(start[0], start[1], target[0], target[1])
    assert total_dist > 1.0

    # 1. Move a partial distance (halfway)
    half_dist = total_dist / 2.0
    mid_pos, arrived_mid = step_position(start, target, half_dist)
    assert not arrived_mid
    assert mid_pos != target
    dist_to_mid = haversine_km(start[0], start[1], mid_pos[0], mid_pos[1])
    assert pytest.approx(dist_to_mid, 0.05) == half_dist

    # 2. Move exact remaining distance
    exact_pos, arrived_exact = step_position(mid_pos, target, half_dist)
    assert arrived_exact
    assert exact_pos == target

    # 3. Overshoot distance test: moving 10x total distance MUST NOT overshoot
    overshoot_pos, arrived_over = step_position(start, target, total_dist * 10)
    assert arrived_over
    assert overshoot_pos == target

    # 4. Zero or negative distance
    zero_pos, arrived_zero = step_position(start, target, 0.0)
    assert not arrived_zero
    assert zero_pos == start


# =============================================================================
# 2. Simulator Tick Logic, Stop Waiting, and Mileage Preservation
# =============================================================================

def test_simulator_tick_moves_vehicle_waits_and_preserves_mileage(db):
    """Simulator tick advances vehicle toward next undelivered stop,
    waits at undelivered stop upon arrival, and NEVER modifies mileage_km.
    """
    plate = f"KA-SIM-{uuid.uuid4().hex[:4].upper()}"
    vehicle = Vehicle(
        plate_no=plate,
        model="Simulation Van",
        capacity_kg=1000.0,
        status="on_route",
        current_lat=12.9716,
        current_lng=77.5946,
        mileage_km=1250.0,
        last_service_mileage_km=1250.0,
    )
    db.add(vehicle)
    db.flush()

    route = Route(
        vehicle_id=vehicle.id,
        route_date=datetime.date.today(),
        total_distance_km=10.0,
        status="active",
    )
    db.add(route)
    db.flush()

    stop_1 = RouteStop(
        route_id=route.id,
        sequence_no=1,
        stop_lat=12.9750,
        stop_lng=77.6010,
        status="pending",
    )
    stop_2 = RouteStop(
        route_id=route.id,
        sequence_no=2,
        stop_lat=12.9800,
        stop_lng=77.6080,
        status="pending",
    )
    db.add_all([stop_1, stop_2])
    db.commit()

    try:
        initial_mileage = float(vehicle.mileage_km)
        initial_lat = float(vehicle.current_lat)

        # 1. Execute one tick with moderate speed multiplier
        updates = simulate_tick(db, speed_multiplier=20.0, tick_seconds=3, vehicle_id=vehicle.id)
        assert vehicle.id in updates

        db.refresh(vehicle)
        # Vehicle moved toward Stop 1
        assert float(vehicle.current_lat) != initial_lat
        assert float(vehicle.mileage_km) == initial_mileage  # Mileage strictly unchanged!

        # 2. Execute tick with large speed multiplier so vehicle arrives at Stop 1
        updates_arrive = simulate_tick(db, speed_multiplier=200.0, tick_seconds=10, vehicle_id=vehicle.id)
        assert updates_arrive[vehicle.id]["arrived"] is True

        db.refresh(vehicle)
        assert float(vehicle.current_lat) == float(stop_1.stop_lat)
        assert float(vehicle.current_lng) == float(stop_1.stop_lng)
        assert float(vehicle.mileage_km) == initial_mileage

        # 3. Subsequent ticks: Stop 1 is still pending (driver hasn't delivered yet).
        # Vehicle MUST wait at Stop 1 and NOT jump to Stop 2!
        for _ in range(3):
            simulate_tick(db, speed_multiplier=20.0, tick_seconds=3, vehicle_id=vehicle.id)
            db.refresh(vehicle)
            assert float(vehicle.current_lat) == float(stop_1.stop_lat)
            assert float(vehicle.current_lng) == float(stop_1.stop_lng)
            assert float(vehicle.mileage_km) == initial_mileage

        # 4. Driver delivers Stop 1 -> next tick vehicle moves toward Stop 2!
        stop_1.status = "delivered"
        db.commit()

        updates_step2 = simulate_tick(db, speed_multiplier=5.0, tick_seconds=3, vehicle_id=vehicle.id)
        assert updates_step2[vehicle.id]["target_stop_id"] == stop_2.id
        db.refresh(vehicle)
        # Position now moving toward Stop 2
        assert float(vehicle.current_lat) != float(stop_1.stop_lat)
        assert float(vehicle.mileage_km) == initial_mileage
    finally:
        db.delete(stop_1)
        db.delete(stop_2)
        db.delete(route)
        db.delete(vehicle)
        db.commit()


# =============================================================================
# 3. check_maintenance Threshold & Duplicate Prevention
# =============================================================================

def test_check_maintenance_threshold_and_deduplication(db):
    """check_maintenance opens one ticket at threshold, not below it, and never duplicates."""
    plate = f"KA-MNT-{uuid.uuid4().hex[:4].upper()}"
    vehicle = Vehicle(
        plate_no=plate,
        model="Maintenance Test Van",
        capacity_kg=800.0,
        status="available",
        mileage_km=1000.0,
        last_service_mileage_km=1000.0,
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)

    try:
        # A. Below threshold: 3000 km since last service (< 5000)
        vehicle.mileage_km = 4000.0
        db.commit()
        t1 = check_maintenance(vehicle, db)
        assert t1 is None

        open_tickets = db.query(MaintenanceTicket).filter(
            MaintenanceTicket.vehicle_id == vehicle.id,
            MaintenanceTicket.status == "open",
        ).all()
        assert len(open_tickets) == 0

        # B. Exactly at threshold: +5000 km (mileage=6000, last=1000)
        vehicle.mileage_km = 1000.0 + SERVICE_INTERVAL_KM
        db.commit()
        t2 = check_maintenance(vehicle, db)
        assert t2 is not None
        assert t2.trigger_type == "mileage"
        assert t2.status == "open"
        assert f"{int(SERVICE_INTERVAL_KM):,} km" in t2.description

        # C. Above threshold with already OPEN ticket: MUST NOT create duplicate!
        vehicle.mileage_km = 1000.0 + SERVICE_INTERVAL_KM + 500.0
        db.commit()
        t3 = check_maintenance(vehicle, db)
        assert t3 is None  # Duplicate suppressed

        total_open = db.query(MaintenanceTicket).filter(
            MaintenanceTicket.vehicle_id == vehicle.id,
            MaintenanceTicket.status == "open",
        ).count()
        assert total_open == 1
    finally:
        db.query(MaintenanceTicket).filter(MaintenanceTicket.vehicle_id == vehicle.id).delete()
        db.delete(vehicle)
        db.commit()


# =============================================================================
# 4. Resolve Maintenance Ticket Resets Service Clock
# =============================================================================

def test_resolve_ticket_resets_service_clock(client, manager_headers, db):
    """PATCH /maintenance/{id}/resolve resets vehicle last_service_mileage_km and date."""
    plate = f"KA-RES-{uuid.uuid4().hex[:4].upper()}"
    vehicle = Vehicle(
        plate_no=plate,
        model="Service Clock Vehicle",
        capacity_kg=850.0,
        status="available",
        mileage_km=7200.0,
        last_service_mileage_km=2000.0,
        last_service_date=datetime.date(2025, 1, 1),
    )
    db.add(vehicle)
    db.flush()

    ticket = MaintenanceTicket(
        vehicle_id=vehicle.id,
        trigger_type="mileage",
        description="5,200 km since last service",
        status="open",
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    try:
        resp = client.patch(f"/maintenance/{ticket.id}/resolve", headers=manager_headers)
        assert resp.status_code == 200
        assert resp.json()["status"] == "resolved"

        db.refresh(vehicle)
        # Service clock restarted
        assert float(vehicle.last_service_mileage_km) == 7200.0
        assert vehicle.last_service_date == datetime.date.today()
    finally:
        db.delete(ticket)
        db.delete(vehicle)
        db.commit()


# =============================================================================
# 5. Route Optimization Refused on Open Maintenance Ticket
# =============================================================================

def test_route_optimization_refused_for_vehicle_with_open_ticket(client, manager_headers, db):
    """POST /routes/optimize refuses vehicle if under open maintenance ticket (400)."""
    plate = f"KA-BLOCKED-{uuid.uuid4().hex[:4].upper()}"
    vehicle = Vehicle(
        plate_no=plate,
        model="Damaged Van",
        capacity_kg=1200.0,
        status="maintenance",
        mileage_km=9000.0,
    )
    db.add(vehicle)
    db.flush()

    ticket = MaintenanceTicket(
        vehicle_id=vehicle.id,
        trigger_type="mileage",
        description="Critical service required",
        status="open",
    )
    db.add(ticket)

    order = Order(
        order_code=f"ORD-MNT-{uuid.uuid4().hex[:6]}",
        tracking_uuid=str(uuid.uuid4()),
        pickup_lat=12.9716,
        pickup_lng=77.5946,
        drop_lat=12.9800,
        drop_lng=77.6080,
        weight_kg=15.0,
        status="pending",
    )
    db.add(order)
    db.commit()
    db.refresh(vehicle)
    db.refresh(order)

    try:
        payload = {
            "vehicle_id": vehicle.id,
            "order_ids": [order.id],
        }
        resp = client.post("/routes/optimize", json=payload, headers=manager_headers)
        assert resp.status_code == 400
        assert "open maintenance ticket" in resp.json()["detail"].lower()
    finally:
        db.delete(ticket)
        db.delete(order)
        db.delete(vehicle)
        db.commit()


# =============================================================================
# 6. Simulator Endpoints Role Protection and Input Validation
# =============================================================================

def test_simulator_endpoints_auth_and_validation(client, manager_headers, driver_headers):
    """Simulator endpoints reject driver tokens (403), unauthenticated (401),
    and validate speed multiplier 1 to 200.
    """
    # 1. Unauthenticated requests -> 401
    assert client.get("/simulator/status").status_code == 401
    assert client.post("/simulator/start").status_code == 401
    assert client.post("/simulator/stop").status_code == 401
    assert client.post("/simulator/speed", json={"speed_multiplier": 10.0}).status_code == 401

    # 2. Driver token -> 403 Forbidden
    assert client.get("/simulator/status", headers=driver_headers).status_code == 403
    assert client.post("/simulator/start", headers=driver_headers).status_code == 403
    assert client.post("/simulator/stop", headers=driver_headers).status_code == 403
    assert client.post("/simulator/speed", json={"speed_multiplier": 10.0}, headers=driver_headers).status_code == 403

    # 3. Manager token -> 200 Success
    resp_status = client.get("/simulator/status", headers=manager_headers)
    assert resp_status.status_code == 200
    assert "running" in resp_status.json()

    resp_start = client.post("/simulator/start", headers=manager_headers)
    assert resp_start.status_code == 200
    assert resp_start.json()["running"] is True

    resp_stop = client.post("/simulator/stop", headers=manager_headers)
    assert resp_stop.status_code == 200
    assert resp_stop.json()["running"] is False

    # 4. Valid speed change
    resp_speed = client.post("/simulator/speed", json={"speed_multiplier": 25.0}, headers=manager_headers)
    assert resp_speed.status_code == 200
    assert resp_speed.json()["speed_multiplier"] == 25.0

    # 5. Speed multiplier validation: 1 to 200
    # Negative / zero -> 422
    assert client.post("/simulator/speed", json={"speed_multiplier": 0.0}, headers=manager_headers).status_code == 422
    assert client.post("/simulator/speed", json={"speed_multiplier": -5.0}, headers=manager_headers).status_code == 422
    # Greater than 200 -> 422
    assert client.post("/simulator/speed", json={"speed_multiplier": 201.0}, headers=manager_headers).status_code == 422
    assert client.post("/simulator/speed", json={"speed_multiplier": 1000.0}, headers=manager_headers).status_code == 422
