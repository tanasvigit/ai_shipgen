import json
import logging
import re
from datetime import date, timedelta

import httpx

from .. import schemas
from ..core.config import settings

logger = logging.getLogger(__name__)
_FALLBACK_TOTAL_REQUESTS = 0
_FALLBACK_USED_REQUESTS = 0
_LAST_FALLBACK_ALERT_AT_TOTAL = 0


def _normalize_date(date_raw: str | None) -> str:
    if not date_raw:
        return "2026-04-17"
    candidate = date_raw.strip().lower()
    if candidate == "tomorrow":
        return (date.today() + timedelta(days=1)).isoformat()
    if re.match(r"^\d{4}-\d{2}-\d{2}$", candidate):
        return candidate
    return "2026-04-17"


def _regex_extract(raw_text: str, confidence_base: float) -> dict:
    text = raw_text.strip()
    pickup_match = re.search(r"from\s+([A-Za-z\s]+?)\s+to\s+", text, flags=re.IGNORECASE)
    drop_match = re.search(r"\sto\s+([A-Za-z\s]+?)(?:\s+tomorrow|\s+on|\s*$)", text, flags=re.IGNORECASE)
    load_match = re.search(r"(\d+(?:\.\d+)?)\s*(tons?|kg)", text, flags=re.IGNORECASE)
    date_match = re.search(r"(tomorrow|\d{4}-\d{2}-\d{2})", text, flags=re.IGNORECASE)

    pickup = pickup_match.group(1).strip() if pickup_match else "Unknown Pickup"
    drop = drop_match.group(1).strip() if drop_match else "Unknown Drop"
    load = load_match.group(0).strip() if load_match else "1000 kg"
    date_value = _normalize_date(date_match.group(1) if date_match else None)
    confidence = confidence_base
    if pickup_match and drop_match and load_match and date_match:
        confidence = min(0.95, confidence_base + 0.25)

    order_payload = schemas.OrderCreate(pickupLocation=pickup, dropLocation=drop, load=load, date=date_value)
    return {"order": order_payload, "confidence": confidence}


def _extract_with_openai(raw_text: str) -> dict:
    headers = {
        "Authorization": f"Bearer {settings.openai_api_key}",
        "Content-Type": "application/json",
    }
    if settings.openai_org:
        headers["OpenAI-Organization"] = settings.openai_org

    prompt = (
        "Extract shipment order fields from user text and return strict JSON with keys: "
        "pickupLocation, dropLocation, load, date, confidence. "
        "Date must be YYYY-MM-DD or 'tomorrow'. "
        "Confidence must be between 0 and 1."
    )
    response = httpx.post(
        "https://api.openai.com/v1/chat/completions",
        headers=headers,
        json={
            "model": settings.openai_model,
            "temperature": 0.1,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": prompt},
                {"role": "user", "content": raw_text.strip()},
            ],
        },
        timeout=20.0,
    )
    response.raise_for_status()
    payload = response.json()
    content = payload["choices"][0]["message"]["content"]
    extracted = json.loads(content)

    order_payload = schemas.OrderCreate(
        pickupLocation=str(extracted.get("pickupLocation") or "Unknown Pickup").strip(),
        dropLocation=str(extracted.get("dropLocation") or "Unknown Drop").strip(),
        load=str(extracted.get("load") or "1000 kg").strip(),
        date=_normalize_date(str(extracted.get("date") if extracted.get("date") is not None else "")),
    )
    confidence = float(extracted.get("confidence", 0.85))
    confidence = max(0.0, min(confidence, 1.0))
    return {"order": order_payload, "confidence": confidence}


def _classify_openai_error(exc: Exception) -> str:
    if isinstance(exc, httpx.HTTPStatusError):
        status = exc.response.status_code
        if status == 401:
            return "openai_401_unauthorized"
        if status == 429:
            return "openai_429_rate_limited_or_quota"
        if status == 403:
            return "openai_403_forbidden"
        if status >= 500:
            return f"openai_{status}_server_error"
        return f"openai_{status}_http_error"
    if isinstance(exc, httpx.TimeoutException):
        return "openai_timeout"
    if isinstance(exc, httpx.RequestError):
        return "openai_network_error"
    if isinstance(exc, (ValueError, KeyError, json.JSONDecodeError)):
        return "openai_response_parse_error"
    return "openai_unknown_error"


