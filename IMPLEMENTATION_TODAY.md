# ShipGen MVP Implementation Documentation

Date: 2026-04-17  
Scope: Full-stack MVP (React + FastAPI + PostgreSQL, Redis-ready)

## 1) What Was Implemented Today

We implemented an end-to-end MVP flow:

1. Create Order  
2. Auto-create Trip  
3. Auto-assign nearest available Driver  
4. Approve & Dispatch Trip  
5. Show data in Dashboard and Auto Trip screen

This matches the target flow:
`Order -> Auto Trip -> Driver Assignment -> Approve & Dispatch -> Dashboard visibility`

## 2) Tech Stack Implemented

- Frontend: React (Vite) + Tailwind CSS
- Backend: FastAPI (Python)
- Database: PostgreSQL (via SQLAlchemy ORM)
- Cache: Redis dependency included (not actively used in MVP logic yet)

## 3) Repository Structure Created

```text
/frontend
  /src
    App.jsx
    index.css
    main.jsx
  index.html
  tailwind.config.js
  postcss.config.js
  package.json

/backend
  /app
    __init__.py
    main.py
    database.py
    models.py
    schemas.py
    crud.py
  requirements.txt
```

## 4) Backend Documentation

### 4.1 Core Files

- `backend/app/main.py`: API routes, startup, CORS, health/root endpoints
- `backend/app/database.py`: SQLAlchemy engine/session/base
- `backend/app/models.py`: ORM models (`Order`, `Driver`, `Trip`)
- `backend/app/schemas.py`: request/response schema contracts
- `backend/app/crud.py`: business logic and serialization helpers
- `backend/requirements.txt`: Python dependencies

### 4.2 Data Models Implemented

#### Order
- `id` (int, PK)
- `pickup_location` (str)
- `drop_location` (str)
- `load` (str)
- `date` (str)
- `created_at` (timestamp)

#### Driver
- `id` (int, PK)
- `name` (str)
- `current_location` (str)
- `location_score` (float; used for nearest-driver approximation)
- `availability` (bool)

#### Trip
- `id` (int, PK)
- `order_id` (FK -> orders.id)
- `driver_id` (FK -> drivers.id, nullable)
- `status` (str: `created`, `assigned`, `in_transit`, `completed`)
- `created_at` (timestamp)

### 4.3 API Endpoints Implemented

#### Utility
- `GET /` -> `{"message":"ShipGen API running"}`
- `GET /health` -> `{"status":"ok"}`
- `GET /favicon.ico` -> no-content response (avoids browser 404 noise)

#### Orders
- `POST /orders`
  - Creates an order
  - Automatically creates a trip for that order
  - Automatically assigns nearest available driver
  - Returns created order + trip object
- `GET /orders`
  - Returns all orders (latest first)

#### Drivers
- `GET /drivers`
  - Returns all drivers

#### Trips
- `POST /trips/auto-create`
  - Creates trip manually from provided `orderId`
- `POST /trips/assign`
  - Assigns nearest available driver to provided `tripId`
  - Marks assigned driver `availability = false`
- `GET /trips`
  - Returns all trips with nested order/driver data
- `POST /trips/{id}/approve`
  - Marks trip status as `in_transit` (Approve & Dispatch)

### 4.4 Business Logic Implemented (No AI)

- On order creation, trip is auto-created.
- Nearest available driver is selected by smallest `location_score`.
- Assigned driver is marked unavailable.
- Trip status transitions:
  - `created` -> `assigned` (after assignment)
  - `assigned` -> `in_transit` (after approve)

### 4.5 Startup/Seed Behavior

- On startup:
  - Tables are created automatically via `Base.metadata.create_all`.
  - Initial drivers are seeded if table is empty.

### 4.6 Dependencies Installed

From `backend/requirements.txt`:
- `fastapi==0.116.1`
- `uvicorn[standard]==0.35.0`
- `sqlalchemy==2.0.43`
- `psycopg[binary]==3.2.13`
- `redis==6.4.0`
- `pydantic-settings==2.10.1`

## 5) Frontend Documentation

### 5.1 Core Files

- `frontend/src/App.jsx`: main UI, API integration, screen switching
- `frontend/src/index.css`: Tailwind directives + ShipGen style helpers
- `frontend/tailwind.config.js`: content paths + color/font tokens
- `frontend/index.html`: font imports and app shell

