"""In-Memory Login Rate Limiter & Brute-Force Protection.

Counts failed login attempts per identifier (normalized email or normalized phone).
After 5 failed attempts within 15 minutes, locks out the identifier for 15 minutes
and causes the API to return HTTP 429 with a retry-after time.

NOTE: In a production environment with multiple horizontally scaled workers
or distributed server instances, this in-memory dictionary must be replaced
by a shared distributed cache such as Redis or Memcached with atomic TTLs.
"""

import math
import time
from typing import Dict, List, Optional, Tuple

# Rate limit parameters
MAX_FAILED_ATTEMPTS: int = 5
WINDOW_SECONDS: int = 15 * 60       # 15 minutes
LOCKOUT_SECONDS: int = 15 * 60      # 15 minutes

# In-memory store: identifier -> dict containing 'failure_timestamps' and 'locked_until'
# Example: {"failure_timestamps": [float, ...], "locked_until": float}
_LOGIN_ATTEMPTS: Dict[str, Dict[str, object]] = {}


def check_rate_limit(identifier: str) -> Optional[int]:
    """Check if the given identifier is currently locked out.

    Args:
        identifier: Normalized email or normalized phone string.

    Returns:
        Remaining lockout duration in seconds if locked out, or None if request is allowed.
    """
    now = time.time()
    record = _LOGIN_ATTEMPTS.get(identifier)
    if not record:
        return None

    locked_until = float(record.get("locked_until", 0.0))
    if now < locked_until:
        remaining = int(math.ceil(locked_until - now))
        return max(1, remaining)

    # Clean up expired failure timestamps outside the rolling window
    timestamps = [t for t in record.get("failure_timestamps", []) if (now - t) <= WINDOW_SECONDS]
    record["failure_timestamps"] = timestamps

    # If the window still contains >= MAX_FAILED_ATTEMPTS, re-engage lockout
    if len(timestamps) >= MAX_FAILED_ATTEMPTS:
        record["locked_until"] = now + LOCKOUT_SECONDS
        return LOCKOUT_SECONDS

    return None


def record_login_failure(identifier: str) -> Tuple[int, Optional[int]]:
    """Record a failed login attempt for the given identifier.

    Args:
        identifier: Normalized email or normalized phone string.

    Returns:
        Tuple of (current_failure_count, lockout_remaining_seconds_if_locked).
    """
    now = time.time()
    if identifier not in _LOGIN_ATTEMPTS:
        _LOGIN_ATTEMPTS[identifier] = {
            "failure_timestamps": [],
            "locked_until": 0.0,
        }

    record = _LOGIN_ATTEMPTS[identifier]
    # Prune old timestamps
    timestamps = [t for t in record.get("failure_timestamps", []) if (now - t) <= WINDOW_SECONDS]
    timestamps.append(now)
    record["failure_timestamps"] = timestamps

    if len(timestamps) >= MAX_FAILED_ATTEMPTS:
        record["locked_until"] = now + LOCKOUT_SECONDS
        return len(timestamps), LOCKOUT_SECONDS

    return len(timestamps), None


def record_login_success(identifier: str) -> None:
    """Reset the failure counter upon successful login.

    Args:
        identifier: Normalized email or normalized phone string.
    """
    _LOGIN_ATTEMPTS.pop(identifier, None)


def reset_rate_limiter() -> None:
    """Clear all rate limit tracking records (primarily for test isolation)."""
    _LOGIN_ATTEMPTS.clear()
