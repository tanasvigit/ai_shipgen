"""HTTP-level check: driver cannot POST location on another driver's trip."""

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models
from app.core.security import create_access_token, hash_password
from app.database import Base, get_db
from app.main import app


@pytest.fixture
def sqlite_location_context(monkeypatch: pytest.MonkeyPatch) -> Generator[tuple[TestClient, int, str], None, None]:
    engine = create_engine(
        "sqlite+pysqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        future=True,
    )
    TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, future=True)

    def override_get_db() -> Generator:
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    d1 = models.Driver(name="Driver One", current_location="Hub A", availability=True)
    d2 = models.Driver(name="Driver Two", current_location="Hub B", availability=True)
    db.add_all([d1, d2])
    db.commit()
    db.refresh(d1)
    db.refresh(d2)

    order = models.Order(pickup_location="A", drop_location="B", load="1 ton", date="2026-04-18")
    db.add(order)
    db.commit()
    db.refresh(order)

    trip = models.Trip(
        order_id=order.id,
        driver_id=d2.id,
        status="in_transit",
        current_lat=0.0,
        current_lng=0.0,
    )
    db.add(trip)
    user = models.User(
        username="driver_one",
        password_hash=hash_password("secret"),
        role="driver",
        driver_id=d1.id,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(trip)
    db.refresh(user)
    trip_id = trip.id
    token = create_access_token(user)
    db.close()

    saved_startup = list(app.router.on_startup)
    saved_shutdown = list(app.router.on_shutdown)
    app.router.on_startup.clear()
    app.router.on_shutdown.clear()
    app.dependency_overrides[get_db] = override_get_db
    monkeypatch.setattr("app.database.SessionLocal", TestingSessionLocal)
    monkeypatch.setattr("app.database.engine", engine)
    monkeypatch.setattr("app.main.SessionLocal", TestingSessionLocal)

    try:
        with TestClient(app) as client:
            yield (client, trip_id, token)
    finally:
        app.dependency_overrides.clear()
        app.router.on_startup[:] = saved_startup
        app.router.on_shutdown[:] = saved_shutdown


def test_post_trip_location_returns_403_for_non_owner_driver(sqlite_location_context: tuple[TestClient, int, str]) -> None:
    client, trip_id, token = sqlite_location_context
    response = client.post(
        f"/trips/{trip_id}/location",
        json={"lat": 12.34, "lng": 56.78},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403
    assert "not assigned" in response.json().get("detail", "").lower()