### 5.2 Screens Implemented

#### 1) Dashboard
- KPI cards:
  - Active Trips
  - Alerts Count (static placeholder in MVP)
  - Completed Trips
- Create Order form
- Auto Created Orders cards
- Ongoing Trips table

#### 2) Auto Trip Screen
- Shows:
  - Pickup, Drop, Load
  - Assigned Driver
  - Vehicle (static placeholder)
  - Route (placeholder)
  - Cost + Profit (static values)
- CTA:
  - `Approve & Dispatch` -> calls `POST /trips/{id}/approve`

### 5.3 Frontend-Backend Integration

Implemented live API integration via `fetch`:

- `GET /orders`, `GET /drivers`, `GET /trips` (initial and refresh)
- `POST /orders` (Create Order + auto trip/assignment in backend)
- `POST /trips/{id}/approve` (dispatch action)

### 5.4 Styling and Design Notes

- Tailwind configured and applied.
- Google fonts integrated: Manrope + Inter.
- Core design token colors introduced for ShipGen look/feel.
- Layout follows provided MVP screen intent (Dashboard + Auto Trip).

## 6) Run Instructions

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Backend URLs:
- API root: `http://127.0.0.1:8000/`
- Health: `http://127.0.0.1:8000/health`
- Swagger: `http://127.0.0.1:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:
- Vite app (typically): `http://127.0.0.1:5173`

## 7) Validation Completed Today

- Frontend build successful (`npm run build`)
- Backend Python compile check successful (`python -m compileall app`)
- Lint diagnostics checked for edited files (no reported issues)

## 8) Current MVP Limits (Intentional)

Not included yet (as requested):
- No AI model integration
- No live tracking implementation
- No alert engine logic
- No mobile app implementation

Also currently basic:
- Nearest-driver logic uses simple score field (not geo-distance calculation)
- No authentication/authorization
- No background jobs/queue processing
- Redis not wired into runtime logic yet

## 9) Suggested Next Steps

1. Add Docker Compose for one-command local stack (Postgres + Redis + backend + frontend)
2. Add DB migrations (Alembic)
3. Replace `location_score` with real geo-distance logic
4. Add status transition guardrails and audit logs
5. Add pagination/filtering for orders/trips
6. Add unit/integration tests for assignment and approve flows

## 10) Phase 2 - UI Parity + Reliability Hardening

### 10.1 UI Parity Delivered

Frontend was refactored to closely follow the provided web screen references while keeping existing functionality:

- Added a shared application shell:
  - fixed left sidebar navigation
  - sticky top app bar
- Reworked all pages with reference-style composition:
  - Dashboard: KPI cards, auto-created order cards, richer ongoing trips table, exception panel
  - Auto Trip: 3-column review layout (details, route/cost center, AI insights rail)
  - Tracking: live tracking canvas placeholder + timeline + insights
  - Alerts: editorial header, summary chips, alert stack, insights panel
- Kept all existing API actions wired:
  - create order
  - approve & dispatch
  - resolve alerts
- Preserved polling-based live updates every 5 seconds

Primary file:
- `frontend/src/App.jsx`

### 10.2 Functional Hardening Delivered

Backend flow reliability was improved:

- Added transactional-style atomic create flow:
  - order creation + trip creation + optional nearest driver assignment returned in one API response
- Added status transition guardrails:
  - `created -> assigned -> in_transit -> completed`
- Added complete endpoint:
  - `POST /trips/{trip_id}/complete`
  - marks trip completed
  - restores assigned driver availability
- Added `in_transit_started_at` to improve delay logic correctness

Primary files:
- `backend/app/main.py`
- `backend/app/crud.py`
- `backend/app/models.py`

### 10.3 Tracking/Alert Reliability Tuning Delivered

- Delay alerts now evaluate against `in_transit_started_at` instead of only trip creation time.
- Alert noise reduced with cooldown behavior:
  - unresolved dedupe remains
  - recent-alert cooldown check added before creating same alert type again.
- Simulation remains in-transit focused for coordinate movement and timestamp updates.

### 10.4 Validation Completed (Phase 2)

- Backend compile check passed:
  - `python -m compileall app`
- Frontend build passed:
  - `npm run build`
- Lint diagnostics checked for all edited files:
  - no linter issues reported

