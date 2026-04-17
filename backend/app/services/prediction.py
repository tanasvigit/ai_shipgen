from datetime import datetime, timezone

from .. import models


def estimate_delay_and_eta(trip: models.Trip) -> tuple[float, str | None, float]:
    risk = 0.05
    if trip.status == "assigned":
        risk = 0.2
    elif trip.status == "in_transit":
        risk = 0.35
    if trip.last_updated:
        stale_seconds = (datetime.now(timezone.utc) - trip.last_updated).total_seconds()
        if stale_seconds > 20:
            risk = max(risk, 0.6)
    eta = trip.eta
    confidence = max(0.5, 1.0 - risk)
    return round(risk, 2), eta, round(confidence, 2)
