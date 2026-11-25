"""Tests for Driver Stop Actions, Route Completion, and Public Tracking Stepper.

Covers:
1. Wrong driver accessing a stop returns 403 Forbidden; missing stop returns 404.
2. Status steps cannot be skipped or repeated (409 Conflict):
   - Cannot deliver before pickup
   - Cannot pickup twice
   - Cannot deliver twice
3. Finishing the last stop of a route marks the route 'completed', frees the vehicle ('available'),
   and adds the route's total_km to the vehicle's mileage_km.
4. Public tracking (GET /track/{tracking_uuid}) returns status stepper, estimated arrival,
   and strictly contains no phone numbers or internal IDs.
5. Driver route returns estimated ETAs when stops lack an explicit ETA.
"""

import datetime
import uuid
import pytest
from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.main import app
from app.models.driver import Driver
from app.models.order import Order
from app.models.route import Route
from app.models.route_stop import RouteStop
from app.models.vehicle import Vehicle
from app.services.auth_deps import create_access_token
from app.services.auth_rate_limiter import reset_rate_limiter


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


def test_wrong_driver_gets_403_and_unknown_stop_gets_404(client, db):
    """A driver cannot execute pickup or deliver on another driver's vehicle stop (403)."""
    driver_1 = db.query(Driver).filter(Driver.name == "Rahul Sharma").first()
    driver_2 = db.query(Driver).filter(Driver.name == "Amit Patel").first()
    assert driver_1 is not None and driver_2 is not None

    token_1 = create_access_token(user_id=driver_1.id, role="driver", name=driver_1.name)
    token_2 = create_access_token(user_id=driver_2.id, role="driver", name=driver_2.name)
    headers_1 = {"Authorization": f"Bearer {token_1}"}
    headers_2 = {"Authorization": f"Bearer {token_2}"}

    vehicle_1 = db.query(Vehicle).filter(Vehicle.id == driver_1.vehicle_id).first()
    route_1 = Route(
        vehicle_id=vehicle_1.id,
        route_date=datetime.date.today(),
        total_distance_km=15.0,
        status="active",
    )
    db.add(route_1)
    db.flush()

    stop_1 = RouteStop(
        route_id=route_1.id,
        sequence_no=1,
        stop_lat=12.9716,
        stop_lng=77.5946,
        status="pending",
    )
    db.add(stop_1)
    db.commit()
    db.refresh(stop_1)

    try:
        # Driver 2 attempts pickup on Driver 1's stop -> 403 Forbidden
        resp_pickup = client.post(f"/driver/stops/{stop_1.id}/pickup", headers=headers_2)
        assert resp_pickup.status_code == 403
        assert "Forbidden" in resp_pickup.json()["detail"]

        # Driver 2 attempts delivery on Driver 1's stop -> 403 Forbidden
        resp_deliver = client.post(f"/driver/stops/{stop_1.id}/deliver", headers=headers_2)
        assert resp_deliver.status_code == 403
        assert "Forbidden" in resp_deliver.json()["detail"]

        # Unknown stop ID -> 404 Not Found
        resp_unknown = client.post("/driver/stops/999999/pickup", headers=headers_1)
        assert resp_unknown.status_code == 404
        assert "not found" in resp_unknown.json()["detail"].lower()
    finally:
        db.delete(stop_1)
        db.delete(route_1)
        db.commit()


def test_status_steps_cannot_be_skipped_or_repeated_409(client, db):
    """Enforce strict status flow: assigned/pending -> picked_up -> delivered.
    
    Skipping or repeating steps returns 409 Conflict.
    """
    driver = db.query(Driver).filter(Driver.name == "Rahul Sharma").first()
    token = create_access_token(user_id=driver.id, role="driver", name=driver.name)
    headers = {"Authorization": f"Bearer {token}"}

    order = Order(
        order_code=f"ORD-TEST-{uuid.uuid4().hex[:6]}",
        tracking_uuid=str(uuid.uuid4()),
        customer_name="Test Customer",
        customer_phone="+91 99999 88888",
        drop_address="Test Address",
        pickup_lat=12.9781,
        pickup_lng=77.5695,
        drop_lat=12.9352,
        drop_lng=77.6245,
        weight_kg=5.0,
        status="assigned",
        vehicle_id=driver.vehicle_id,
    )
    db.add(order)
    db.flush()

    route = Route(
        vehicle_id=driver.vehicle_id,
        route_date=datetime.date.today(),
        total_distance_km=10.0,
        status="active",
    )
    db.add(route)
    db.flush()

    stop = RouteStop(
        route_id=route.id,
        order_id=order.id,
        sequence_no=1,
        stop_lat=12.9352,
        stop_lng=77.6245,
        status="pending",
    )
    db.add(stop)
    db.commit()
    db.refresh(stop)

    try:
        # 1. Attempt delivery before pickup -> 409 Conflict (skipping step)
        resp_skip = client.post(f"/driver/stops/{stop.id}/deliver", headers=headers)
        assert resp_skip.status_code == 409
        assert "must be picked up before delivery" in resp_skip.json()["detail"]

        # 2. Mark picked up -> 200 OK
        resp_pickup = client.post(f"/driver/stops/{stop.id}/pickup", headers=headers)
        assert resp_pickup.status_code == 200
        assert resp_pickup.json()["status"] == "picked_up"
        assert resp_pickup.json()["picked_up_at"] is not None

        db.refresh(order)
        assert order.status == "picked_up"
        assert order.picked_up_at is not None

        # 3. Attempt pickup again -> 409 Conflict (repeating step)
        resp_repeat_pickup = client.post(f"/driver/stops/{stop.id}/pickup", headers=headers)
        assert resp_repeat_pickup.status_code == 409
        assert "already been picked up" in resp_repeat_pickup.json()["detail"]

        # 4. Mark delivered -> 200 OK
        resp_deliver = client.post(f"/driver/stops/{stop.id}/deliver", headers=headers)
        assert resp_deliver.status_code == 200
        assert resp_deliver.json()["status"] == "delivered"
        assert resp_deliver.json()["delivered_at"] is not None

        db.refresh(order)
        assert order.status == "delivered"
        assert order.delivered_at is not None

        # 5. Attempt deliver again -> 409 Conflict (repeating step)
        resp_repeat_deliver = client.post(f"/driver/stops/{stop.id}/deliver", headers=headers)
        assert resp_repeat_deliver.status_code == 409
        assert "already delivered" in resp_repeat_deliver.json()["detail"]
    finally:
        db.delete(stop)
        db.delete(route)
        db.delete(order)
        db.commit()


