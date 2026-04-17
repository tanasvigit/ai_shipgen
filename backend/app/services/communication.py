from datetime import datetime, timezone

from sqlalchemy.orm import Session

from .. import models
from ..core.config import settings


def log_notification(
    db: Session,
    trip_id: int | None,
    channel: str,
    event_type: str,
    status: str = "sent",
    attempts: int = 1,
) -> models.NotificationLog:
    log = models.NotificationLog(
        trip_id=trip_id,
        channel=channel,
        event_type=event_type,
        status=status,
        attempts=attempts,
        sent_at=datetime.now(timezone.utc),
    )
    db.add(log)
    return log


def _provider_ready(channel: str) -> bool:
    if settings.comm_provider == "sandbox":
        return True
    if channel == "whatsapp":
        return bool(settings.comm_whatsapp_api_key)
    if channel == "sms":
        return bool(settings.comm_sms_api_key)
    if channel == "push":
        return bool(settings.comm_push_api_key)
    return False


def send_notification(
    db: Session,
    *,
    trip_id: int | None,
    channel: str,
    event_type: str,
    message: str | None = None,
) -> models.NotificationLog:
    if settings.comm_provider == "sandbox":
        return log_notification(db, trip_id=trip_id, channel=channel, event_type=event_type, status="sandbox_sent")
    status = "sent" if _provider_ready(channel) else "pending_credentials"
    return log_notification(db, trip_id=trip_id, channel=channel, event_type=event_type, status=status)


def communication_readiness() -> dict:
    return {
        "provider": settings.comm_provider,
        "whatsappReady": _provider_ready("whatsapp"),
        "smsReady": _provider_ready("sms"),
        "pushReady": _provider_ready("push"),
    }
