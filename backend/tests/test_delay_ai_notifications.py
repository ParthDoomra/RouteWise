"""Tests for AI Delay Message Generation, Delay Detection, and Notifications.

Validates the locked architectural and security design (03-Security-and-Access-Document.md):
1. Prompt sent to the API contains reason, minutes and zone ONLY; contains NO customer name, phone, address, code, or link.
2. API success saves is_ai_generated=True and generation_source='claude'.
3. Timeout, API error, missing key, and invalid output (URL, extra digits, empty) all fall back to template with is_ai_generated=False.
4. Customer name and tracking link are added after generation locally.
5. One open delay per order; repeat reports update without duplicate messages.
6. 5-minute per-order AI rate limit.
7. Driver cannot report delay on another driver's stop (403); invalid reason/minutes rejected (422); tracking response has no phone number.
"""

import datetime
from unittest.mock import MagicMock, patch
import uuid
import pytest
from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.main import app
from app.models.delay_event import DelayEvent
from app.models.driver import Driver
from app.models.notification import Notification
from app.models.order import Order
from app.models.route import Route
from app.models.route_stop import RouteStop
from app.models.vehicle import Vehicle
from app.services.ai_delay_message import (
    generate_delay_message,
    local_merge_customer_message,
    reset_ai_rate_limiter,
    validate_ai_message,
)
from app.services.auth_deps import create_access_token
from app.services.auth_rate_limiter import reset_rate_limiter
from app.services.delay_notification_service import record_or_update_delay


@pytest.fixture(autouse=True)
def clean_limits():
    """Reset both auth and AI rate limiters before and after each test."""
    reset_rate_limiter()
    reset_ai_rate_limiter()
    yield
    reset_rate_limiter()
    reset_ai_rate_limiter()


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db():
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
# 1. AI Boundary & Prompt Data Isolation
# =============================================================================

def test_prompt_contains_only_structured_data_and_no_personal_info():
    """The prompt sent to Claude contains ONLY reason, minutes, and zone.
    It MUST NEVER contain customer name, phone, address, order code, or link.
    """
    mock_client = MagicMock()
    mock_msg = MagicMock()
    block = MagicMock()
    block.text = "Your delivery is running 25 minutes late due to heavy traffic in Indiranagar."
    mock_msg.content = [block]
    mock_client.messages.create.return_value = mock_msg

    customer_name = "Jane Doe"
    customer_phone = "+91 98765 43210"
    customer_address = "123 Palm Grove Road, Indiranagar, Bengaluru"
    order_code = "ORD-SECRET-999"
    tracking_link = "http://localhost:5173/track/uuid-xyz"

    with patch("app.services.ai_delay_message.ANTHROPIC_API_KEY", "sk-ant-test-key"):
        msg, source = generate_delay_message(
            reason="traffic",
            delay_minutes=25,
            zone="Indiranagar",
            order_id=101,
            anthropic_client=mock_client,
        )

    assert source == "claude"
    assert "25" in msg

    # Inspect the exact call args sent to client.messages.create
    mock_client.messages.create.assert_called_once()
    _, kwargs = mock_client.messages.create.call_args

    user_prompt = kwargs["messages"][0]["content"]
    system_prompt = kwargs["system"]
    combined_prompts = f"{user_prompt} {system_prompt}"

    # Verify structured fields ARE present
    assert "traffic" in user_prompt.lower()
    assert "25" in user_prompt
    assert "Indiranagar" in user_prompt

    # Verify sensitive personal data IS STRICTLY ABSENT from prompt
    assert customer_name not in combined_prompts
    assert customer_phone not in combined_prompts
    assert customer_address not in combined_prompts
    assert order_code not in combined_prompts
    assert tracking_link not in combined_prompts
    assert "@" not in combined_prompts
    assert "http" not in combined_prompts


# =============================================================================
# 2. Claude API Success vs. Error Fallbacks
# =============================================================================

def test_api_success_saves_claude_source():
    """On Claude API success, source is 'claude' and is_ai_generated is True."""
    mock_client = MagicMock()
    block = MagicMock()
    block.text = "Your order is running approximately 15 minutes behind schedule due to adverse weather."
    mock_client.messages.create.return_value = MagicMock(content=[block])

    with patch("app.services.ai_delay_message.ANTHROPIC_API_KEY", "sk-ant-test-key"):
        msg, source = generate_delay_message(
            reason="weather",
            delay_minutes=15,
            zone="Jayanagar",
            order_id=202,
            anthropic_client=mock_client,
        )

    assert source == "claude"
    assert "15" in msg


