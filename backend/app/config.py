import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory for backend
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from backend/.env
ENV_FILE = BASE_DIR / ".env"
load_dotenv(dotenv_path=ENV_FILE)

DATABASE_URL: str = os.getenv("DATABASE_URL", "")
JWT_SECRET: str = os.getenv("JWT_SECRET", "routewise-secret-key")
ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
