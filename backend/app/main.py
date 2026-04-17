import asyncio

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from . import crud, models, schemas
from .database import Base, SessionLocal, engine, get_db

app = FastAPI(title="ShipGen MVP API")
simulation_task: asyncio.Task | None = None

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def ensure_tracking_and_alert_columns() -> None:
    inspector = inspect(engine)

    trip_columns = {column["name"] for column in inspector.get_columns("trips")}
    with engine.begin() as conn:
        if "current_lat" not in trip_columns:
            conn.execute(text("ALTER TABLE trips ADD COLUMN current_lat DOUBLE PRECISION NOT NULL DEFAULT 0"))
        if "current_lng" not in trip_columns:
            conn.execute(text("ALTER TABLE trips ADD COLUMN current_lng DOUBLE PRECISION NOT NULL DEFAULT 0"))
        if "last_updated" not in trip_columns:
            conn.execute(
                text("ALTER TABLE trips ADD COLUMN last_updated TIMESTAMPTZ DEFAULT NOW()")
            )
        if "in_transit_started_at" not in trip_columns:
            conn.execute(
                text("ALTER TABLE trips ADD COLUMN in_transit_started_at TIMESTAMPTZ")
            )

    table_names = set(inspector.get_table_names())
    if "alerts" not in table_names:
        models.Alert.__table__.create(bind=engine)


async def simulation_worker() -> None:
    while True:
        with SessionLocal() as db:
            crud.simulate_in_transit_updates(db)
        await asyncio.sleep(5)


@app.on_event("startup")
async def startup() -> None:
    global simulation_task
    Base.metadata.create_all(bind=engine)
    ensure_tracking_and_alert_columns()
    with SessionLocal() as db:
        crud.seed_drivers(db)
    simulation_task = asyncio.create_task(simulation_worker())


@app.on_event("shutdown")
async def shutdown() -> None:
    global simulation_task
    if simulation_task is not None:
        simulation_task.cancel()
        try:
            await simulation_task
        except asyncio.CancelledError:
            pass


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/")
def root() -> dict:
    return {"message": "ShipGen API running"}


@app.get("/favicon.ico")
def favicon() -> None:
    return None


@app.post("/orders")
def create_order(payload: schemas.OrderCreate, db: Session = Depends(get_db)) -> dict:
    order, trip = crud.create_order_with_auto_trip_assignment(db, payload)
    return {"order": crud.serialize_order(order), "trip": crud.serialize_trip(trip)}


@app.get("/orders")
def list_orders(db: Session = Depends(get_db)) -> list[dict]:
    return [crud.serialize_order(order) for order in crud.list_orders(db)]


@app.get("/drivers")
def list_drivers(db: Session = Depends(get_db)) -> list[dict]:
    return [crud.serialize_driver(driver) for driver in crud.list_drivers(db)]


@app.post("/trips/auto-create")
def auto_create_trip(payload: schemas.TripCreateRequest, db: Session = Depends(get_db)) -> dict:
    order = crud.get_order(db, payload.orderId)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    trip = crud.auto_create_trip(db, payload.orderId)
    return crud.serialize_trip(trip)


@app.post("/trips/assign")
def assign_trip(payload: schemas.TripAssignRequest, db: Session = Depends(get_db)) -> dict:
    trip = crud.get_trip(db, payload.tripId)
    if trip is None:
        raise HTTPException(status_code=404, detail="Trip not found")
    trip = crud.assign_nearest_driver(db, trip)
    return crud.serialize_trip(trip)


@app.get("/trips")
def list_trips(db: Session = Depends(get_db)) -> list[dict]:
    return [crud.serialize_trip(trip) for trip in crud.list_trips(db)]


@app.get("/trips/{trip_id}")
def get_trip(trip_id: int, db: Session = Depends(get_db)) -> dict:
    trip = crud.get_trip(db, trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail="Trip not found")
    return crud.serialize_trip(trip)


@app.post("/trips/{trip_id}/location")
def update_trip_location(trip_id: int, payload: schemas.TripLocationUpdate, db: Session = Depends(get_db)) -> dict:
    trip = crud.get_trip(db, trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail="Trip not found")
    trip = crud.update_trip_location(db, trip, payload.lat, payload.lng)
    return crud.serialize_trip(trip)


@app.post("/trips/{trip_id}/approve")
def approve_trip(trip_id: int, db: Session = Depends(get_db)) -> dict:
    trip = crud.get_trip(db, trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail="Trip not found")
    try:
        trip = crud.approve_trip(db, trip)
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    return {"id": trip.id, "status": trip.status}


@app.post("/trips/{trip_id}/complete")
def complete_trip(trip_id: int, db: Session = Depends(get_db)) -> dict:
    trip = crud.get_trip(db, trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail="Trip not found")
    try:
        trip = crud.complete_trip(db, trip)
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    return {"id": trip.id, "status": trip.status}


@app.get("/alerts")
def list_alerts(db: Session = Depends(get_db)) -> list[dict]:
    return [crud.serialize_alert(alert) for alert in crud.list_alerts(db)]


@app.post("/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: int, db: Session = Depends(get_db)) -> dict:
    alert = crud.get_alert(db, alert_id)
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert = crud.resolve_alert(db, alert)
    return crud.serialize_alert(alert)
