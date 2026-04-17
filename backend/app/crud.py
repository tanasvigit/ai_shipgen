from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from . import models, schemas

TRIP_TRANSITIONS = {
    "created": {"assigned"},
    "assigned": {"in_transit"},
    "in_transit": {"completed"},
    "completed": set(),
}


def serialize_order(order: models.Order) -> dict:
    return {
        "id": order.id,
        "pickupLocation": order.pickup_location,
        "dropLocation": order.drop_location,
        "load": order.load,
        "date": order.date,
    }


def serialize_driver(driver: models.Driver) -> dict:
    return {
        "id": driver.id,
        "name": driver.name,
        "currentLocation": driver.current_location,
        "availability": driver.availability,
    }


def serialize_trip(trip: models.Trip) -> dict:
    return {
        "id": trip.id,
        "orderId": trip.order_id,
        "driverId": trip.driver_id,
        "status": trip.status,
        "currentLat": trip.current_lat,
        "currentLng": trip.current_lng,
        "lastUpdated": trip.last_updated.isoformat() if trip.last_updated else None,
        "inTransitStartedAt": trip.in_transit_started_at.isoformat() if trip.in_transit_started_at else None,
        "order": serialize_order(trip.order) if trip.order else None,
        "driver": serialize_driver(trip.driver) if trip.driver else None,
    }


