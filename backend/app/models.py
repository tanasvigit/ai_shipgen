from sqlalchemy import JSON, Boolean, Column, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default="ops_manager")
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    driver = relationship("Driver", foreign_keys=[driver_id])


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    pickup_location = Column(String, nullable=False)
    drop_location = Column(String, nullable=False)
    load = Column(String, nullable=False)
    date = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    trips = relationship("Trip", back_populates="order")


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    current_location = Column(String, nullable=False)
    location_score = Column(Float, nullable=False, default=999.0)
    rating = Column(Float, nullable=False, default=4.5)
    availability = Column(Boolean, default=True, nullable=False)

    trips = relationship("Trip", back_populates="driver")


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False, default="dry_van")
    capacity_kg = Column(Float, nullable=False, default=10000.0)
    available = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    trips = relationship("Trip", back_populates="vehicle")


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    status = Column(String, nullable=False, default="created")
    current_lat = Column(Float, nullable=False, default=0.0)
    current_lng = Column(Float, nullable=False, default=0.0)
    primary_route = Column(JSON, nullable=True)
    alternate_routes = Column(JSON, nullable=True)
    eta = Column(String, nullable=True)
    delay_risk = Column(Float, nullable=False, default=0.0)
    eta_confidence = Column(Float, nullable=False, default=1.0)
    pickup_reached_at = Column(DateTime(timezone=True), nullable=True)
    fuel_cost = Column(Float, nullable=False, default=0.0)
    driver_cost = Column(Float, nullable=False, default=0.0)
    toll_cost = Column(Float, nullable=False, default=0.0)
    misc_cost = Column(Float, nullable=False, default=0.0)
    revenue = Column(Float, nullable=False, default=0.0)
    profit = Column(Float, nullable=False, default=0.0)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    in_transit_started_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    order = relationship("Order", back_populates="trips")
    driver = relationship("Driver", back_populates="trips")
    vehicle = relationship("Vehicle", back_populates="trips")
    alerts = relationship("Alert", back_populates="trip")
    notifications = relationship("NotificationLog", back_populates="trip")
    audits = relationship("TripAuditLog", back_populates="trip")
    events = relationship("Event", back_populates="trip")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    type = Column(String, nullable=False)
    message = Column(String, nullable=False)
    recommended_action = Column(String, nullable=True)
    reason = Column(String, nullable=True)
    resolved = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    trip = relationship("Trip", back_populates="alerts")


class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=True)
    channel = Column(String, nullable=False)
    event_type = Column(String, nullable=False)
    status = Column(String, nullable=False, default="sent")
    attempts = Column(Integer, nullable=False, default=1)
    sent_at = Column(DateTime(timezone=True), server_default=func.now())

    trip = relationship("Trip", back_populates="notifications")


class TripAuditLog(Base):
    __tablename__ = "trip_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    action = Column(String, nullable=False)
    actor = Column(String, nullable=False, default="system")
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    trip = relationship("Trip", back_populates="audits")


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=True)
    event_type = Column(String, nullable=False, index=True)
    source = Column(String, nullable=False, default="system")
    payload = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    trip = relationship("Trip", back_populates="events")


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String, nullable=False, index=True)
    version = Column(String, nullable=False)
    metrics = Column(JSON, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
