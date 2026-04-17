import json
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models


def export_learning_dataset(db: Session, output_dir: str = "artifacts", run_label: str | None = None) -> str:
    target_dir = Path(output_dir)
    target_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    suffix = run_label.strip().replace(" ", "_") if run_label else timestamp
    output_path = target_dir / f"shipgen_learning_dataset_{suffix}.json"

    trips = db.scalars(select(models.Trip)).all()
    alerts = db.scalars(select(models.Alert)).all()
    audits = db.scalars(select(models.TripAuditLog)).all()
    events = db.scalars(select(models.Event)).all()

    payload = {
        "exportedAt": datetime.now(timezone.utc).isoformat(),
        "tripCount": len(trips),
        "alertCount": len(alerts),
        "auditCount": len(audits),
        "eventCount": len(events),
        "trips": [
            {
                "id": trip.id,
                "status": trip.status,
                "driverId": trip.driver_id,
                "vehicleId": trip.vehicle_id,
                "delayRisk": trip.delay_risk,
                "etaConfidence": trip.eta_confidence,
                "profit": trip.profit,
            }
            for trip in trips
        ],
    }

    output_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return str(output_path)