def test_fallbacks_on_missing_key_timeout_error_and_invalid_output():
    """Missing key, timeouts, API exceptions, and invalid output must all fall back
    to deterministic templates with source='template'.
    """
    # A. Missing or placeholder API key
    with patch("app.services.ai_delay_message.ANTHROPIC_API_KEY", ""):
        msg_nokey, src_nokey = generate_delay_message(reason="traffic", delay_minutes=20, zone="Koramangala")
        assert src_nokey == "template"
        assert "20 minutes late" in msg_nokey

    # B. API Timeout / Exception
    mock_timeout_client = MagicMock()
    mock_timeout_client.messages.create.side_effect = Exception("Anthropic API connection timed out after 8.0s")
    with patch("app.services.ai_delay_message.ANTHROPIC_API_KEY", "sk-ant-test-key"):
        msg_timeout, src_timeout = generate_delay_message(
            reason="vehicle_issue",
            delay_minutes=30,
            zone="Whitefield",
            order_id=203,
            anthropic_client=mock_timeout_client,
        )
        assert src_timeout == "template"
        assert "30 minutes late" in msg_timeout

    # C. Invalid output: contains forbidden URLs
    mock_url_client = MagicMock()
    block_url = MagicMock()
    block_url.text = "Your delivery is delayed 15 minutes. Check https://spam.com/track for details."
    mock_url_client.messages.create.return_value = MagicMock(content=[block_url])
    with patch("app.services.ai_delay_message.ANTHROPIC_API_KEY", "sk-ant-test-key"):
        msg_badurl, src_badurl = generate_delay_message(
            reason="traffic",
            delay_minutes=15,
            zone="BTM Layout",
            order_id=204,
            anthropic_client=mock_url_client,
        )
        assert src_badurl == "template"

    # D. Invalid output: contains extra / hallucinated digits
    mock_digits_client = MagicMock()
    block_digits = MagicMock()
    block_digits.text = "Your delivery is delayed 15 minutes and will arrive at 5:45 PM on route 102."
    mock_digits_client.messages.create.return_value = MagicMock(content=[block_digits])
    with patch("app.services.ai_delay_message.ANTHROPIC_API_KEY", "sk-ant-test-key"):
        msg_baddigits, src_baddigits = generate_delay_message(
            reason="traffic",
            delay_minutes=15,
            zone="BTM Layout",
            order_id=205,
            anthropic_client=mock_digits_client,
        )
        assert src_baddigits == "template"

    # E. Invalid output: empty response
    mock_empty_client = MagicMock()
    block_empty = MagicMock()
    block_empty.text = ""
    mock_empty_client.messages.create.return_value = MagicMock(content=[block_empty])
    with patch("app.services.ai_delay_message.ANTHROPIC_API_KEY", "sk-ant-test-key"):
        msg_empty, src_empty = generate_delay_message(
            reason="traffic",
            delay_minutes=15,
            zone="BTM Layout",
            order_id=206,
            anthropic_client=mock_empty_client,
        )
        assert src_empty == "template"


# =============================================================================
# 3. Local Personalization Merge
# =============================================================================

def test_local_merge_adds_name_and_link():
    """Customer name and tracking link are attached locally AFTER generation."""
    core = "Your delivery is running about 20 minutes late due to heavy traffic."
    merged = local_merge_customer_message(
        core_message=core,
        customer_name="Pooja Hegde",
        tracking_uuid="abc-123-uuid",
    )
    assert merged.startswith("Hi Pooja,")
    assert core in merged
    assert merged.endswith("/track/abc-123-uuid")


# =============================================================================
# 4. Rate Limiting: 5-Minute Per-Order Limit
# =============================================================================

def test_ai_rate_limit_5_minutes_per_order():
    """At most one AI call per order per 5 minutes; subsequent calls use fallback template."""
    mock_client = MagicMock()
    block = MagicMock()
    block.text = "Your package is running 15 minutes late due to traffic."
    mock_client.messages.create.return_value = MagicMock(content=[block])

    with patch("app.services.ai_delay_message.ANTHROPIC_API_KEY", "sk-ant-test-key"):
        # 1st call for order 301: succeeds with Claude
        _, src1 = generate_delay_message(
            reason="traffic", delay_minutes=15, zone="Indiranagar", order_id=301, anthropic_client=mock_client
        )
        assert src1 == "claude"

        # 2nd call for SAME order 301 within 5 minutes: throttled to template!
        _, src2 = generate_delay_message(
            reason="traffic", delay_minutes=15, zone="Indiranagar", order_id=301, anthropic_client=mock_client
        )
        assert src2 == "template"

        # Call for a DIFFERENT order 302: allowed!
        _, src3 = generate_delay_message(
            reason="traffic", delay_minutes=15, zone="Indiranagar", order_id=302, anthropic_client=mock_client
        )
        assert src3 == "claude"


# =============================================================================
# 5. One Open Delay Per Order & Repeat Update Deduplication
# =============================================================================

