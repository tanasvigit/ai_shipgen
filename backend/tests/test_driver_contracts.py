from datetime import datetime, timezone

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import crud, models
from app.database import Base
from app.errors import DomainError


def _build_db():
    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
    Base.metadata.create_all(bind=engine)
    return sessionmaker(bind=engine, autocommit=False, autoflush=False)


def test_driver_start_requires_assigned() -> None:
    SessionLocal = _build_db()
    with SessionLocal() as db:
        order = models.Order(pickup_location="A", drop_location="B", load="1 ton", date="2026-04-17")
        trip = models.Trip(order=order, status="created", current_lat=0.0, current_lng=0.0)
        db.add(order)
        db.commit()
        try:
            crud.driver_start_trip(db, trip, actor="driver1")
            raised = False
        except DomainError:
            raised = True
        assert raised is True


def test_driver_reached_pickup_requires_in_transit() -> None:
    SessionLocal = _build_db()
    with SessionLocal() as db:
        order = models.Order(pickup_location="A", drop_location="B", load="1 ton", date="2026-04-17")
        trip = models.Trip(order=order, status="assigned", current_lat=0.0, current_lng=0.0)
        db.add(order)
        db.commit()
        try:
            crud.driver_reached_pickup(db, trip, actor="driver1")
            raised = False
        except DomainError:
            raised = True
        assert raised is True


def test_list_driver_trips_returns_only_assigned_driver() -> None:
    SessionLocal = _build_db()
    with SessionLocal() as db:
        order1 = models.Order(pickup_location="A", drop_location="B", load="1 ton", date="2026-04-17")
        order2 = models.Order(pickup_location="C", drop_location="D", load="2 ton", date="2026-04-17")
        trip1 = models.Trip(order=order1, driver_id=1, status="assigned", current_lat=0.0, current_lng=0.0, last_updated=datetime.now(timezone.utc))
        trip2 = models.Trip(order=order2, driver_id=2, status="assigned", current_lat=0.0, current_lng=0.0, last_updated=datetime.now(timezone.utc))
        db.add_all([order1, order2, trip1, trip2])
        db.commit()
        driver_one_trips = crud.list_driver_trips(db, 1)
        assert len(driver_one_trips) == 1
        assert driver_one_trips[0].driver_id == 1
