from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from . import models, schemas
from .core.config import settings
from .core.security import create_public_tracking_token
from .core.security import hash_password
from .services import assignment, communication, finance, prediction, routing
from .workers.queue import enqueue_job_sync

TRIP_TRANSITIONS = {
    "created": {"assigned", "rejected"},
    "assigned": {"in_transit", "rejected"},
    "in_transit": {"completed"},
    "rejected": set(),
    "completed": set(),
}


def ensure_default_user(db: Session) -> None:
    has_user = db.scalar(select(models.User.id).limit(1))
    if has_user:
        return
    db.add(models.User(username="admin", password_hash=hash_password("admin123"), role="admin", is_active=True))
    db.commit()


def get_user_by_username(db: Session, username: str) -> models.User | None:
    return db.scalar(select(models.User).where(models.User.username == username))


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
        "rating": driver.rating,
    }


def serialize_vehicle(vehicle: models.Vehicle) -> dict:
    return {
        "id": vehicle.id,
        "name": vehicle.name,
        "type": vehicle.type,
        "capacityKg": vehicle.capacity_kg,
        "available": vehicle.available,
    }


def serialize_trip(trip: models.Trip) -> dict:
    finance_view = {
        "fuelCost": trip.fuel_cost,
        "driverCost": trip.driver_cost,
        "tollCost": trip.toll_cost,
        "miscCost": trip.misc_cost,
        "revenue": trip.revenue,
        "profit": trip.profit,
    }
    return {
        "id": trip.id,
        "orderId": trip.order_id,
        "driverId": trip.driver_id,
        "vehicleId": trip.vehicle_id,
        "status": trip.status,
        "currentLat": trip.current_lat,
        "currentLng": trip.current_lng,
        "primaryRoute": trip.primary_route,
        "alternateRoutes": trip.alternate_routes or [],
        "eta": trip.eta,
        "delayRisk": trip.delay_risk,
        "etaConfidence": trip.eta_confidence,
        "publicTrackingToken": create_public_tracking_token(trip.id),
        "pickupReachedAt": trip.pickup_reached_at.isoformat() if trip.pickup_reached_at else None,
        "lastUpdated": trip.last_updated.isoformat() if trip.last_updated else None,
        "inTransitStartedAt": trip.in_transit_started_at.isoformat() if trip.in_transit_started_at else None,
        "order": serialize_order(trip.order) if trip.order else None,
        "driver": serialize_driver(trip.driver) if trip.driver else None,
        "vehicle": serialize_vehicle(trip.vehicle) if trip.vehicle else None,
        "finance": finance_view,
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

    load_kg = assignment.parse_load_kg(payload.load)
    best_driver = assignment.select_best_driver(db)
    best_vehicle = assignment.select_best_vehicle(db, load_kg)
    if best_driver is not None:
        best_driver.availability = False
        trip.driver_id = best_driver.id
        trip.status = "assigned"
    if best_vehicle is not None:
        best_vehicle.available = False
        trip.vehicle_id = best_vehicle.id

    primary_route, alternate_routes, eta = routing.build_route_plan(payload.pickupLocation, payload.dropLocation)
    trip.primary_route = primary_route
    trip.alternate_routes = alternate_routes
    trip.eta = eta
    finance_snapshot = finance.calculate_trip_finance(trip)
    trip.fuel_cost = finance_snapshot["fuelCost"]
    trip.driver_cost = finance_snapshot["driverCost"]
    trip.toll_cost = finance_snapshot["tollCost"]
    trip.misc_cost = finance_snapshot["miscCost"]
    trip.revenue = finance_snapshot["revenue"]
    trip.profit = finance_snapshot["profit"]

    auto_approved = settings.approval_mode == "rule_auto" and trip.status == "assigned"
    if auto_approved:
        trip.status = "in_transit"
        trip.in_transit_started_at = datetime.now(timezone.utc)
        trip.last_updated = datetime.now(timezone.utc)

    db.add(order)
    db.commit()
    db.refresh(order)
    db.refresh(trip)
    emit_event(
        db,
        event_type="order_created",
        source="system",
        trip_id=trip.id,
        payload={"orderId": order.id, "pickup": order.pickup_location, "drop": order.drop_location},
    )
    emit_event(
        db,
        event_type="trip_assigned",
        source="system",
        trip_id=trip.id,
        payload={"driverId": trip.driver_id, "vehicleId": trip.vehicle_id, "status": trip.status},
    )
    emit_event(
        db,
        event_type="route_generated",
        source="system",
        trip_id=trip.id,
        payload={"primaryRoute": trip.primary_route, "alternateCount": len(trip.alternate_routes or [])},
    )
    if auto_approved:
        log_trip_audit(db, trip, action="auto_approved", actor="system", details={"mode": settings.approval_mode})
        communication.send_notification(db, trip_id=trip.id, channel="whatsapp", event_type="trip_auto_started")
    else:
        log_trip_audit(db, trip, action="created", actor="system", details={"mode": settings.approval_mode})
    enqueue_job_sync("prediction", {"tripId": trip.id, "idempotencyKey": f"prediction-create-{trip.id}-{order.id}"})
    db.commit()
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
        .options(joinedload(models.Trip.order), joinedload(models.Trip.driver), joinedload(models.Trip.vehicle))
        .where(models.Trip.id == trip_id)
    )


