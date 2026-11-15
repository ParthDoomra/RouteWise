"""Authentication & Role-Based Access Dependencies.

Handles:
- JWT token generation (with 8-hour expiration, user_id, role, and display name claims).
- Token decoding and cryptographic signature verification.
- Role enforcement dependencies (require_manager, require_driver).
  * Missing, expired, or tampered tokens -> 401 Unauthorized
  * Mismatched roles (e.g. driver token accessing manager route) -> 403 Forbidden
"""

import datetime
from typing import Any, Dict, Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import JWT_ALGORITHM, JWT_EXPIRATION_HOURS, JWT_SECRET

# HTTPBearer scheme that does not auto-raise so we control the exact 401 messages
security = HTTPBearer(auto_error=False)


def create_access_token(
    user_id: int,
    role: str,
    name: str,
    expires_delta: Optional[datetime.timedelta] = None,
) -> str:
    """Generate a signed JWT access token.

    Args:
        user_id: Unique identifier of the user (Manager.id or Driver.id).
        role: "manager" or "driver".
        name: User display name.
        expires_delta: Optional custom token expiration duration.

    Returns:
        Encoded JWT token string.
    """
    now = datetime.datetime.now(datetime.timezone.utc)
    expire = now + (expires_delta or datetime.timedelta(hours=JWT_EXPIRATION_HOURS))

    payload = {
        "sub": str(user_id),
        "user_id": user_id,
        "role": role,
        "name": name,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Dict[str, Any]:
    """Extract and validate the JWT token from the Authorization header.

    Raises:
        HTTPException(401): If token is missing, expired, or cryptographically invalid.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        role = payload.get("role")
        name = payload.get("name", "")

        if user_id is None or role is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return {
            "user_id": int(user_id),
            "role": str(role),
            "name": str(name),
        }

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or tampered token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def require_manager(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    """Enforce manager role authorization.

    Raises:
        HTTPException(403): If the user does not have the 'manager' role.
    """
    if current_user.get("role") != "manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Manager role required",
        )
    return current_user


def require_driver(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    """Enforce driver role authorization.

    Raises:
        HTTPException(403): If the user does not have the 'driver' role.
    """
    if current_user.get("role") != "driver":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Driver role required",
        )
    return current_user
