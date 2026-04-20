# ShipGen Web Application — End-to-End Documentation

This document describes the **ShipGen web frontend** (`frontend/`), how it connects to the backend, what operators can do, and how it aligns with driver workflows.

---

## 1. Purpose and stack

- **Role:** Operations and admin console for orders, trips, drivers, alerts, tracking, and driver-style actions in **Driver Ops**.
- **Stack:** React (Vite or dev server per `run.txt`), TypeScript, Tailwind-style UI tokens used in the codebase.
- **API:** All data comes from the **FastAPI backend** on port **8000**.

Default API base in code:

- `frontend/src/services/shipgenApi.ts` → `API_BASE = 'http://127.0.0.1:8000'`

Change this if the backend runs on another host or port.

---

## 2. Prerequisites

1. **PostgreSQL** — database (e.g. `shipgen`) as configured in `backend/.env`.
2. **Redis** — if your backend uses the durable queue; match `backend/.env`.
3. **Backend** — from repo root / `backend/`:

   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

4. **Frontend** — from `frontend/`:

   ```bash
   npm install
   npm run dev
   ```

See `run.txt` in the repo root for the full sequence (migrations, health checks, optional curl examples).

---

## 3. Authentication and roles

- Login uses **`POST /auth/login`**; the session (including `accessToken`) is stored in **`localStorage`** under the key used in `shipgenApi.ts` (`shipgen-auth-session`).
- **Roles** exposed by the backend include **`admin`**, **`ops_manager`**, and **`driver`**.

**Web app usage:**

- **Admin** is the primary account for an empty database: seeded as `admin` / `admin123` when no users exist (`ensure_default_user` in the backend).
- **`ops_manager`** is a valid role on many routes but may not have a separate seeded user unless you create one; **`admin`** can perform ops actions for testing.
- **Driver** accounts are for the **mobile app**; the web still has **Driver Ops** so operators can mirror driver actions when testing.

---

## 4. Main user journeys (operator)

### 4.1 Create an order and auto trip

- From the **Dashboard**, create an order (pickup, drop, load, date).
- The backend **`POST /orders`** creates an **order** and a **trip**, assigns the best available **driver** and **vehicle**, computes route/finance metadata, and may auto-advance status depending on **`SHIPGEN_APPROVAL_MODE`** (default **`manual`** in config).

**Typical outcome for testing:**

- First order often assigns **`driver1`** (best score among available drivers).
- Second concurrent order may assign **`driver2`** if **`driver1`** is still marked unavailable on an active trip.

### 4.2 Approve / reject / regenerate (AI trip flow)

- Screens such as **Auto Trip** show the selected trip, order details, ETA/finance summaries, and actions tied to **`approveTrip`**, **`rejectTrip`**, **`regenerateTrip`** in `shipgenApi.ts`.
- **Approve** maps to **`POST /trips/{id}/approve`** (state machine rules apply).

### 4.3 Driver Ops (web parity with mobile)

- **Driver Ops** exposes actions aligned with the driver mobile app:

  - **Start** when trip status is **`assigned`**.
  - **Reached pickup** / **Delivered** when status is **`in_transit`** (and backend rules allow).

- API errors (e.g. **409**) are surfaced using **`readErrorDetail`** so users see backend **`detail`** messages when available.
- **Report issue** calls the driver issue endpoint so ops can see alerts and follow up.

### 4.4 Alerts and tracking

- **Alerts** list supports resolve, reroute, reassign where implemented (`shipgenApi.ts` + hooks).
- **Tracking** shows trip/driver/vehicle context for monitoring.

### 4.5 Data refresh

- **`useShipgenData`** polls the backend on an interval and refreshes orders, drivers, trips, and alerts.
- It exposes **`refreshData`**, loading state, and handlers used across pages.

---

## 5. Shared conventions with the mobile app

- **Trip public reference** — both web and mobile use a shared-style label for shipment/trip display (e.g. **`TRK-{orderId}`** pattern via shared formatting logic; see `frontend/src/utils/tripLabel.ts` and mobile `formatTrip.ts`).
- **Driver action rules** — same state gates as the backend (`assigned` → start → `in_transit` → pickup / delivered / complete).

---

## 6. Configuration checklist

| Item | Location | Notes |
|------|----------|--------|
| API URL | `frontend/src/services/shipgenApi.ts` | Default `127.0.0.1:8000` |
| Auth storage | `shipgenApi.ts` | `localStorage` session key |
| Backend approval mode | `backend/.env` | `SHIPGEN_APPROVAL_MODE` affects auto `in_transit` on create |

---

## 7. Verification (quick)

1. Open the web app and log in as **admin**.
2. Create an order on the Dashboard; confirm a trip appears with expected status.
3. Open **Driver Ops** (or the flow you use for driver actions) and run **Start** → **Reached pickup** → **Delivered** where applicable.
4. Confirm **Alerts** / **Tracking** update after actions.

---

## 8. Troubleshooting

- **“Unable to reach backend”** — start FastAPI; confirm `API_BASE` matches host/port.
- **401 / login failures** — run migrations/seeds; confirm users exist (`admin`, `driver1`, etc.).
- **409 on driver actions** — trip may be in the wrong status for that action; check trip status on Dashboard or Tracking.

This document is scoped to the **website**; for the **driver mobile app**, see **`docs/DRIVER_MOBILE_APP.md`**.

Error contract and user-message standards are documented in **`docs/ERROR_MESSAGES.md`**.
