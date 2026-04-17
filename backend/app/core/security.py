import base64
import hashlib
import hmac
import json
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from .config import settings

auth_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def verify_password(raw_password: str, password_hash: str) -> bool:
    return hash_password(raw_password) == password_hash


def _sign_payload(payload_json: str) -> str:
    signature = hmac.new(settings.jwt_secret.encode("utf-8"), payload_json.encode("utf-8"), hashlib.sha256).digest()
    return base64.urlsafe_b64encode(signature).decode("utf-8")


def create_access_token(user: models.User) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=settings.jwt_ttl_seconds)
    payload = {"sub": user.username, "role": user.role, "exp": int(expires_at.timestamp())}
    payload_json = json.dumps(payload, separators=(",", ":"))
    encoded_payload = base64.urlsafe_b64encode(payload_json.encode("utf-8")).decode("utf-8")
    signature = _sign_payload(payload_json)
    return f"{encoded_payload}.{signature}"


def decode_access_token(token: str) -> dict:
    try:
        encoded_payload, signature = token.split(".", maxsplit=1)
        payload_json = base64.urlsafe_b64decode(encoded_payload.encode("utf-8")).decode("utf-8")
        expected_signature = _sign_payload(payload_json)
        if not hmac.compare_digest(signature, expected_signature):
            raise ValueError("bad-signature")
        payload = json.loads(payload_json)
        if int(payload["exp"]) < int(datetime.now(timezone.utc).timestamp()):
            raise ValueError("expired")
        return payload
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token") from exc


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(auth_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    payload = decode_access_token(credentials.credentials)
    user = db.scalar(select(models.User).where(models.User.username == payload["sub"]))
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_role(*allowed_roles: str):
    def _role_dependency(current_user: models.User = Depends(get_current_user)) -> models.User:
        if current_user.role not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
        return current_user

    return _role_dependency


def create_public_tracking_token(trip_id: int) -> str:
    payload = {"tripId": trip_id, "exp": int((datetime.now(timezone.utc) + timedelta(days=14)).timestamp())}
    payload_json = json.dumps(payload, separators=(",", ":"))
    encoded_payload = base64.urlsafe_b64encode(payload_json.encode("utf-8")).decode("utf-8")
    signature = _sign_payload(payload_json)
    return f"{encoded_payload}.{signature}"


def decode_public_tracking_token(token: str) -> int:
    payload = decode_access_token(token)
    trip_id = payload.get("tripId")
    if not isinstance(trip_id, int):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid tracking token")
    return trip_id
