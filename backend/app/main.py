import asyncio

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect
from sqlalchemy.orm import Session

from . import crud, models, schemas
from .core.config import settings
from .core.security import create_access_token, decode_public_tracking_token, get_current_user, require_role, verify_password
from .database import SessionLocal, engine, get_db
from .ml.dataset_export import export_learning_dataset
from .ml.evaluate import run_offline_evaluation
from .services import communication, routing
from .services.nlp_extraction import extract_order_from_text, nlp_readiness
from .workers.runner import run_worker_loop

app = FastAPI(title="ShipGen MVP API")
simulation_task: asyncio.Task | None = None
worker_task: asyncio.Task | None = None

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def ensure_schema_is_migrated() -> None:
    inspector = inspect(engine)
    existing_table_names = set(inspector.get_table_names())
    if "alembic_version" not in existing_table_names:
        raise RuntimeError(
            "Database schema is not managed by Alembic yet. "
            "Run 'alembic -c backend/alembic.ini upgrade head' before starting the API."
        )


async def simulation_worker() -> None:
    while True:
        with SessionLocal() as db:
            crud.simulate_in_transit_updates(db)
        await asyncio.sleep(5)


@app.on_event("startup")
async def startup() -> None:
    global simulation_task, worker_task
    ensure_schema_is_migrated()
    with SessionLocal() as db:
        crud.seed_drivers(db)
        crud.seed_vehicles(db)
        crud.ensure_default_user(db)
    simulation_task = asyncio.create_task(simulation_worker())
    worker_task = asyncio.create_task(run_worker_loop())


@app.on_event("shutdown")
async def shutdown() -> None:
    global simulation_task, worker_task
    if simulation_task is not None:
        simulation_task.cancel()
        try:
            await simulation_task
        except asyncio.CancelledError:
            pass
    if worker_task is not None:
        worker_task.cancel()
        try:
            await worker_task
        except asyncio.CancelledError:
            pass


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/")
def root() -> dict:
    return {"message": "ShipGen API running"}


@app.get("/settings/approval-mode")
def approval_mode() -> dict:
    return {"mode": settings.approval_mode}


@app.get("/system/readiness")
def system_readiness() -> dict:
    return {
        "environment": settings.environment,
        "communications": communication.communication_readiness(),
        "routing": routing.routing_readiness(),
        "nlp": nlp_readiness(),
        "queue": {"backend": settings.queue_backend, "redisConfigured": bool(settings.redis_url)},
    }


@app.get("/favicon.ico")
def favicon() -> None:
    return None


@app.post("/auth/login", response_model=schemas.LoginResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)) -> dict:
    user = crud.get_user_by_username(db, payload.username)
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_access_token(user)
    return {"accessToken": token, "role": user.role}


@app.get("/auth/me")
def me(current_user: models.User = Depends(get_current_user)) -> dict:
    return {"username": current_user.username, "role": current_user.role}


@app.post("/orders")
def create_order(
    payload: schemas.OrderCreate,
    db: Session = Depends(get_db),
    _current_user: models.User = Depends(require_role("admin", "ops_manager")),
) -> dict:
    order, trip = crud.create_order_with_auto_trip_assignment(db, payload)
    return {"order": crud.serialize_order(order), "trip": crud.serialize_trip(trip)}


@app.get("/orders")
def list_orders(db: Session = Depends(get_db)) -> list[dict]:
    return [crud.serialize_order(order) for order in crud.list_orders(db)]


@app.get("/drivers")
def list_drivers(db: Session = Depends(get_db)) -> list[dict]:
    return [crud.serialize_driver(driver) for driver in crud.list_drivers(db)]


@app.post("/trips/auto-create")
def auto_create_trip(
    payload: schemas.TripCreateRequest,
    db: Session = Depends(get_db),
    _current_user: models.User = Depends(require_role("admin", "ops_manager")),
) -> dict:
    order = crud.get_order(db, payload.orderId)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    trip = crud.auto_create_trip(db, payload.orderId)
    return crud.serialize_trip(trip)


