"""Core Backend API Test Suite for RouteWise.

Tests:
1. Manager endpoints reject driver tokens (403) and missing tokens (401).
2. POST /orders generates unique order_code and tracking_uuid (UUID4); status="pending".
3. POST /routes/optimize assigns orders, persists route_stops in order, and rejects
   non-existent entities, already-assigned orders, and overweight loads.
4. GET /driver/route strictly isolates driver access (driver only sees their own assigned route).
5. Public tracking (GET /track/{uuid}) works by tracking_uuid, rejects order_code with 404,
   and leaks zero phone numbers, internal IDs, or address lists.
6. Pydantic validation rejects out-of-range coordinates and non-positive weights.
7. Maintenance and notifications endpoints function with appropriate filtering and resolution.
8. No network calls: OSRM distance provider is mocked.
"""

import datetime
import uuid
import pytest
from fastapi.testclient import TestClient

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


@pytest.fixture(autouse=True)
def clean_rate_limits():
    """Ensure rate limiter state is fresh before each test."""
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
    """Authentication headers for an authorized manager."""
    token = create_access_token(user_id=1, role="manager", name="Fleet Operations Manager")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def driver_headers():
    """Authentication headers for a driver."""
    token = create_access_token(user_id=1, role="driver", name="Rahul Sharma")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def mock_distance_matrix(monkeypatch):
    """Mock distance_provider.get_distance_matrix to avoid external OSRM network calls."""
    def fake_get_distance_matrix(points, mode="road"):
        n = len(points)
        # Generate synthetic deterministic Euclidean-like distance matrix in km
        matrix = [[0.0] * n for _ in range(n)]
        for i in range(n):
            for j in range(n):
                if i != j:
                    lat_diff = points[i][0] - points[j][0]
                    lng_diff = points[i][1] - points[j][1]
                    matrix[i][j] = round(((lat_diff ** 2 + lng_diff ** 2) ** 0.5) * 111.0, 2)
        return matrix, "mock_osrm"

    import app.routers.routes
    import app.services.distance_provider
    monkeypatch.setattr(app.routers.routes, "get_distance_matrix", fake_get_distance_matrix)
    monkeypatch.setattr(app.services.distance_provider, "get_distance_matrix", fake_get_distance_matrix)


# =============================================================================
# 1. Manager Role Enforcement (401 Unauthorized / 403 Forbidden)
# =============================================================================

@pytest.mark.parametrize(
    "method,endpoint,payload",
    [
        ("GET", "/orders", None),
        ("POST", "/orders", {
            "pickup_lat": 12.9716, "pickup_lng": 77.5946,
            "drop_lat": 12.9352, "drop_lng": 77.6245, "weight_kg": 10.0,
        }),
        ("GET", "/orders/1", None),
        ("GET", "/vehicles", None),
        ("POST", "/vehicles", {
            "plate_no": "KA-99-ZZ-0001", "capacity_kg": 500.0,
        }),
        ("GET", "/drivers", None),
        ("GET", "/maintenance", None),
        ("PATCH", "/maintenance/1/resolve", None),
        ("GET", "/notifications", None),
        ("POST", "/routes/optimize", {"vehicle_id": 1, "order_ids": [1]}),
        ("GET", "/routes/1", None),
    ],
)
def test_manager_endpoints_reject_missing_and_driver_tokens(
    client, driver_headers, method, endpoint, payload
):
    """Manager endpoints strictly return 401 without token and 403 with driver token."""
    # A. Missing Token -> 401
    resp_no_token = client.request(method, endpoint, json=payload)
    assert resp_no_token.status_code == 401
    assert "Missing authentication token" in resp_no_token.json()["detail"]

    # B. Driver Token -> 403
    resp_driver = client.request(method, endpoint, json=payload, headers=driver_headers)
    assert resp_driver.status_code == 403
    assert "Manager role required" in resp_driver.json()["detail"]


# =============================================================================
# 2. POST /orders: Unique order_code, tracking_uuid, Status pending
# =============================================================================