def _record_fallback_usage(engine_used: str, error_reason: str | None) -> None:
    global _FALLBACK_TOTAL_REQUESTS, _FALLBACK_USED_REQUESTS, _LAST_FALLBACK_ALERT_AT_TOTAL
    _FALLBACK_TOTAL_REQUESTS += 1
    if engine_used == "regex":
        _FALLBACK_USED_REQUESTS += 1
    if _FALLBACK_TOTAL_REQUESTS < settings.nlp_fallback_min_samples:
        return

    fallback_rate = _FALLBACK_USED_REQUESTS / _FALLBACK_TOTAL_REQUESTS
    if fallback_rate > settings.nlp_fallback_alert_threshold and _FALLBACK_TOTAL_REQUESTS != _LAST_FALLBACK_ALERT_AT_TOTAL:
        _LAST_FALLBACK_ALERT_AT_TOTAL = _FALLBACK_TOTAL_REQUESTS
        logger.warning(
            "NLP fallback rate threshold exceeded fallback_rate=%.3f threshold=%.3f total=%s fallback=%s last_error_reason=%s",
            fallback_rate,
            settings.nlp_fallback_alert_threshold,
            _FALLBACK_TOTAL_REQUESTS,
            _FALLBACK_USED_REQUESTS,
            error_reason,
        )


def validate_nlp_runtime_config() -> dict:
    is_openai = settings.nlp_provider == "openai"
    status = {
        "provider": settings.nlp_provider,
        "openaiKeyConfigured": bool(settings.openai_api_key),
        "openaiModel": settings.openai_model,
        "fallbackAlertThreshold": settings.nlp_fallback_alert_threshold,
    }
    if settings.nlp_provider not in {"sandbox", "openai"}:
        logger.warning("NLP runtime config provider=%s is not supported.", settings.nlp_provider)
        return status

    if is_openai and not settings.openai_api_key:
        logger.warning("NLP runtime config provider=openai but SHIPGEN_OPENAI_API_KEY is missing. Regex fallback will be used.")
    elif is_openai and not settings.openai_model:
        logger.warning("NLP runtime config provider=openai but SHIPGEN_OPENAI_MODEL is missing. Regex fallback will be used.")
    else:
        logger.info(
            "NLP runtime config loaded provider=%s model=%s key_configured=%s",
            settings.nlp_provider,
            settings.openai_model,
            bool(settings.openai_api_key),
        )
    return status


def extract_order_from_text(raw_text: str) -> dict:
    if settings.nlp_provider == "sandbox":
        extracted = _regex_extract(raw_text, confidence_base=0.55)
        extracted["nlpEngineUsed"] = "regex"
        extracted["nlpErrorReason"] = None
        logger.info("nlp_extract engine_used=regex reason=sandbox_provider")
        _record_fallback_usage(engine_used="regex", error_reason="sandbox_provider")
        return extracted

    if settings.nlp_provider == "openai" and settings.openai_api_key:
        try:
            extracted = _extract_with_openai(raw_text)
            extracted["nlpEngineUsed"] = "openai"
            extracted["nlpErrorReason"] = None
            logger.info("nlp_extract engine_used=openai reason=none")
            _record_fallback_usage(engine_used="openai", error_reason=None)
            return extracted
        except Exception as exc:  # noqa: BLE001
            # Fallback keeps ingestion alive even when external NLP is unavailable.
            reason = _classify_openai_error(exc)
            logger.warning("nlp_extract engine_used=regex reason=%s", reason)
            extracted = _regex_extract(raw_text, confidence_base=0.7)
            extracted["nlpEngineUsed"] = "regex"
            extracted["nlpErrorReason"] = reason
            _record_fallback_usage(engine_used="regex", error_reason=reason)
            return extracted

    extracted = _regex_extract(raw_text, confidence_base=0.7)
    extracted["nlpEngineUsed"] = "regex"
    extracted["nlpErrorReason"] = "provider_or_key_not_configured"
    logger.info("nlp_extract engine_used=regex reason=provider_or_key_not_configured")
    _record_fallback_usage(engine_used="regex", error_reason="provider_or_key_not_configured")
    return extracted


def nlp_readiness() -> dict:
    if settings.nlp_provider == "sandbox":
        return {"provider": settings.nlp_provider, "ready": True}
    if settings.nlp_provider == "openai":
        return {"provider": settings.nlp_provider, "ready": bool(settings.openai_api_key), "model": settings.openai_model}
    return {"provider": settings.nlp_provider, "ready": False}