@app.post("/trips/assign")
def assign_trip(
    payload: schemas.TripAssignRequest,
    db: Session = Depends(get_db),
    _current_user: models.User = Depends(require_role("admin", "ops_manager")),
) -> dict:
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
def update_trip_location(
    trip_id: int,
    payload: schemas.TripLocationUpdate,
    db: Session = Depends(get_db),
    _current_user: models.User = Depends(require_role("admin", "ops_manager", "driver")),
) -> dict:
    trip = crud.get_trip(db, trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail="Trip not found")
    trip = crud.update_trip_location(db, trip, payload.lat, payload.lng)
    return crud.serialize_trip(trip)


@app.post("/trips/{trip_id}/approve")
def approve_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    _current_user: models.User = Depends(require_role("admin", "ops_manager")),
) -> dict:
    trip = crud.get_trip(db, trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail="Trip not found")
    try:
        trip = crud.approve_trip(db, trip)
        crud.log_trip_audit(db, trip, action="approved", actor=_current_user.username)
        db.commit()
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    return {"id": trip.id, "status": trip.status}


@app.post("/trips/{trip_id}/complete")
def complete_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    _current_user: models.User = Depends(require_role("admin", "ops_manager", "driver")),
) -> dict:
    trip = crud.get_trip(db, trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail="Trip not found")
    try:
        trip = crud.complete_trip(db, trip)
        crud.log_trip_audit(db, trip, action="completed", actor=_current_user.username)
        db.commit()
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    return {"id": trip.id, "status": trip.status}


@app.get("/alerts")
def list_alerts(db: Session = Depends(get_db)) -> list[dict]:
    return [crud.serialize_alert(alert) for alert in crud.list_alerts(db)]


@app.post("/alerts/{alert_id}/resolve")
def resolve_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    _current_user: models.User = Depends(require_role("admin", "ops_manager")),
) -> dict:
    alert = crud.get_alert(db, alert_id)
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert = crud.resolve_alert(db, alert)
    return crud.serialize_alert(alert)


@app.post("/alerts/{alert_id}/reroute")
def reroute_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    _current_user: models.User = Depends(require_role("admin", "ops_manager")),
) -> dict:
    alert = crud.get_alert(db, alert_id)
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    try:
        trip = crud.reroute_trip_from_alert(db, alert, actor=_current_user.username)
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    return crud.serialize_trip(trip)


@app.post("/alerts/{alert_id}/reassign")
def reassign_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    _current_user: models.User = Depends(require_role("admin", "ops_manager")),
) -> dict:
    alert = crud.get_alert(db, alert_id)
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    try:
        trip = crud.reassign_trip_from_alert(db, alert, actor=_current_user.username)
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    return crud.serialize_trip(trip)


@app.get("/trips/{trip_id}/finance", response_model=schemas.FinanceResponse)
def trip_finance(trip_id: int, db: Session = Depends(get_db)) -> dict:
    finance_data = crud.get_trip_finance(db, trip_id)
    if finance_data is None:
        raise HTTPException(status_code=404, detail="Trip not found")
    return finance_data


@app.get("/finance/summary", response_model=schemas.FinanceSummaryResponse)
def finance_summary(db: Session = Depends(get_db)) -> dict:
    return crud.get_finance_summary(db)


@app.post("/ml/export-dataset")
def export_dataset(
    db: Session = Depends(get_db),
    _current_user: models.User = Depends(require_role("admin", "ops_manager")),
) -> dict:
    artifact_path = export_learning_dataset(db)
    return {"artifactPath": artifact_path}


@app.post("/ml/offline-cycle")
def run_offline_cycle(
    payload: schemas.OfflineCycleRequest,
    db: Session = Depends(get_db),
    _current_user: models.User = Depends(require_role("admin", "ops_manager")),
) -> dict:
    artifact_path = export_learning_dataset(db, run_label=payload.runLabel)
    metrics = run_offline_evaluation(db)
    version_suffix = payload.runLabel or "manual"
    record = crud.create_model_version_record(
        db,
        schemas.ModelEvaluationRecord(
            modelName="assignment_prediction_heuristic",
            version=f"offline-{version_suffix}",
            metrics=metrics,
            notes=f"offline cycle artifact={artifact_path}",
        ),
    )
    return {"artifactPath": artifact_path, "metrics": metrics, "modelVersion": crud.serialize_model_version(record)}


@app.post("/ml/evaluate")
def evaluate_models(
    db: Session = Depends(get_db),
    _current_user: models.User = Depends(require_role("admin", "ops_manager")),
) -> dict:
    metrics = run_offline_evaluation(db)
    return {"metrics": metrics}


