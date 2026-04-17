import re

from .. import schemas
from ..core.config import settings


def extract_order_from_text(raw_text: str) -> dict:
    text = raw_text.strip()
    pickup_match = re.search(r"from\s+([A-Za-z\s]+?)\s+to\s+", text, flags=re.IGNORECASE)
    drop_match = re.search(r"\sto\s+([A-Za-z\s]+?)(?:\s+tomorrow|\s+on|\s*$)", text, flags=re.IGNORECASE)
    load_match = re.search(r"(\d+(?:\.\d+)?)\s*(tons?|kg)", text, flags=re.IGNORECASE)
    date_match = re.search(r"(tomorrow|\d{4}-\d{2}-\d{2})", text, flags=re.IGNORECASE)

    pickup = pickup_match.group(1).strip() if pickup_match else "Unknown Pickup"
    drop = drop_match.group(1).strip() if drop_match else "Unknown Drop"
    load = load_match.group(0).strip() if load_match else "1000 kg"
    date = date_match.group(1).strip() if date_match else "2026-04-17"
    confidence = 0.55 if settings.nlp_provider == "sandbox" else 0.7
    if pickup_match and drop_match and load_match and date_match:
        confidence = 0.9 if settings.nlp_provider == "sandbox" else 0.95

    order_payload = schemas.OrderCreate(pickupLocation=pickup, dropLocation=drop, load=load, date=date)
    return {"order": order_payload, "confidence": confidence}


def nlp_readiness() -> dict:
    if settings.nlp_provider == "sandbox":
        return {"provider": settings.nlp_provider, "ready": True}
    return {"provider": settings.nlp_provider, "ready": bool(settings.openai_api_key)}
