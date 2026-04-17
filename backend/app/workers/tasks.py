from sqlalchemy.orm import Session

from .. import crud
from ..services import communication


def process_notification_job(db: Session, payload: dict) -> None:
    trip_id = payload.get("tripId")
    channel = payload.get("channel", "push")
    event_type = payload.get("eventType", "generic_event")
    communication.send_notification(db, trip_id=trip_id, channel=channel, event_type=event_type)
    crud.emit_event(
        db,
        event_type="worker_notification_processed",
        source="worker",
        trip_id=trip_id,
        payload={"channel": channel, "eventType": event_type},
    )
    db.commit()


def process_prediction_job(db: Session, payload: dict) -> None:
    trip_id = payload.get("tripId")
    if trip_id is None:
        return
    trip = crud.get_trip(db, trip_id)
    if trip is None:
        return
    risk, eta, confidence = crud.prediction.estimate_delay_and_eta(trip)
    trip.delay_risk = risk
    trip.eta = eta
    trip.eta_confidence = confidence
    crud.emit_event(
        db,
        event_type="worker_prediction_processed",
        source="worker",
        trip_id=trip.id,
        payload={"delayRisk": risk, "etaConfidence": confidence},
    )
    db.commit()