def test_one_open_delay_and_repeat_report_deduplication(db):
    """Only one open delay event per order at a time; repeat updates it without duplicate notifications."""
    order = Order(
        order_code=f"ORD-DLY-{uuid.uuid4().hex[:6]}",
        tracking_uuid=str(uuid.uuid4()),
        customer_name="Arjun Kapoor",
        pickup_lat=12.9716, pickup_lng=77.5946,
        drop_lat=12.9800, drop_lng=77.6080,
        weight_kg=8.0,
        status="assigned",
        zone="Indiranagar",
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    try:
        # 1. First delay report: creates open event and 1 notification row
        ev1, notif1, is_repeat1 = record_or_update_delay(
            db=db, order=order, reason="traffic", delay_minutes=15
        )
        assert not is_repeat1
        assert ev1.status == "open"
        assert ev1.delay_minutes == 15
        assert order.latest_delay_message is not None

        open_events_count = db.query(DelayEvent).filter(
            DelayEvent.order_id == order.id, DelayEvent.status == "open"
        ).count()
        assert open_events_count == 1

        # 2. Second (repeat) delay report: updates existing event and message without duplicate rows
        ev2, notif2, is_repeat2 = record_or_update_delay(
            db=db, order=order, reason="weather", delay_minutes=35
        )
        assert is_repeat2
        assert ev2.id == ev1.id  # Same event updated
        assert ev2.reason == "weather"
        assert ev2.delay_minutes == 35

        # Open events strictly still 1
        open_events_count_after = db.query(DelayEvent).filter(
            DelayEvent.order_id == order.id, DelayEvent.status == "open"
        ).count()
        assert open_events_count_after == 1

        # Notifications count for this order remains 1 (updated in place)
        total_notifs = db.query(Notification).filter(Notification.order_id == order.id).count()
        assert total_notifs == 1
    finally:
        db.query(Notification).filter(Notification.order_id == order.id).delete()
        db.query(DelayEvent).filter(DelayEvent.order_id == order.id).delete()
        db.delete(order)
        db.commit()


# =============================================================================
# 6. Endpoints, Role Security, Validation & Tracking Privacy
# =============================================================================

def test_delay_endpoints_role_security_and_validation(client, manager_headers, driver_headers, db):
    """Driver cannot report delay on another vehicle's stop (403);
    invalid reason/minutes are rejected (422);
    public tracking endpoint displays delay card without leaking phone numbers.
    """
    # Setup vehicle 1 assigned to driver 1
    # Create order and route stop on vehicle 2 (different vehicle)
    v2_plate = f"KA-OTHER-{uuid.uuid4().hex[:4].upper()}"
    v2 = Vehicle(plate_no=v2_plate, model="Other Van", capacity_kg=900.0, status="available")
    db.add(v2)
    db.flush()

    route2 = Route(vehicle_id=v2.id, route_date=datetime.date.today(), status="active")
    db.add(route2)
    db.flush()

    order = Order(
        order_code=f"ORD-PRIV-{uuid.uuid4().hex[:6]}",
        tracking_uuid=str(uuid.uuid4()),
        customer_name="Secret Customer",
        customer_phone="+91 99999 00000",
        pickup_lat=12.9716, pickup_lng=77.5946,
        drop_lat=12.9800, drop_lng=77.6080,
        weight_kg=12.0,
        status="assigned",
        zone="Jayanagar",
    )
    db.add(order)
    db.flush()

    stop = RouteStop(route_id=route2.id, order_id=order.id, sequence_no=1, status="pending")
    db.add(stop)
    db.commit()

    try:
        # A. Driver 1 attempts to report delay on Vehicle 2's stop -> 403 Forbidden
        d_resp = client.post(
            f"/driver/stops/{stop.id}/report-delay",
            json={"reason": "traffic", "delay_minutes": 20},
            headers=driver_headers,
        )
        assert d_resp.status_code == 403

        # B. Driver reports with invalid delay_minutes (0 or >240) -> 422
        bad_min = client.post(
            f"/driver/stops/{stop.id}/report-delay",
            json={"reason": "traffic", "delay_minutes": 0},
            headers=driver_headers,
        )
        assert bad_min.status_code == 422

        # C. Driver reports with invalid reason enum -> 422
        bad_reason = client.post(
            f"/driver/stops/{stop.id}/report-delay",
            json={"reason": "invented_reason", "delay_minutes": 20},
            headers=driver_headers,
        )
        assert bad_reason.status_code == 422

        # D. Manager flags delay successfully -> 200 OK
        mgr_resp = client.post(
            f"/orders/{order.id}/flag-delay",
            json={"reason": "traffic", "delay_minutes": 25},
            headers=manager_headers,
        )
        assert mgr_resp.status_code == 200
        data = mgr_resp.json()
        assert data["reason"] == "traffic"
        assert data["delay_minutes"] == 25
        assert "message" in data

        # E. Public tracking check: GET /track/{uuid} shows delay message and NO phone number
        track_resp = client.get(f"/track/{order.tracking_uuid}")
        assert track_resp.status_code == 200
        track_data = track_resp.json()
        assert track_data["delay_message"] is not None
        assert "25" in track_data["delay_message"]

        # CRITICAL PRIVACY RULE: No customer phone or driver phone in tracking response
        assert "customer_phone" not in track_data
        assert "driver_phone" not in track_data
        assert "+91" not in str(track_data)
        assert "99999" not in str(track_data)
    finally:
        db.query(Notification).filter(Notification.order_id == order.id).delete()
        db.query(DelayEvent).filter(DelayEvent.order_id == order.id).delete()
        db.delete(stop)
        db.delete(order)
        db.delete(route2)
        db.delete(v2)
        db.commit()
