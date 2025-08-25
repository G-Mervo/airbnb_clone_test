try:
    from pydantic_settings import BaseSettings
    PYDANTIC_SETTINGS_AVAILABLE = True
except ImportError:
    try:
        from pydantic import BaseSettings
        PYDANTIC_SETTINGS_AVAILABLE = True
    except ImportError:
        PYDANTIC_SETTINGS_AVAILABLE = False

from typing import Optional, List, Dict, Any
import os
import json
import logging
from pathlib import Path

try:
    from dotenv import load_dotenv
    DOTENV_AVAILABLE = True
except ImportError:
    DOTENV_AVAILABLE = False


# Dynamically load .env or .env.production based on ENVIRONMENT
def get_env_file():
    base_dir = Path(__file__).parent.parent.parent
    env_file = base_dir / ".env"
    # Try to read ENVIRONMENT from .env first (fallback to development)
    environment = "development"
    if env_file.exists():
        with open(env_file) as f:
            for line in f:
                if line.strip().startswith("ENVIRONMENT="):
                    environment = line.strip().split("=", 1)[1].strip()
                    break
    # If ENVIRONMENT is set in the OS, override
    environment = os.getenv("ENVIRONMENT", environment)
    if environment == "production":
        prod_env = base_dir / ".env.production"
        if prod_env.exists():
            return prod_env

    print(f"Using environment file: {env_file}")
    return env_file


if DOTENV_AVAILABLE:
    load_dotenv(dotenv_path=get_env_file())


class Settings(BaseSettings):
    # Pydantic v2 field validator for allowed_origins
    from pydantic import field_validator

    @field_validator('cors_origins', mode='before')
    @classmethod
    def parse_cors_origins(cls, v):
        if v == "" or v is None:
            return None
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return [i.strip() for i in v.split(",") if i.strip()]
        return v

    @field_validator('allowed_origins', mode='before')
    @classmethod
    def parse_allowed_origins(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return [i.strip() for i in v.split(",") if i.strip()]
        return v

    # App settings
    app_name: str = "Airbnb Clone API"
    app_version: str = "1.0.0"
    debug: bool = True
    environment: str = "development"  # development, testing, production
    log_level: str = "INFO"  # DEBUG, INFO, WARNING, ERROR, CRITICAL

    # Server settings
    host: str = "0.0.0.0"
    port: int = 8000

    # CORS settings
    allowed_origins: List[str] = [
        "https://airbnb-frontend-omega.vercel.app",
        "http://localhost:5173",
    ]
    cors_origins: Optional[List[str]] = None  # Alternative environment variable name

    # Security
    secret_key: str = "your-super-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # Data settings
    mock_data_path: str = "src/data"

    # File upload
    upload_dir: str = "uploads"
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    allowed_image_types: List[str] = ["image/jpeg", "image/png", "image/webp"]

    # Rate limiting
    rate_limit_per_minute: int = 60
    rate_limit_burst: int = 100

    # Logging setup
    def setup_logging(self):
        """Setup logging configuration"""
        logging.basicConfig(
            level=getattr(logging, self.log_level),
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        )

    class Config:
        env_file = str(get_env_file())
        case_sensitive = False
        extra = "ignore"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        self.allowed_origins = self.cors_origins

        # Setup logging
        self.setup_logging()


settings = Settings()
