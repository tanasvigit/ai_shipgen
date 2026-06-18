from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="SHIPGEN_",
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    jwt_secret: str = "shipgen-dev-secret"
    jwt_ttl_seconds: int = 28800
    default_admin_username: str = "admin"
    default_admin_password: str = "admin123"
    approval_mode: str = "manual"
    environment: str = "local"

    comm_provider: str = "sandbox"
    comm_whatsapp_api_key: str = Field(default="", validation_alias="SHIPGEN_WHATSAPP_API_KEY")
    comm_sms_api_key: str = Field(default="", validation_alias="SHIPGEN_SMS_API_KEY")
    comm_push_api_key: str = Field(default="", validation_alias="SHIPGEN_PUSH_API_KEY")

    route_provider: str = "sandbox"
    mapbox_api_key: str = ""

    nlp_provider: str = "sandbox"
    openai_api_key: str = ""
    openai_org: str = ""
    openai_model: str = "gpt-4o-mini"
    nlp_fallback_alert_threshold: float = 0.10
    nlp_fallback_min_samples: int = 10

    queue_backend: str = "redis"
    redis_url: str = "redis://localhost:6379/0"
    queue_name: str = "shipgen:jobs"
    dead_letter_queue_name: str = "shipgen:jobs:dlq"


settings = Settings()
