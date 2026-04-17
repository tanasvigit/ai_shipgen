import os


class Settings:
    jwt_secret: str = os.getenv("SHIPGEN_JWT_SECRET", "shipgen-dev-secret")
    jwt_ttl_seconds: int = int(os.getenv("SHIPGEN_JWT_TTL_SECONDS", "28800"))
    default_admin_username: str = os.getenv("SHIPGEN_ADMIN_USERNAME", "admin")
    default_admin_password: str = os.getenv("SHIPGEN_ADMIN_PASSWORD", "admin123")
    approval_mode: str = os.getenv("SHIPGEN_APPROVAL_MODE", "manual")
    environment: str = os.getenv("SHIPGEN_ENV", "local")

    comm_provider: str = os.getenv("SHIPGEN_COMM_PROVIDER", "sandbox")
    comm_whatsapp_api_key: str = os.getenv("SHIPGEN_WHATSAPP_API_KEY", "")
    comm_sms_api_key: str = os.getenv("SHIPGEN_SMS_API_KEY", "")
    comm_push_api_key: str = os.getenv("SHIPGEN_PUSH_API_KEY", "")

    route_provider: str = os.getenv("SHIPGEN_ROUTE_PROVIDER", "sandbox")
    mapbox_api_key: str = os.getenv("SHIPGEN_MAPBOX_API_KEY", "")

    nlp_provider: str = os.getenv("SHIPGEN_NLP_PROVIDER", "sandbox")
    openai_api_key: str = os.getenv("SHIPGEN_OPENAI_API_KEY", "")

    queue_backend: str = os.getenv("SHIPGEN_QUEUE_BACKEND", "redis")
    redis_url: str = os.getenv("SHIPGEN_REDIS_URL", "redis://localhost:6379/0")
    queue_name: str = os.getenv("SHIPGEN_QUEUE_NAME", "shipgen:jobs")
    dead_letter_queue_name: str = os.getenv("SHIPGEN_DEAD_LETTER_QUEUE_NAME", "shipgen:jobs:dlq")


settings = Settings()
