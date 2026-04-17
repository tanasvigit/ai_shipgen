from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app import crud, models
from app.core.config import settings
from app.database import Base
from app.workers.queue import enqueue_job_sync, pop_job


def test_emit_event_persists_record() -> None:
    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

    with SessionLocal() as db:
        trip = models.Trip(order_id=1, driver_id=None, status="created")
        db.add(trip)
        db.commit()
        db.refresh(trip)

        crud.emit_event(db, event_type="trip_created", source="test", trip_id=trip.id, payload={"x": 1})
        db.commit()

        events = db.scalars(select(models.Event)).all()
        assert len(events) == 1
        assert events[0].event_type == "trip_created"


def test_queue_job_roundtrip() -> None:
    original_backend = settings.queue_backend
    try:
        settings.queue_backend = "memory"
        enqueue_job_sync("notification", {"tripId": 1})
        pulled = pop_job()
    finally:
        settings.queue_backend = original_backend
    assert pulled is not None
    assert pulled.job_type == "notification"