@app.post("/ml/model-versions", response_model=schemas.ModelEvaluationResponse)
def create_model_version(
    payload: schemas.ModelEvaluationRecord,
    db: Session = Depends(get_db),
    _current_user: models.User = Depends(require_role("admin", "ops_manager")),
) -> dict:
    record = crud.create_model_version_record(db, payload)
    return crud.serialize_model_version(record)


@app.post("/ingestion/messages")
def ingest_message(
    payload: schemas.IngestionRequest,
    db: Session = Depends(get_db),
    _current_user: models.User = Depends(require_role("admin", "ops_manager")),
) -> dict:
    extracted = extract_order_from_text(payload.rawText)
    order, trip = crud.create_order_with_auto_trip_assignment(db, extracted["order"])
    return {
        "confidence": extracted["confidence"],
        "order": crud.serialize_order(order),
        "trip": crud.serialize_trip(trip),
    }


@app.post("/ingestion/email")
def ingest_email(
    payload: schemas.ChannelIngestionRequest,
    db: Session = Depends(get_db),
    _current_user: models.User = Depends(require_role("admin", "ops_manager")),
) -> dict:
    extracted = extract_order_from_text(payload.message)
    order, trip = crud.create_order_with_auto_trip_assignment(db, extracted["order"])
    return {"source": "email", "sourceId": payload.sourceId, "confidence": extracted["confidence"], "order": crud.serialize_order(order), "trip": crud.serialize_trip(trip)}


@app.post("/ingestion/whatsapp")
def ingest_whatsapp(
    payload: schemas.ChannelIngestionRequest,
    db: Session = Depends(get_db),
    _current_user: models.User = Depends(require_role("admin", "ops_manager")),
) -> dict:
    extracted = extract_order_from_text(payload.message)
    order, trip = crud.create_order_with_auto_trip_assignment(db, extracted["order"])
    return {
        "source": "whatsapp",
        "sourceId": payload.sourceId,
        "confidence": extracted["confidence"],
        "order": crud.serialize_order(order),
        "trip": crud.serialize_trip(trip),
    }


@app.post("/trips/{trip_id}/reject")
def reject_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    _current_user: models.User = Depends(require_role("admin", "ops_manager")),
) -> dict:
    trip = crud.get_trip(db, trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail="Trip not found")
    try:
        trip = crud.reject_trip(db, trip, actor=_current_user.username)
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    return crud.serialize_trip(trip)


@app.post("/trips/{trip_id}/regenerate")
def regenerate_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    _current_user: models.User = Depends(require_role("admin", "ops_manager")),
) -> dict:
    trip = crud.get_trip(db, trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail="Trip not found")
    trip = crud.regenerate_trip_plan(db, trip, actor=_current_user.username)
    return crud.serialize_trip(trip)


@app.post("/driver/trips/{trip_id}/start")
def driver_start_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    _current_user: models.User = Depends(require_role("driver", "admin", "ops_manager")),
) -> dict:
    trip = crud.get_trip(db, trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail="Trip not found")
    try:
        trip = crud.driver_start_trip(db, trip, actor=_current_user.username)
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    return crud.serialize_trip(trip)


@app.post("/driver/trips/{trip_id}/reached-pickup")
def driver_reached_pickup(
    trip_id: int,
    db: Session = Depends(get_db),
    _current_user: models.User = Depends(require_role("driver", "admin", "ops_manager")),
) -> dict:
    trip = crud.get_trip(db, trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail="Trip not found")
    trip = crud.driver_reached_pickup(db, trip, actor=_current_user.username)
    return crud.serialize_trip(trip)


@app.post("/driver/trips/{trip_id}/delivered")
def driver_delivered_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    _current_user: models.User = Depends(require_role("driver", "admin", "ops_manager")),
) -> dict:
    trip = crud.get_trip(db, trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail="Trip not found")
    try:
        trip = crud.complete_trip(db, trip)
        crud.log_trip_audit(db, trip, action="driver_delivered_trip", actor=_current_user.username)
        db.commit()
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    return crud.serialize_trip(trip)


@app.get("/public/tracking/{token}")
def public_tracking(token: str, db: Session = Depends(get_db)) -> dict:
    trip_id = decode_public_tracking_token(token)
    trip = crud.get_trip(db, trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail="Trip not found")
    return crud.serialize_trip(trip)