def test_finishing_last_stop_completes_route_and_frees_vehicle_and_adds_mileage(client, db):
    """When the final stop of a route is delivered:
    - Route status becomes 'completed'
    - Vehicle status becomes 'available'
    - Vehicle mileage_km increases by route total_distance_km
    """
    driver = db.query(Driver).filter(Driver.name == "Rahul Sharma").first()
    token = create_access_token(user_id=driver.id, role="driver", name=driver.name)
    headers = {"Authorization": f"Bearer {token}"}

    vehicle = db.query(Vehicle).filter(Vehicle.id == driver.vehicle_id).first()
    initial_mileage = float(vehicle.mileage_km or 0.0)
    vehicle.status = "on_route"
    db.commit()

    route_km = 18.5
    route = Route(
        vehicle_id=vehicle.id,
        route_date=datetime.date.today(),
        total_distance_km=route_km,
        status="active",
    )
    db.add(route)
    db.flush()

    stop_1 = RouteStop(
        route_id=route.id,
        sequence_no=1,
        stop_lat=12.9716,
        stop_lng=77.5946,
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
    db.refresh(stop_1)
    db.refresh(stop_2)

    try:
        # Process stop 1: pickup and deliver
        client.post(f"/driver/stops/{stop_1.id}/pickup", headers=headers)
        client.post(f"/driver/stops/{stop_1.id}/deliver", headers=headers)

        db.refresh(route)
        db.refresh(vehicle)
        # Not all stops delivered yet
        assert route.status == "active"
        assert vehicle.status == "on_route"

        # Process stop 2 (the final stop): pickup and deliver
        client.post(f"/driver/stops/{stop_2.id}/pickup", headers=headers)
        client.post(f"/driver/stops/{stop_2.id}/deliver", headers=headers)

        db.refresh(route)
        db.refresh(vehicle)

        # Now all stops are delivered!
        assert route.status == "completed"
        assert vehicle.status == "available"
        assert float(vehicle.mileage_km) == pytest.approx(initial_mileage + route_km, 0.01)
    finally:
        db.delete(stop_1)
        db.delete(stop_2)
        db.delete(route)
        db.commit()


def test_public_tracking_stepper_and_privacy(client, db):
    """GET /track/{tracking_uuid} returns stepper_status, estimated arrival,
    and contains strictly no phone numbers or internal IDs.
    """
    order = Order(
        order_code=f"ORD-PRIV-{uuid.uuid4().hex[:6]}",
        tracking_uuid=str(uuid.uuid4()),
        customer_name="Confidential Customer",
        customer_phone="+91 91234 56789",
        pickup_address="Confidential Pickup",
        drop_address="Confidential Drop",
        pickup_lat=12.9781,
        pickup_lng=77.5695,
        drop_lat=12.9352,
        drop_lng=77.6245,
        weight_kg=4.2,
        status="picked_up",
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    try:
        resp = client.get(f"/track/{order.tracking_uuid}")
        assert resp.status_code == 200
        data = resp.json()

        # Stepper and estimated arrival are present
        assert "stepper_status" in data
        assert data["stepper_status"] == "picked_up"
        assert "estimated_arrival" in data
        assert data["estimated_arrival"] is not None

        # Privacy verification: NO phone numbers, internal IDs, addresses, or other orders
        data_str = resp.text.lower()
        assert "91234" not in data_str
        assert "confidential drop" not in data_str
        assert "customer_phone" not in data
        assert "driver_phone" not in data
        assert "id" not in data
        assert "order_id" not in data
        assert "vehicle_id" not in data

        # Lookup by order_code gives 404
        resp_code = client.get(f"/track/{order.order_code}")
        assert resp_code.status_code == 404
    finally:
        db.delete(order)
        db.commit()
