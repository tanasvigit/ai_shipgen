from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models


def select_best_driver(db: Session) -> models.Driver | None:
    return db.scalar(
        select(models.Driver)
        .where(models.Driver.availability.is_(True))
        .order_by(models.Driver.location_score.asc(), models.Driver.rating.desc(), models.Driver.id.asc())
        .limit(1)
        .with_for_update()
    )


def select_best_vehicle(db: Session, required_capacity: float) -> models.Vehicle | None:
    return db.scalar(
        select(models.Vehicle)
        .where(models.Vehicle.available.is_(True), models.Vehicle.capacity_kg >= required_capacity)
        .order_by(models.Vehicle.capacity_kg.asc(), models.Vehicle.id.asc())
        .limit(1)
        .with_for_update()
    )


def parse_load_kg(load: str) -> float:
    digits = "".join(char for char in load if char.isdigit() or char == ".")
    if not digits:
        return 1000.0
    value = float(digits)
    if value < 1000:
        return value * 1000.0
    return value
