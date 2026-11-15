"""Authentication & Authorization Test Suite for RouteWise.

Validates the locked ROLE-FIRST authentication design:
1. Manager login works; Driver login works (including multiple phone formats).
2. Strict isolation: Driver credentials to manager endpoint FAIL; Manager credentials to driver endpoint FAIL.
3. Unknown user and wrong secret return the exact IDENTICAL 401 body ("Invalid credentials").
4. Brute-force protection: 5 failures lead to HTTP 429 lockout; correct credentials during lockout are refused.
5. Role enforcement: Driver tokens receive 403 on manager-only routes and vice-versa.
6. Token integrity: Missing, expired, and tampered tokens strictly receive 401.
"""

import datetime
import pytest
from fastapi.testclient import TestClient

from app.main import app
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
    """Test client for FastAPI app."""
    return TestClient(app)


# =============================================================================
# 1. Login Success & Token Issuance
# =============================================================================

def test_manager_login_success(client):
    """Manager can successfully authenticate using demo credentials."""
    resp = client.post(
        "/auth/manager/login",
        json={"email": "manager@routewise.com", "password": "manager123"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["role"] == "manager"
    assert data["display_name"] == "Fleet Operations Manager"
    assert "user_id" in data

    # Verify GET /auth/me returns current manager
    token = data["access_token"]
    me_resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["role"] == "manager"
    assert me_data["email"] == "manager@routewise.com"
    assert "password_hash" not in me_data


def test_driver_login_success_and_phone_normalization(client):
    """Driver login succeeds with standard and variously formatted phone numbers."""
    # Format 1: Exact format stored in database (+91 98450 11223)
    resp1 = client.post(
        "/auth/driver/login",
        json={"phone": "+91 98450 11223", "pin": "1024"},
    )
    assert resp1.status_code == 200
    data1 = resp1.json()
    assert data1["role"] == "driver"
    assert data1["display_name"] == "Rahul Sharma"

    # Format 2: Raw 10 digits without country code or spaces (9845011223)
    resp2 = client.post(
        "/auth/driver/login",
        json={"phone": "9845011223", "pin": "1024"},
    )
    assert resp2.status_code == 200
    assert resp2.json()["display_name"] == "Rahul Sharma"

    # Format 3: With dashes and spaces (+91-98450-11223)
    resp3 = client.post(
        "/auth/driver/login",
        json={"phone": "+91-98450-11223", "pin": "1024"},
    )
    assert resp3.status_code == 200
    assert resp3.json()["display_name"] == "Rahul Sharma"

    # Format 4: With leading 0 (09845011223)
    resp4 = client.post(
        "/auth/driver/login",
        json={"phone": "098450 11223", "pin": "1024"},
    )
    assert resp4.status_code == 200
    assert resp4.json()["display_name"] == "Rahul Sharma"

    # Verify GET /auth/me returns driver details
    token = resp1.json()["access_token"]
    me_resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["role"] == "driver"
    assert me_data["name"] == "Rahul Sharma"
    assert "password_hash" not in me_data
    assert "pin" not in me_data


# =============================================================================
# 2. Strict Cross-Endpoint Isolation
# =============================================================================

def test_cross_endpoint_credentials_isolation(client):
    """Driver credentials on manager endpoint fail; Manager credentials on driver endpoint fail."""
    # Driver credentials to manager endpoint
    resp_driver_on_manager = client.post(
        "/auth/manager/login",
        json={"email": "+91 98450 11223", "password": "1024"},
    )
    assert resp_driver_on_manager.status_code == 401
    assert resp_driver_on_manager.json() == {"detail": "Invalid credentials"}

    # Manager credentials to driver endpoint
    resp_manager_on_driver = client.post(
        "/auth/driver/login",
        json={"phone": "manager@routewise.com", "pin": "manager123"},
    )
    assert resp_manager_on_driver.status_code == 401
    assert resp_manager_on_driver.json() == {"detail": "Invalid credentials"}


# =============================================================================
# 3. Anti-Enumeration: Identical 401 Body
# =============================================================================

def test_wrong_secret_and_unknown_user_return_identical_401(client):
    """Failure responses must be completely indistinguishable to prevent user enumeration."""
    # Case A: Known manager, incorrect password
    resp_wrong_pw = client.post(
        "/auth/manager/login",
        json={"email": "manager@routewise.com", "password": "WrongPassword999!"},
    )

    # Case B: Completely non-existent manager
    resp_unknown_user = client.post(
        "/auth/manager/login",
        json={"email": "nobody@routewise.com", "password": "any-password-here"},
    )

    assert resp_wrong_pw.status_code == 401
    assert resp_unknown_user.status_code == 401
    assert resp_wrong_pw.json() == resp_unknown_user.json() == {"detail": "Invalid credentials"}

    # Driver endpoint check
    resp_driver_wrong_pin = client.post(
        "/auth/driver/login",
        json={"phone": "+91 98450 11223", "pin": "0000"},
    )
    resp_driver_unknown = client.post(
        "/auth/driver/login",
        json={"phone": "9999999999", "pin": "1024"},
    )
    assert resp_driver_wrong_pin.status_code == 401
    assert resp_driver_unknown.status_code == 401
    assert resp_driver_wrong_pin.json() == resp_driver_unknown.json() == {"detail": "Invalid credentials"}


# =============================================================================
# 4. Brute-Force Lockout (5 Failures -> 429)
# =============================================================================

def test_brute_force_lockout_and_refusal_during_lockout(client):
    """5 consecutive failed attempts trigger 429; valid login during lockout is refused."""
    target_email = "lockout_test@routewise.com"

    # Perform 5 failed attempts
    for attempt_idx in range(5):
        resp = client.post(
            "/auth/manager/login",
            json={"email": target_email, "password": f"bad_guess_{attempt_idx}"},
        )
        assert resp.status_code == 401, f"Attempt {attempt_idx + 1} expected 401, got {resp.status_code}"

    # 6th attempt: lockout must be active -> returns 429 Too Many Requests
    resp_lockout_wrong = client.post(
        "/auth/manager/login",
        json={"email": target_email, "password": "bad_guess_6"},
    )
    assert resp_lockout_wrong.status_code == 429
    assert "Retry-After" in resp_lockout_wrong.headers
    assert "Too many failed login attempts" in resp_lockout_wrong.json()["detail"]

    # 7th attempt: even if the user now supplies correct credentials, access is strictly refused
    resp_lockout_correct = client.post(
        "/auth/manager/login",
        json={"email": target_email, "password": "correct_password_here"},
    )
    assert resp_lockout_correct.status_code == 429
    assert "Retry-After" in resp_lockout_correct.headers


# =============================================================================
# 5. Role Protection (403 on Mismatched Roles)
# =============================================================================

def test_role_protection_manager_and_driver_routes(client):
    """Manager cannot access driver-only routes (403); Driver cannot access manager-only routes (403)."""
    # Obtain valid manager token
    mgr_resp = client.post(
        "/auth/manager/login",
        json={"email": "manager@routewise.com", "password": "manager123"},
    )
    mgr_token = mgr_resp.json()["access_token"]

    # Obtain valid driver token
    drv_resp = client.post(
        "/auth/driver/login",
        json={"phone": "+91 98450 11223", "pin": "1024"},
    )
    drv_token = drv_resp.json()["access_token"]

    # Manager accessing manager-only route -> 200 OK
    res_m_m = client.get("/auth/test/manager-only", headers={"Authorization": f"Bearer {mgr_token}"})
    assert res_m_m.status_code == 200
    assert res_m_m.json()["role"] == "manager"

    # Driver accessing manager-only route -> 403 Forbidden
    res_d_m = client.get("/auth/test/manager-only", headers={"Authorization": f"Bearer {drv_token}"})
    assert res_d_m.status_code == 403
    assert "Manager role required" in res_d_m.json()["detail"]

    # Driver accessing driver-only route -> 200 OK
    res_d_d = client.get("/auth/test/driver-only", headers={"Authorization": f"Bearer {drv_token}"})
    assert res_d_d.status_code == 200
    assert res_d_d.json()["role"] == "driver"

    # Manager accessing driver-only route -> 403 Forbidden
    res_m_d = client.get("/auth/test/driver-only", headers={"Authorization": f"Bearer {mgr_token}"})
    assert res_m_d.status_code == 403
    assert "Driver role required" in res_m_d.json()["detail"]


# =============================================================================
# 6. Token Tampering & Expiration (401)
# =============================================================================

def test_tampered_and_expired_tokens_return_401(client):
    """Missing, tampered, or expired tokens must strictly return 401."""
    # A. Missing token
    resp_missing = client.get("/auth/test/manager-only")
    assert resp_missing.status_code == 401
    assert "Missing authentication token" in resp_missing.json()["detail"]

    # B. Tampered token
    valid_token = create_access_token(user_id=1, role="manager", name="Test Manager")
    tampered_token = valid_token[:-4] + "abcd"  # Invalidate cryptographic signature
    resp_tampered = client.get(
        "/auth/test/manager-only",
        headers={"Authorization": f"Bearer {tampered_token}"},
    )
    assert resp_tampered.status_code == 401
    assert "Invalid or tampered token" in resp_tampered.json()["detail"]

    # C. Expired token
    expired_token = create_access_token(
        user_id=1,
        role="manager",
        name="Test Manager",
        expires_delta=datetime.timedelta(seconds=-60),  # expired 60 seconds ago
    )
    resp_expired = client.get(
        "/auth/test/manager-only",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert resp_expired.status_code == 401
    assert "Token has expired" in resp_expired.json()["detail"]