def assign_nearest_driver(db: Session, trip: models.Trip) -> models.Trip:
    nearest_driver = assignment.select_best_driver(db)
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
        .options(joinedload(models.Trip.order), joinedload(models.Trip.driver), joinedload(models.Trip.vehicle))
        .order_by(models.Trip.id.desc())
    )
    return db.scalars(stmt).unique().all()


def list_driver_trips(db: Session, driver_id: int) -> list[models.Trip]:
    stmt = (
        select(models.Trip)
        .options(joinedload(models.Trip.order), joinedload(models.Trip.driver), joinedload(models.Trip.vehicle))
        .where(models.Trip.driver_id == driver_id)
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
    communication.send_notification(db, trip_id=trip.id, channel="whatsapp", event_type="trip_started")
    emit_event(db, event_type="trip_approved", source="system", trip_id=trip.id, payload={"status": trip.status})
    enqueue_job_sync("notification", {"tripId": trip.id, "channel": "whatsapp", "eventType": "trip_started", "idempotencyKey": f"notification-start-{trip.id}"})
    enqueue_job_sync("prediction", {"tripId": trip.id, "idempotencyKey": f"prediction-approve-{trip.id}"})
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
    if trip.vehicle_id is not None:
        vehicle = db.get(models.Vehicle, trip.vehicle_id)
        if vehicle is not None:
            vehicle.available = True
    communication.send_notification(db, trip_id=trip.id, channel="whatsapp", event_type="trip_completed")
    emit_event(db, event_type="trip_completed", source="system", trip_id=trip.id, payload={"status": trip.status})
    enqueue_job_sync("notification", {"tripId": trip.id, "channel": "whatsapp", "eventType": "trip_completed", "idempotencyKey": f"notification-complete-{trip.id}"})
    db.commit()
    db.refresh(trip)
    return trip


def update_trip_location(db: Session, trip: models.Trip, lat: float, lng: float) -> models.Trip:
    trip.current_lat = lat
    trip.current_lng = lng
    trip.last_updated = datetime.now(timezone.utc)
    emit_event(db, event_type="location_updated", source="system", trip_id=trip.id, payload={"lat": lat, "lng": lng})
    db.commit()
    db.refresh(trip)
    return trip


def serialize_alert(alert: models.Alert) -> dict:
    return {
        "id": alert.id,
        "tripId": alert.trip_id,
        "type": alert.type,
        "message": alert.message,
        "recommendedAction": alert.recommended_action,
        "reason": alert.reason,
        "resolved": alert.resolved,
        "createdAt": alert.created_at.isoformat() if alert.created_at else None,
    }


def serialize_public_trip(trip: models.Trip) -> dict:
    return {
        "id": trip.id,
        "status": trip.status,
        "currentLat": trip.current_lat,
        "currentLng": trip.current_lng,
        "eta": trip.eta,
        "delayRisk": trip.delay_risk,
        "lastUpdated": trip.last_updated.isoformat() if trip.last_updated else None,
        "order": serialize_order(trip.order) if trip.order else None,
    }


def list_alerts(db: Session) -> list[models.Alert]:
    return db.scalars(select(models.Alert).order_by(models.Alert.id.desc())).all()


def get_alert(db: Session, alert_id: int) -> models.Alert | None:
    return db.get(models.Alert, alert_id)


def resolve_alert(db: Session, alert: models.Alert) -> models.Alert:
    alert.resolved = True
    communication.send_notification(db, trip_id=alert.trip_id, channel="sms", event_type="alert_resolved")
    emit_event(db, event_type="alert_resolved", source="system", trip_id=alert.trip_id, payload={"alertId": alert.id, "type": alert.type})
    enqueue_job_sync("notification", {"tripId": alert.trip_id, "channel": "sms", "eventType": "alert_resolved", "idempotencyKey": f"notification-alert-resolved-{alert.id}"})
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
    recommended_action = "reassign" if alert_type == "inactive" else "reroute"
    reason = "Driver has been inactive beyond threshold." if alert_type == "inactive" else "Trip duration indicates delay risk."
    db.add(
        models.Alert(
            trip_id=trip_id,
            type=alert_type,
            message=message,
            resolved=False,
            recommended_action=recommended_action,
            reason=reason,
        )
    )
    communication.send_notification(db, trip_id=trip_id, channel="push", event_type=f"alert_{alert_type}")
    emit_event(
        db,
        event_type="alert_raised",
        source="simulation",
        trip_id=trip_id,
        payload={"type": alert_type, "message": message, "recommendedAction": recommended_action},
    )
    enqueue_job_sync("notification", {"tripId": trip_id, "channel": "push", "eventType": f"alert_{alert_type}", "idempotencyKey": f"notification-alert-{alert_type}-{trip_id}"})


def _latest_event_time(db: Session, trip_id: int, event_types: list[str]) -> datetime | None:
    latest = db.scalar(
        select(models.Event.created_at)
        .where(models.Event.trip_id == trip_id, models.Event.event_type.in_(event_types))
        .order_by(models.Event.created_at.desc())
        .limit(1)
    )
    return latest


def _recent_location_points(db: Session, trip_id: int, limit: int = 2) -> list[dict]:
    rows = db.scalars(
        select(models.Event)
        .where(models.Event.trip_id == trip_id, models.Event.event_type == "location_updated")
        .order_by(models.Event.created_at.desc())
        .limit(limit)
    ).all()
    points: list[dict] = []
    for row in rows:
        payload = row.payload or {}
        if "lat" in payload and "lng" in payload:
            points.append(payload)
    return points


def simulate_in_transit_updates(db: Session) -> None:
    now = datetime.now(timezone.utc)
    active_trips = db.scalars(select(models.Trip).where(models.Trip.status != "completed")).all()

    for trip in active_trips:
        last_signal = _latest_event_time(db, trip.id, ["location_updated", "trip_approved", "driver_started_trip"]) or trip.last_updated or trip.created_at or now
        if (now - last_signal) > timedelta(seconds=20):
            _create_alert_if_missing(db, trip.id, "inactive", "Driver inactive", now)

        in_transit_since = trip.in_transit_started_at
        if trip.status == "in_transit" and in_transit_since and (now - in_transit_since) > timedelta(minutes=2):
            _create_alert_if_missing(db, trip.id, "delay", "Possible delay detected", now)

        if trip.status == "in_transit":
            trip.current_lat = float(trip.current_lat) + 0.001
            trip.current_lng = float(trip.current_lng) + 0.001
            trip.last_updated = now
            emit_event(
                db,
                event_type="location_updated",
                source="simulation",
                trip_id=trip.id,
                payload={"lat": trip.current_lat, "lng": trip.current_lng},
            )
            recent_points = _recent_location_points(db, trip.id, 2)
            if len(recent_points) == 2:
                latest = recent_points[0]
                previous = recent_points[1]
                delta = abs(float(latest["lat"]) - float(previous["lat"])) + abs(float(latest["lng"]) - float(previous["lng"]))
                if delta > 0.02:
                    _create_alert_if_missing(db, trip.id, "deviation", "Possible route deviation detected", now)
        risk, eta, confidence = prediction.estimate_delay_and_eta(trip)
        trip.delay_risk = risk
        trip.eta = eta
        trip.eta_confidence = confidence
        finance_snapshot = finance.calculate_trip_finance(trip)
        trip.fuel_cost = finance_snapshot["fuelCost"]
        trip.driver_cost = finance_snapshot["driverCost"]
        trip.toll_cost = finance_snapshot["tollCost"]
        trip.misc_cost = finance_snapshot["miscCost"]
        trip.revenue = finance_snapshot["revenue"]
        trip.profit = finance_snapshot["profit"]

    if active_trips:
        db.commit()


def seed_drivers(db: Session) -> None:
    has_driver = db.scalar(select(models.Driver.id).limit(1))
    if has_driver:
        return

    starters = [
        models.Driver(name="Marcus Chen", current_location="Chicago", location_score=1.2, rating=4.7, availability=True),
        models.Driver(name="Asha Reddy", current_location="Springfield", location_score=3.4, rating=4.5, availability=True),
        models.Driver(name="Luis Gomez", current_location="Atlanta", location_score=5.6, rating=4.4, availability=True),
    ]
    db.add_all(starters)
    db.commit()


def seed_vehicles(db: Session) -> None:
    has_vehicle = db.scalar(select(models.Vehicle.id).limit(1))
    if has_vehicle:
        return
    db.add_all(
        [
            models.Vehicle(name="Truck-101", type="dry_van", capacity_kg=18000, available=True),
            models.Vehicle(name="Truck-202", type="reefer", capacity_kg=14000, available=True),
            models.Vehicle(name="Truck-303", type="flatbed", capacity_kg=22000, available=True),
        ]
    )
    db.commit()


def can_transition(current_status: str, next_status: str) -> bool:
    return next_status in TRIP_TRANSITIONS.get(current_status, set())


def log_trip_audit(db: Session, trip: models.Trip, action: str, actor: str, details: dict | None = None) -> None:
    db.add(models.TripAuditLog(trip_id=trip.id, action=action, actor=actor, details=details))


def emit_event(
    db: Session,
    *,
    event_type: str,
    source: str = "system",
    trip_id: int | None = None,
    payload: dict | None = None,
) -> models.Event:
    event = models.Event(trip_id=trip_id, event_type=event_type, source=source, payload=payload or {})
    db.add(event)
    return event


def reject_trip(db: Session, trip: models.Trip, actor: str) -> models.Trip:
    if not can_transition(trip.status, "rejected"):
        raise ValueError(f"Cannot reject trip in '{trip.status}' state")
    trip.status = "rejected"
    trip.last_updated = datetime.now(timezone.utc)
    if trip.driver_id is not None:
        driver = db.get(models.Driver, trip.driver_id)
        if driver is not None:
            driver.availability = True
    if trip.vehicle_id is not None:
        vehicle = db.get(models.Vehicle, trip.vehicle_id)
        if vehicle is not None:
            vehicle.available = True
    log_trip_audit(db, trip, action="rejected", actor=actor)
    emit_event(db, event_type="trip_rejected", source=actor, trip_id=trip.id, payload={"status": trip.status})
    db.commit()
    db.refresh(trip)
    return trip


def regenerate_trip_plan(db: Session, trip: models.Trip, actor: str) -> models.Trip:
    if trip.driver_id is not None:
        driver = db.get(models.Driver, trip.driver_id)
        if driver is not None:
            driver.availability = True
    if trip.vehicle_id is not None:
        vehicle = db.get(models.Vehicle, trip.vehicle_id)
        if vehicle is not None:
            vehicle.available = True
    trip.driver_id = None
    trip.vehicle_id = None
    trip.status = "created"

    order = trip.order or db.get(models.Order, trip.order_id)
    if order is not None:
        load_kg = assignment.parse_load_kg(order.load)
        best_driver = assignment.select_best_driver(db)
        best_vehicle = assignment.select_best_vehicle(db, load_kg)
        if best_driver is not None:
            best_driver.availability = False
            trip.driver_id = best_driver.id
            trip.status = "assigned"
        if best_vehicle is not None:
            best_vehicle.available = False
            trip.vehicle_id = best_vehicle.id
        primary_route, alternate_routes, eta = routing.build_route_plan(order.pickup_location, order.drop_location)
        trip.primary_route = primary_route
        trip.alternate_routes = alternate_routes
        trip.eta = eta
    finance_snapshot = finance.calculate_trip_finance(trip)
    trip.fuel_cost = finance_snapshot["fuelCost"]
    trip.driver_cost = finance_snapshot["driverCost"]
    trip.toll_cost = finance_snapshot["tollCost"]
    trip.misc_cost = finance_snapshot["miscCost"]
    trip.revenue = finance_snapshot["revenue"]
    trip.profit = finance_snapshot["profit"]
    trip.last_updated = datetime.now(timezone.utc)
    log_trip_audit(db, trip, action="regenerated", actor=actor)
    emit_event(
        db,
        event_type="trip_regenerated",
        source=actor,
        trip_id=trip.id,
        payload={"driverId": trip.driver_id, "vehicleId": trip.vehicle_id},
    )
    db.commit()
    db.refresh(trip)
    return trip


def reroute_trip_from_alert(db: Session, alert: models.Alert, actor: str) -> models.Trip:
    trip = get_trip(db, alert.trip_id)
    if trip is None:
        raise ValueError("Trip not found")
    order = trip.order or db.get(models.Order, trip.order_id)
    pickup = order.pickup_location if order else "Pickup"
    drop = order.drop_location if order else "Drop"
    primary_route, alternate_routes, eta = routing.build_route_plan(pickup, drop)
    trip.primary_route = primary_route
    trip.alternate_routes = alternate_routes
    trip.eta = eta
    trip.last_updated = datetime.now(timezone.utc)
    alert.resolved = True
    log_trip_audit(db, trip, action="rerouted", actor=actor, details={"alertId": alert.id})
    communication.log_notification(db, trip.id, channel="whatsapp", event_type="trip_rerouted")
    emit_event(
        db,
        event_type="trip_rerouted",
        source=actor,
        trip_id=trip.id,
        payload={"alertId": alert.id, "route": trip.primary_route},
    )
    db.commit()
    db.refresh(trip)
    return trip


def reassign_trip_from_alert(db: Session, alert: models.Alert, actor: str) -> models.Trip:
    trip = get_trip(db, alert.trip_id)
    if trip is None:
        raise ValueError("Trip not found")
    if trip.driver_id is not None:
        previous_driver = db.get(models.Driver, trip.driver_id)
        if previous_driver is not None:
            previous_driver.availability = True
    best_driver = assignment.select_best_driver(db)
    if best_driver is not None:
        best_driver.availability = False
        trip.driver_id = best_driver.id
    trip.last_updated = datetime.now(timezone.utc)
    alert.resolved = True
    log_trip_audit(db, trip, action="reassigned", actor=actor, details={"alertId": alert.id})
    communication.log_notification(db, trip.id, channel="sms", event_type="trip_reassigned")
    emit_event(
        db,
        event_type="trip_reassigned",
        source=actor,
        trip_id=trip.id,
        payload={"alertId": alert.id, "driverId": trip.driver_id},
    )
    db.commit()
    db.refresh(trip)
    return trip


def get_trip_finance(db: Session, trip_id: int) -> dict | None:
    trip = get_trip(db, trip_id)
    if trip is None:
        return None
    return {
        "fuelCost": trip.fuel_cost,
        "driverCost": trip.driver_cost,
        "tollCost": trip.toll_cost,
        "miscCost": trip.misc_cost,
        "revenue": trip.revenue,
        "profit": trip.profit,
    }


def get_finance_summary(db: Session) -> dict:
    trips = db.scalars(select(models.Trip)).all()
    trip_count = len(trips)
    total_revenue = round(sum(trip.revenue for trip in trips), 2)
    total_cost = round(sum(trip.fuel_cost + trip.driver_cost + trip.toll_cost + trip.misc_cost for trip in trips), 2)
    total_profit = round(sum(trip.profit for trip in trips), 2)
    avg_profit = round(total_profit / trip_count, 2) if trip_count else 0.0
    return {
        "tripCount": trip_count,
        "totalRevenue": total_revenue,
        "totalCost": total_cost,
        "totalProfit": total_profit,
        "avgProfitPerTrip": avg_profit,
    }


def driver_start_trip(db: Session, trip: models.Trip, actor: str) -> models.Trip:
    if trip.status != "assigned":
        raise ValueError(f"Cannot start trip in '{trip.status}' state")
    trip.status = "in_transit"
    trip.in_transit_started_at = datetime.now(timezone.utc)
    trip.last_updated = datetime.now(timezone.utc)
    log_trip_audit(db, trip, action="driver_started_trip", actor=actor)
    emit_event(db, event_type="driver_started_trip", source=actor, trip_id=trip.id, payload={"status": trip.status})
    db.commit()
    db.refresh(trip)
    return trip


def driver_reached_pickup(db: Session, trip: models.Trip, actor: str) -> models.Trip:
    if trip.status != "in_transit":
        raise ValueError(f"Cannot mark pickup in '{trip.status}' state")
    trip.pickup_reached_at = datetime.now(timezone.utc)
    trip.last_updated = datetime.now(timezone.utc)
    log_trip_audit(db, trip, action="driver_reached_pickup", actor=actor)
    emit_event(db, event_type="driver_reached_pickup", source=actor, trip_id=trip.id, payload={})
    db.commit()
    db.refresh(trip)
    return trip


def driver_report_issue(db: Session, trip: models.Trip, actor: str, message: str) -> models.Alert:
    alert = models.Alert(
        trip_id=trip.id,
        type="driver_issue",
        message=message,
        resolved=False,
        recommended_action="reassign",
        reason="Driver reported an issue from the mobile app.",
    )
    db.add(alert)
    log_trip_audit(db, trip, action="driver_reported_issue", actor=actor, details={"message": message})
    emit_event(
        db,
        event_type="driver_issue_reported",
        source=actor,
        trip_id=trip.id,
        payload={"message": message},
    )
    communication.send_notification(db, trip_id=trip.id, channel="push", event_type="driver_issue_reported")
    enqueue_job_sync(
        "notification",
        {
            "tripId": trip.id,
            "channel": "push",
            "eventType": "driver_issue_reported",
            "idempotencyKey": f"driver-issue-{trip.id}-{int(datetime.now(timezone.utc).timestamp())}",
        },
    )
    db.commit()
    db.refresh(alert)
    return alert


def create_model_version_record(db: Session, payload: schemas.ModelEvaluationRecord) -> models.ModelVersion:
    record = models.ModelVersion(
        model_name=payload.modelName,
        version=payload.version,
        metrics=payload.metrics,
        notes=payload.notes,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def serialize_model_version(record: models.ModelVersion) -> dict:
    return {
        "id": record.id,
        "modelName": record.model_name,
        "version": record.version,
        "metrics": record.metrics,
        "notes": record.notes,
        "createdAt": record.created_at.isoformat() if record.created_at else None,
    }


def ensure_driver_users(db: Session) -> None:
    drivers = list_drivers(db)
    for driver in drivers:
        username = f"driver{driver.id}"
        existing = get_user_by_username(db, username)
        if existing is not None:
            if existing.driver_id is None:
                existing.driver_id = driver.id
            continue
        db.add(
            models.User(
                username=username,
                password_hash=hash_password("driver123"),
                role="driver",
                driver_id=driver.id,
                is_active=True,
            )
        )
    db.commit()
