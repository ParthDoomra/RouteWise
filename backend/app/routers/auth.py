"""Authentication Router for RouteWise.

Implements role-first authentication:
- POST /auth/manager/login: Queries ONLY the managers table.
- POST /auth/driver/login: Queries ONLY the driver_logins table with normalized phone input.
- GET /auth/me: Returns current authenticated user details from token.
- GET /auth/test/manager-only: Protected route requiring manager role.
- GET /auth/test/driver-only: Protected route requiring driver role.

Security Features:
- Generic HTTP 401 ("Invalid credentials") for all credential failures to prevent account enumeration.
- Brute-force protection: locks identifier for 15 minutes after 5 consecutive failures within 15 minutes.
- Strict isolation: Managers and Drivers exist in completely separate tables; credentials are never cross-checked.
- Passwords and PINs are bcrypt-hashed and never logged or returned.
"""

import re
from typing import Any, Dict

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.driver import Driver
from app.models.driver_login import DriverLogin
from app.models.manager import Manager
from app.services.auth_deps import (
    create_access_token,
    get_current_user,
    require_driver,
    require_manager,
)
from app.services.auth_rate_limiter import (
    check_rate_limit,
    record_login_failure,
    record_login_success,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

GENERIC_UNAUTHORIZED_DETAIL = "Invalid credentials"


def normalize_phone(raw_phone: str) -> str:
    """Normalize phone numbers by stripping whitespace, dashes, +91, and leading zero.

    Examples:
        '+91 98450 11223' -> '9845011223'
        '98450-11223'     -> '9845011223'
        '09845011223'     -> '9845011223'
    """
    if not raw_phone:
        return ""
    cleaned = re.sub(r"[\s\-\(\)\.]", "", str(raw_phone).strip())
    if cleaned.startswith("+91"):
        cleaned = cleaned[3:]
    elif cleaned.startswith("91") and len(cleaned) == 12:
        cleaned = cleaned[2:]
    elif cleaned.startswith("0") and len(cleaned) == 11:
        cleaned = cleaned[1:]
    return cleaned


# -----------------------------------------------------------------------------
# Request & Response Schemas
# -----------------------------------------------------------------------------

class ManagerLoginRequest(BaseModel):
    email: str
    password: str


class DriverLoginRequest(BaseModel):
    phone: str
    pin: str


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    display_name: str
    user_id: int


# -----------------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------------

@router.post("/manager/login", response_model=AuthTokenResponse)
def manager_login(
    req: ManagerLoginRequest,
    db: Session = Depends(get_db),
):
    """Authenticate a manager against the managers table ONLY."""
    clean_email = req.email.strip().lower()
    rate_limit_id = f"manager:{clean_email}"

    # 1. Check brute-force lockout before credential checking
    lockout_remaining = check_rate_limit(rate_limit_id)
    if lockout_remaining is not None:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed login attempts. Please try again in {lockout_remaining} seconds.",
            headers={"Retry-After": str(lockout_remaining)},
        )

    # 2. Query strictly the managers table
    manager = db.query(Manager).filter(Manager.email == clean_email).first()

    # 3. Constant-time / timing-resistant password check
    if not manager or not bcrypt.checkpw(req.password.encode("utf-8"), manager.password_hash.encode("utf-8")):
        record_login_failure(rate_limit_id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=GENERIC_UNAUTHORIZED_DETAIL,
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 4. Successful login: reset rate limit counter
    record_login_success(rate_limit_id)

    # 5. Issue JWT
    token = create_access_token(
        user_id=manager.id,
        role="manager",
        name=manager.name,
    )

    return AuthTokenResponse(
        access_token=token,
        token_type="bearer",
        role="manager",
        display_name=manager.name,
        user_id=manager.id,
    )


@router.post("/driver/login", response_model=AuthTokenResponse)
def driver_login(
    req: DriverLoginRequest,
    db: Session = Depends(get_db),
):
    """Authenticate a driver against the driver_logins table ONLY."""
    clean_phone = normalize_phone(req.phone)
    rate_limit_id = f"driver:{clean_phone}"

    # 1. Check brute-force lockout before credential checking
    lockout_remaining = check_rate_limit(rate_limit_id)
    if lockout_remaining is not None:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed login attempts. Please try again in {lockout_remaining} seconds.",
            headers={"Retry-After": str(lockout_remaining)},
        )

    # 2. Query strictly the driver_logins table with normalized phone comparison
    all_logins = db.query(DriverLogin).all()
    matched_login = None
    for dl in all_logins:
        if normalize_phone(dl.phone) == clean_phone:
            matched_login = dl
            break

    # 3. Validate PIN with bcrypt
    if not matched_login or not bcrypt.checkpw(req.pin.encode("utf-8"), matched_login.password_hash.encode("utf-8")):
        record_login_failure(rate_limit_id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=GENERIC_UNAUTHORIZED_DETAIL,
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 4. Successful login: reset rate limit counter
    record_login_success(rate_limit_id)

    # 5. Retrieve associated driver profile for display name
    driver = matched_login.driver or db.query(Driver).filter(Driver.id == matched_login.driver_id).first()
    driver_name = driver.name if driver else "Driver"

    token = create_access_token(
        user_id=matched_login.driver_id,
        role="driver",
        name=driver_name,
    )

    return AuthTokenResponse(
        access_token=token,
        token_type="bearer",
        role="driver",
        display_name=driver_name,
        user_id=matched_login.driver_id,
    )


@router.get("/me")
def get_me(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve profile of the currently authenticated manager or driver."""
    role = current_user["role"]
    user_id = current_user["user_id"]

    if role == "manager":
        manager = db.query(Manager).filter(Manager.id == user_id).first()
        if not manager:
            raise HTTPException(status_code=404, detail="User not found")
        return {
            "id": manager.id,
            "role": "manager",
            "name": manager.name,
            "email": manager.email,
        }

    elif role == "driver":
        driver = db.query(Driver).filter(Driver.id == user_id).first()
        if not driver:
            raise HTTPException(status_code=404, detail="User not found")
        return {
            "id": driver.id,
            "role": "driver",
            "name": driver.name,
            "phone": driver.phone,
            "vehicle_id": driver.vehicle_id,
        }

    return current_user


# -----------------------------------------------------------------------------
# Test Protected Routes (Requirement 4)
# -----------------------------------------------------------------------------

@router.get("/test/manager-only")
def test_manager_only(user: Dict[str, Any] = Depends(require_manager)):
    """Small test endpoint accessible only to managers."""
    return {
        "message": "Authorized manager access granted",
        "user_id": user["user_id"],
        "role": user["role"],
    }


@router.get("/test/driver-only")
def test_driver_only(user: Dict[str, Any] = Depends(require_driver)):
    """Small test endpoint accessible only to drivers."""
    return {
        "message": "Authorized driver access granted",
        "user_id": user["user_id"],
        "role": user["role"],
    }