def create_order(db: Session, payload: schemas.OrderCreate) -> models.Order:
    order = models.Order(
        pickup_location=payload.pickupLocation,
        drop_location=payload.dropLocation,
        load=payload.load,
        date=payload.date,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def create_order_with_auto_trip_assignment(db: Session, payload: schemas.OrderCreate) -> tuple[models.Order, models.Trip]:
    order = models.Order(
        pickup_location=payload.pickupLocation,
        drop_location=payload.dropLocation,
        load=payload.load,
        date=payload.date,
    )
    trip = models.Trip(status="created", current_lat=0.0, current_lng=0.0, last_updated=datetime.now(timezone.utc))
    order.trips.append(trip)

    nearest_driver = db.scalar(
        select(models.Driver)
        .where(models.Driver.availability.is_(True))
        .order_by(models.Driver.location_score.asc(), models.Driver.id.asc())
        .limit(1)
        .with_for_update()
    )
    if nearest_driver is not None:
        nearest_driver.availability = False
        trip.driver_id = nearest_driver.id
        trip.status = "assigned"

    db.add(order)
    db.commit()
    db.refresh(order)
    db.refresh(trip)
    return order, trip


def list_orders(db: Session) -> list[models.Order]:
    return db.scalars(select(models.Order).order_by(models.Order.id.desc())).all()


def list_drivers(db: Session) -> list[models.Driver]:
    return db.scalars(select(models.Driver).order_by(models.Driver.id.asc())).all()


def get_order(db: Session, order_id: int) -> models.Order | None:
    return db.get(models.Order, order_id)


def auto_create_trip(db: Session, order_id: int) -> models.Trip:
    trip = models.Trip(order_id=order_id, status="created", current_lat=0.0, current_lng=0.0)
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


def get_trip(db: Session, trip_id: int) -> models.Trip | None:
    return db.scalar(
        select(models.Trip)
        .options(joinedload(models.Trip.order), joinedload(models.Trip.driver))
        .where(models.Trip.id == trip_id)
    )


def assign_nearest_driver(db: Session, trip: models.Trip) -> models.Trip:
    nearest_driver = db.scalar(
        select(models.Driver)
        .where(models.Driver.availability.is_(True))
        .order_by(models.Driver.location_score.asc(), models.Driver.id.asc())
        .limit(1)
    )
    if nearest_driver is None:
        return trip

    nearest_driver.availability = False
    trip.driver_id = nearest_driver.id
    trip.status = "assigned"
    db.commit()
    db.refresh(trip)
    return trip


def list_trips(db: Session) -> list[models.Trip]:
    stmt = (
        select(models.Trip)
        .options(joinedload(models.Trip.order), joinedload(models.Trip.driver))
        .order_by(models.Trip.id.desc())
    )
    return db.scalars(stmt).unique().all()


def approve_trip(db: Session, trip: models.Trip) -> models.Trip:
    if not can_transition(trip.status, "in_transit"):
        raise ValueError(f"Cannot approve trip in '{trip.status}' state")
    trip.status = "in_transit"
    if trip.in_transit_started_at is None:
        trip.in_transit_started_at = datetime.now(timezone.utc)
    trip.last_updated = datetime.now(timezone.utc)
    db.commit()
    db.refresh(trip)
    return trip


def complete_trip(db: Session, trip: models.Trip) -> models.Trip:
    if not can_transition(trip.status, "completed"):
        raise ValueError(f"Cannot complete trip in '{trip.status}' state")
    trip.status = "completed"
    trip.last_updated = datetime.now(timezone.utc)
    if trip.driver_id is not None:
        driver = db.get(models.Driver, trip.driver_id)
        if driver is not None:
            driver.availability = True
    db.commit()
    db.refresh(trip)
    return trip


def update_trip_location(db: Session, trip: models.Trip, lat: float, lng: float) -> models.Trip:
    trip.current_lat = lat
    trip.current_lng = lng
    trip.last_updated = datetime.now(timezone.utc)
    db.commit()
    db.refresh(trip)
    return trip


def serialize_alert(alert: models.Alert) -> dict:
    return {
        "id": alert.id,
        "tripId": alert.trip_id,
        "type": alert.type,
        "message": alert.message,
        "resolved": alert.resolved,
        "createdAt": alert.created_at.isoformat() if alert.created_at else None,
    }


def list_alerts(db: Session) -> list[models.Alert]:
    return db.scalars(select(models.Alert).order_by(models.Alert.id.desc())).all()


def get_alert(db: Session, alert_id: int) -> models.Alert | None:
    return db.get(models.Alert, alert_id)


def resolve_alert(db: Session, alert: models.Alert) -> models.Alert:
    alert.resolved = True
    db.commit()
    db.refresh(alert)
    return alert


def _has_unresolved_alert(db: Session, trip_id: int, alert_type: str) -> bool:
    existing = db.scalar(
        select(models.Alert.id)
        .where(
            models.Alert.trip_id == trip_id,
            models.Alert.type == alert_type,
            models.Alert.resolved.is_(False),
        )
        .limit(1)
    )
    return existing is not None


def _has_recent_alert(db: Session, trip_id: int, alert_type: str, now: datetime, cooldown_seconds: int = 60) -> bool:
    cutoff = now - timedelta(seconds=cooldown_seconds)
    existing = db.scalar(
        select(models.Alert.id)
        .where(
            models.Alert.trip_id == trip_id,
            models.Alert.type == alert_type,
            models.Alert.created_at >= cutoff,
        )
        .limit(1)
    )
    return existing is not None


def _create_alert_if_missing(db: Session, trip_id: int, alert_type: str, message: str, now: datetime) -> None:
    if _has_unresolved_alert(db, trip_id, alert_type):
        return
    if _has_recent_alert(db, trip_id, alert_type, now):
        return
    db.add(models.Alert(trip_id=trip_id, type=alert_type, message=message, resolved=False))


def simulate_in_transit_updates(db: Session) -> None:
    now = datetime.now(timezone.utc)
    active_trips = db.scalars(select(models.Trip).where(models.Trip.status != "completed")).all()

    for trip in active_trips:
        last_updated = trip.last_updated or trip.created_at or now
        if (now - last_updated) > timedelta(seconds=20):
            _create_alert_if_missing(db, trip.id, "inactive", "Driver inactive", now)

        in_transit_since = trip.in_transit_started_at
        if trip.status == "in_transit" and in_transit_since and (now - in_transit_since) > timedelta(minutes=2):
            _create_alert_if_missing(db, trip.id, "delay", "Possible delay detected", now)

        if trip.status == "in_transit":
            trip.current_lat = float(trip.current_lat) + 0.001
            trip.current_lng = float(trip.current_lng) + 0.001
            trip.last_updated = now

    if active_trips:
        db.commit()


def seed_drivers(db: Session) -> None:
    has_driver = db.scalar(select(models.Driver.id).limit(1))
    if has_driver:
        return

    starters = [
        models.Driver(name="Marcus Chen", current_location="Chicago", location_score=1.2, availability=True),
        models.Driver(name="Asha Reddy", current_location="Springfield", location_score=3.4, availability=True),
        models.Driver(name="Luis Gomez", current_location="Atlanta", location_score=5.6, availability=True),
    ]
    db.add_all(starters)
    db.commit()


def can_transition(current_status: str, next_status: str) -> bool:
    return next_status in TRIP_TRANSITIONS.get(current_status, set())