def test_post_orders_generates_unique_codes_and_uuid(client, manager_headers, db):
    """POST /orders generates unique order_code (ORD-xxxx) and tracking_uuid (UUID4)."""
    payload_1 = {
        "customer_name": "Test Customer Alpha",
        "customer_phone": "+91 91234 56780",
        "pickup_address": "Depot Alpha, Bengaluru",
        "drop_address": "Tech Park Alpha, Bengaluru",
        "pickup_lat": 12.9716,
        "pickup_lng": 77.5946,
        "drop_lat": 12.9352,
        "drop_lng": 77.6245,
        "weight_kg": 15.5,
    }

    payload_2 = {
        "customer_name": "Test Customer Beta",
        "customer_phone": "+91 91234 56781",
        "pickup_address": "Depot Beta, Bengaluru",
        "drop_address": "Tech Park Beta, Bengaluru",
        "pickup_lat": 12.9810,
        "pickup_lng": 77.5920,
        "drop_lat": 12.9200,
        "drop_lng": 77.6100,
        "weight_kg": 22.0,
    }

    resp1 = client.post("/orders", json=payload_1, headers=manager_headers)
    assert resp1.status_code == 201
    data1 = resp1.json()
    assert data1["order_code"].startswith("ORD-")
    assert uuid.UUID(data1["tracking_uuid"]).version == 4
    assert data1["status"] == "pending"
    assert data1["weight_kg"] == 15.5
    assert data1["vehicle_id"] is None

    resp2 = client.post("/orders", json=payload_2, headers=manager_headers)
    assert resp2.status_code == 201
    data2 = resp2.json()
    assert data2["order_code"].startswith("ORD-")
    assert uuid.UUID(data2["tracking_uuid"]).version == 4
    assert data2["status"] == "pending"

    # Verify uniqueness
    assert data1["order_code"] != data2["order_code"]
    assert data1["tracking_uuid"] != data2["tracking_uuid"]

    # Verify GET /orders/{id}
    get_resp = client.get(f"/orders/{data1['id']}", headers=manager_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["order_code"] == data1["order_code"]

    # Verify GET /orders filter by status
    list_resp = client.get("/orders?status=pending", headers=manager_headers)
    assert list_resp.status_code == 200
    order_codes = [o["order_code"] for o in list_resp.json()]
    assert data1["order_code"] in order_codes
    assert data2["order_code"] in order_codes


# =============================================================================
# 3. Route Optimization & Order Assignment
# =============================================================================

def test_route_optimization_and_rejection_rules(
    client, manager_headers, mock_distance_matrix, db
):
    """POST /routes/optimize assigns orders, saves stops in order, and rejects invalid scenarios."""
    # Create vehicle with 50.0 kg capacity
    veh = Vehicle(
        plate_no=f"KA-09-TEST-{uuid.uuid4().hex[:4].upper()}",
        model="Electric Delivery Van",
        capacity_kg=50.0,
        status="available",
        current_lat=12.9781,
        current_lng=77.5695,
        mileage_km=100.0,
    )
    db.add(veh)
    db.commit()
    db.refresh(veh)

    # Create 2 pending orders within capacity (20 kg + 25 kg = 45 kg <= 50 kg)
    o1 = Order(
        order_code=f"ORD-T1-{uuid.uuid4().hex[:4].upper()}",
        tracking_uuid=str(uuid.uuid4()),
        customer_name="Test Customer 1",
        pickup_lat=12.9781,
        pickup_lng=77.5695,
        drop_lat=12.9716,
        drop_lng=77.5946,
        weight_kg=20.0,
        status="pending",
    )
    o2 = Order(
        order_code=f"ORD-T2-{uuid.uuid4().hex[:4].upper()}",
        tracking_uuid=str(uuid.uuid4()),
        customer_name="Test Customer 2",
        pickup_lat=12.9781,
        pickup_lng=77.5695,
        drop_lat=12.9352,
        drop_lng=77.6245,
        weight_kg=25.0,
        status="pending",
    )
    # Create an overweight order (60 kg > 50 kg)
    o_overweight = Order(
        order_code=f"ORD-T3-{uuid.uuid4().hex[:4].upper()}",
        tracking_uuid=str(uuid.uuid4()),
        customer_name="Test Overweight",
        pickup_lat=12.9781,
        pickup_lng=77.5695,
        drop_lat=12.9308,
        drop_lng=77.5838,
        weight_kg=60.0,
        status="pending",
    )
    db.add_all([o1, o2, o_overweight])
    db.commit()
    db.refresh(o1)
    db.refresh(o2)
    db.refresh(o_overweight)

    # 1. Rejection: Non-existent vehicle
    bad_veh_resp = client.post(
        "/routes/optimize",
        json={"vehicle_id": 999999, "order_ids": [o1.id, o2.id]},
        headers=manager_headers,
    )
    assert bad_veh_resp.status_code == 404
    assert "Vehicle with ID 999999 not found" in bad_veh_resp.json()["detail"]

    # 2. Rejection: Non-existent order
    bad_ord_resp = client.post(
        "/routes/optimize",
        json={"vehicle_id": veh.id, "order_ids": [o1.id, 999999]},
        headers=manager_headers,
    )
    assert bad_ord_resp.status_code == 404
    assert "Orders not found" in bad_ord_resp.json()["detail"]

    # 3. Rejection: Total weight exceeds vehicle capacity
    overweight_resp = client.post(
        "/routes/optimize",
        json={"vehicle_id": veh.id, "order_ids": [o1.id, o_overweight.id]},
        headers=manager_headers,
    )
    assert overweight_resp.status_code == 400
    assert "exceeds vehicle capacity" in overweight_resp.json()["detail"]

    # 4. Successful Optimization
    success_resp = client.post(
        "/routes/optimize",
        json={"vehicle_id": veh.id, "order_ids": [o1.id, o2.id]},
        headers=manager_headers,
    )
    assert success_resp.status_code == 200
    res_data = success_resp.json()

    # Validate returned fields
    assert "route_id" in res_data
    assert res_data["vehicle_id"] == veh.id
    assert "stop_order" in res_data
    assert set(res_data["stop_order"]) == {o1.id, o2.id}
    assert "leg_by_leg_km" in res_data
    assert len(res_data["leg_by_leg_km"]) == 3  # Depot -> Stop 1 -> Stop 2 -> Depot
    assert res_data["total_km"] > 0
    assert res_data["nearest_neighbor_km"] > 0
    assert "improvement_percent" in res_data
    assert "runtime_ms" in res_data
    assert res_data["distance_source"] == "mock_osrm"
    assert len(res_data["stops"]) == 2

    # Validate DB state updates
    db.refresh(o1)
    db.refresh(o2)
    db.refresh(veh)
    assert o1.status == "assigned"
    assert o1.vehicle_id == veh.id
    assert o2.status == "assigned"
    assert o2.vehicle_id == veh.id
    assert veh.status == "on_route"

    # Validate stops persisted in visit order
    db_stops = (
        db.query(RouteStop)
        .filter(RouteStop.route_id == res_data["route_id"])
        .order_by(RouteStop.sequence_no.asc())
        .all()
    )
    assert len(db_stops) == 2
    assert [s.order_id for s in db_stops] == res_data["stop_order"]
    assert db_stops[0].sequence_no == 1
    assert db_stops[1].sequence_no == 2

    # 5. Rejection: Already-assigned orders cannot be re-optimized
    already_assigned_resp = client.post(
        "/routes/optimize",
        json={"vehicle_id": veh.id, "order_ids": [o1.id]},
        headers=manager_headers,
    )
    assert already_assigned_resp.status_code == 400
    assert "already assigned" in already_assigned_resp.json()["detail"]

    # 6. GET /routes/{vehicle_id} returns current route
    route_resp = client.get(f"/routes/{veh.id}", headers=manager_headers)
    assert route_resp.status_code == 200
    assert route_resp.json()["id"] == res_data["route_id"]
    assert len(route_resp.json()["stops"]) == 2


# =============================================================================
# 4. Driver Endpoint Isolation (GET /driver/route)
# =============================================================================

def test_driver_endpoint_isolation(client, manager_headers, db):
    """Driver strictly sees only their own vehicle route; cannot view other drivers' routes."""
    # Find seeded driver 1 (Rahul Sharma, assigned to vehicle KA-01-EA-1024)
    driver_1 = db.query(Driver).filter(Driver.name == "Rahul Sharma").first()
    assert driver_1 is not None

    # Find another driver (Amit Patel)
    driver_2 = db.query(Driver).filter(Driver.name == "Amit Patel").first()
    assert driver_2 is not None

    # Create active route for driver 1's vehicle
    route_1 = Route(
        vehicle_id=driver_1.vehicle_id,
        route_date=datetime.date.today(),
        total_distance_km=14.5,
        total_time_min=35.0,
        status="active",
    )
    db.add(route_1)
    db.commit()
    db.refresh(route_1)

    # Add stop for route 1
    stop_1 = RouteStop(
        route_id=route_1.id,
        sequence_no=1,
        stop_lat=12.9750,
        stop_lng=77.6010,
        status="pending",
    )
    db.add(stop_1)
    db.commit()

    # Generate token for driver 1
    token_1 = create_access_token(user_id=driver_1.id, role="driver", name=driver_1.name)
    headers_1 = {"Authorization": f"Bearer {token_1}"}

    # Driver 1 retrieves their route -> succeeds and gets route_1
    resp_1 = client.get("/driver/route", headers=headers_1)
    assert resp_1.status_code == 200
    assert resp_1.json()["id"] == route_1.id
    assert resp_1.json()["vehicle_id"] == driver_1.vehicle_id

    # Driver 2 retrieves their route with their own token
    token_2 = create_access_token(user_id=driver_2.id, role="driver", name=driver_2.name)
    headers_2 = {"Authorization": f"Bearer {token_2}"}

    resp_2 = client.get("/driver/route", headers=headers_2)
    # Driver 2's vehicle has no route -> 404 (strictly does NOT see driver 1's route)
    assert resp_2.status_code == 404
    assert "No delivery route assigned" in resp_2.json()["detail"]

    # Manager token accessing driver route -> 403 Forbidden
    resp_mgr_on_driver = client.get("/driver/route", headers=manager_headers)
    assert resp_mgr_on_driver.status_code == 403
    assert "Driver role required" in resp_mgr_on_driver.json()["detail"]


# =============================================================================
# 5. Public Tracking (GET /track/{tracking_uuid})
# =============================================================================

def test_public_tracking_by_uuid_and_leak_prevention(client, db):
    """Tracking works by UUID4 only, rejects order_code (404), and leaks zero private fields."""
    # Query seeded order with driver & vehicle (ORD-8942)
    order = db.query(Order).filter(Order.order_code == "ORD-8942").first()
    assert order is not None
    assert order.tracking_uuid is not None

    # A. Successful lookup by tracking_uuid without authentication
    resp = client.get(f"/track/{order.tracking_uuid}")
    assert resp.status_code == 200
    data = resp.json()

    # Required fields present
    assert data["order_code"] == "ORD-8942"
    assert data["status"] in ["delayed", "in_transit", "assigned", "pending", "delivered"]
    assert "driver_first_name" in data
    assert data["driver_first_name"] == "Priya"  # Priya Nair's first name
    assert "vehicle_position" in data
    assert data["vehicle_position"]["lat"] == 12.9352
    assert data["vehicle_position"]["lng"] == 77.6245
    assert "delay_message" in data
    assert data["delay_message"] is not None
    assert "traffic congestion" in data["delay_message"]

    # Privacy verification: Strict absence of sensitive fields
    data_keys = set(data.keys())
    assert "id" not in data_keys
    assert "customer_phone" not in data_keys
    assert "driver_phone" not in data_keys
    assert "phone" not in data_keys
    assert "customer_name" not in data_keys
    assert "pickup_address" not in data_keys
    assert "drop_address" not in data_keys
    assert "vehicle_id" not in data_keys
    assert "driver_id" not in data_keys
    assert "route_id" not in data_keys

    # B. Lookup by order_code strictly returns 404
    resp_by_code = client.get(f"/track/{order.order_code}")
    assert resp_by_code.status_code == 404
    assert "Order tracking not found" in resp_by_code.json()["detail"]

    # C. Bad or unknown UUID returns 404
    resp_bad_uuid = client.get(f"/track/{uuid.uuid4()}")
    assert resp_bad_uuid.status_code == 404
    assert "Order tracking not found" in resp_bad_uuid.json()["detail"]


# =============================================================================
# 6. Pydantic Schema Validation (Coordinates -90..90, -180..180, Weight > 0)
# =============================================================================

@pytest.mark.parametrize(
    "invalid_field,invalid_value",
    [
        ("pickup_lat", 90.1),
        ("pickup_lat", -90.1),
        ("pickup_lng", 180.1),
        ("pickup_lng", -180.1),
        ("drop_lat", 91.0),
        ("drop_lat", -95.0),
        ("drop_lng", 185.0),
        ("drop_lng", -181.0),
        ("weight_kg", 0.0),
        ("weight_kg", -5.0),
    ],
)
def test_order_creation_rejects_invalid_inputs(client, manager_headers, invalid_field, invalid_value):
    """Pydantic rejects out-of-range coordinates and non-positive weight with 422."""
    valid_payload = {
        "pickup_lat": 12.9716,
        "pickup_lng": 77.5946,
        "drop_lat": 12.9352,
        "drop_lng": 77.6245,
        "weight_kg": 10.0,
    }
    invalid_payload = dict(valid_payload)
    invalid_payload[invalid_field] = invalid_value

    resp = client.post("/orders", json=invalid_payload, headers=manager_headers)
    assert resp.status_code == 422


def test_vehicle_creation_validation_and_duplicates(client, manager_headers):
    """Pydantic rejects invalid vehicle capacity and duplicate plate numbers."""
    # Negative capacity -> 422
    resp_neg_cap = client.post(
        "/vehicles",
        json={"plate_no": "KA-01-VAL-01", "capacity_kg": -100.0},
        headers=manager_headers,
    )
    assert resp_neg_cap.status_code == 422

    # Zero capacity -> 422
    resp_zero_cap = client.post(
        "/vehicles",
        json={"plate_no": "KA-01-VAL-02", "capacity_kg": 0.0},
        headers=manager_headers,
    )
    assert resp_zero_cap.status_code == 422

    # Invalid latitude -> 422
    resp_bad_lat = client.post(
        "/vehicles",
        json={"plate_no": "KA-01-VAL-03", "capacity_kg": 500.0, "current_lat": 120.0},
        headers=manager_headers,
    )
    assert resp_bad_lat.status_code == 422

    # Duplicate plate_no -> 400
    unique_plate = f"KA-55-DUP-{uuid.uuid4().hex[:4].upper()}"
    resp_create = client.post(
        "/vehicles",
        json={"plate_no": unique_plate, "capacity_kg": 800.0},
        headers=manager_headers,
    )
    assert resp_create.status_code == 201

    resp_duplicate = client.post(
        "/vehicles",
        json={"plate_no": unique_plate, "capacity_kg": 900.0},
        headers=manager_headers,
    )
    assert resp_duplicate.status_code == 400
    assert "already exists" in resp_duplicate.json()["detail"]


# =============================================================================
# 7. Maintenance & Notifications Endpoints
# =============================================================================

def test_maintenance_and_notifications_endpoints(client, manager_headers, db):
    """Maintenance ticket resolution and notifications filtering operate accurately."""
    # A. Maintenance listing
    maint_list_resp = client.get("/maintenance", headers=manager_headers)
    assert maint_list_resp.status_code == 200
    assert len(maint_list_resp.json()) > 0

    # Create and resolve a ticket
    ticket = MaintenanceTicket(
        vehicle_id=1,
        trigger_type="manual",
        description="Headlight replacement test ticket",
        status="open",
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    resolve_resp = client.patch(f"/maintenance/{ticket.id}/resolve", headers=manager_headers)
    assert resolve_resp.status_code == 200
    assert resolve_resp.json()["status"] == "resolved"
    assert resolve_resp.json()["resolved_at"] is not None

    # Resolve non-existent ticket -> 404
    bad_resolve = client.patch("/maintenance/999999/resolve", headers=manager_headers)
    assert bad_resolve.status_code == 404

    # B. Notifications listing & AI filter
    notif_all_resp = client.get("/notifications", headers=manager_headers)
    assert notif_all_resp.status_code == 200
    all_notifs = notif_all_resp.json()
    assert len(all_notifs) > 0

    notif_ai_resp = client.get("/notifications?is_ai_generated=true", headers=manager_headers)
    assert notif_ai_resp.status_code == 200
    ai_notifs = notif_ai_resp.json()
    assert all(n["is_ai_generated"] is True for n in ai_notifs)

    notif_standard_resp = client.get("/notifications?is_ai_generated=false", headers=manager_headers)
    assert notif_standard_resp.status_code == 200
    std_notifs = notif_standard_resp.json()
    assert all(n["is_ai_generated"] is False for n in std_notifs)
