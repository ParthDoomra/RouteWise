"""RouteWise Backend Configuration Module.

Loads and validates environment variables from backend/.env.
Enforces strict security checks on critical secrets like JWT_SECRET.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory for backend
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from backend/.env
ENV_FILE = BASE_DIR / ".env"
load_dotenv(dotenv_path=ENV_FILE)

DATABASE_URL: str = os.getenv("DATABASE_URL", "")

# Insecure placeholder values that must never be permitted in production or active runs
PLACEHOLDER_SECRETS = {
    "",
    "your-secret-key-here",
    "your-secret-key",
    "changeme",
    "placeholder",
    "replace-me",
    "routewise-secret-key",
}


def get_validated_jwt_secret() -> str:
    """Read and strictly validate JWT_SECRET from the environment.

    Raises:
        ValueError: If JWT_SECRET is missing, empty, or set to an insecure placeholder.
    """
    secret = os.getenv("JWT_SECRET", "").strip()
    if not secret:
        raise ValueError(
            "JWT_SECRET is missing from environment. "
            "Please configure a strong, random secret key in backend/.env before starting."
        )
    if secret.lower() in PLACEHOLDER_SECRETS:
        raise ValueError(
            f"JWT_SECRET is set to an insecure placeholder ('{secret}'). "
            "Refusing to start. Please replace it with a strong secret key in backend/.env."
        )
    return secret


# Strictly validated JWT secret (never hardcoded)
JWT_SECRET: str = get_validated_jwt_secret()

# JWT Token Settings
JWT_ALGORITHM: str = "HS256"
JWT_EXPIRATION_HOURS: int = 8

ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")

# Configurable Depot coordinates (default: Bengaluru Majestic)
DEPOT_LAT: float = float(os.getenv("DEPOT_LAT", "12.9781"))
DEPOT_LNG: float = float(os.getenv("DEPOT_LNG", "77.5695"))

# Configurable average vehicle speed in km/h for ETA estimations
AVG_SPEED_KMPH: float = float(os.getenv("AVG_SPEED_KMPH", "25.0"))

# Vehicle Position Simulator Settings
SIM_TICK_SECONDS: int = int(os.getenv("SIM_TICK_SECONDS", "3"))
SIM_SPEED_MULTIPLIER: float = float(os.getenv("SIM_SPEED_MULTIPLIER", "20.0"))
SIM_AUTOSTART: bool = os.getenv("SIM_AUTOSTART", "false").lower() in ("true", "1", "yes")

# Vehicle Maintenance Service Interval (in km)
SERVICE_INTERVAL_KM: float = float(os.getenv("SERVICE_INTERVAL_KM", "5000.0"))



