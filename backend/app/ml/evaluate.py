from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models


def run_offline_evaluation(db: Session) -> dict:
    trips = db.scalars(select(models.Trip)).all()
    if not trips:
        return {"tripCount": 0, "avgDelayRisk": 0.0, "avgEtaConfidence": 0.0, "avgProfit": 0.0}

    trip_count = len(trips)
    avg_delay_risk = round(sum(trip.delay_risk for trip in trips) / trip_count, 4)
    avg_eta_confidence = round(sum(trip.eta_confidence for trip in trips) / trip_count, 4)
    avg_profit = round(sum(trip.profit for trip in trips) / trip_count, 2)
    return {
        "tripCount": trip_count,
        "avgDelayRisk": avg_delay_risk,
        "avgEtaConfidence": avg_eta_confidence,
        "avgProfit": avg_profit,
    }
