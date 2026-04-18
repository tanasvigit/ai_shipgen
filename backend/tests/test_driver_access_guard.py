import pytest
from fastapi import HTTPException

from app import models
from app.main import _assert_driver_trip_access


def test_driver_access_guard_blocks_unassigned_trip() -> None:
    driver_user = models.User(username="driver1", password_hash="x", role="driver", driver_id=1, is_active=True)
    trip = models.Trip(order_id=1, driver_id=2, status="assigned", current_lat=0.0, current_lng=0.0)
    with pytest.raises(HTTPException) as exc:
        _assert_driver_trip_access(driver_user, trip)
    assert exc.value.status_code == 403


def test_driver_access_guard_allows_assigned_trip() -> None:
    driver_user = models.User(username="driver1", password_hash="x", role="driver", driver_id=1, is_active=True)
    trip = models.Trip(order_id=1, driver_id=1, status="assigned", current_lat=0.0, current_lng=0.0)
    _assert_driver_trip_access(driver_user, trip)


def test_driver_access_guard_admin_bypasses_ownership() -> None:
    """Admin/ops should not be blocked by driver ownership (used before other role checks on routes)."""
    admin_user = models.User(username="admin", password_hash="x", role="admin", driver_id=None, is_active=True)
    trip = models.Trip(order_id=1, driver_id=99, status="assigned", current_lat=0.0, current_lng=0.0)
    _assert_driver_trip_access(admin_user, trip)


def test_driver_access_guard_blocks_wrong_driver_for_location_scenario() -> None:
    """Regression: POST /trips/{id}/location and POST /trips/{id}/complete use this same guard for drivers."""
    driver_user = models.User(username="driver1", password_hash="x", role="driver", driver_id=1, is_active=True)
    trip = models.Trip(order_id=1, driver_id=2, status="in_transit", current_lat=0.0, current_lng=0.0)
    with pytest.raises(HTTPException) as exc:
        _assert_driver_trip_access(driver_user, trip)
    assert exc.value.status_code == 403
