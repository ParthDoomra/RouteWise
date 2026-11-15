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
