# ShipGen Implementation Backlog (P0 / P1 / P2)

This backlog converts `GAP_ANALYSIS_E2E.md` into execution-ready work items with scope, acceptance criteria, and target files.

## Delivery Strategy

- **P0**: Close core product and production-readiness gaps.
- **P1**: Complete product surfaces and decision workflows.
- **P2**: Scale, intelligence maturity, and autonomous optimization.

---

## P0: Critical Foundations

## P0.1 Authentication + RBAC

### Goal

Protect all write operations and enforce role-based access.

### Backend tasks

- Add auth settings and JWT helpers.
  - `backend/app/core/security.py` (new)
  - `backend/app/core/config.py` (new)
- Add user/role model baseline.
  - `backend/app/models.py` (extend with `User`, `Role` or simple `role` enum)
- Add auth endpoints.
  - `backend/app/main.py` (`/auth/login`, `/auth/me`)
- Protect write APIs with dependencies.
  - `backend/app/main.py` (orders/trips/alerts write routes)

### Frontend tasks

- Add login screen + token storage.
  - `frontend/src/pages/LoginPage.tsx` (new)
  - `frontend/src/services/authApi.ts` (new)
- Attach token in API requests.
  - `frontend/src/services/shipgenApi.ts`
- Role-aware UI gating.
  - `frontend/src/components/layout/AppLayout.tsx`

### Acceptance criteria

- Unauthorized write requests return 401.
- Role mismatch returns 403.
- Logged-in users can perform allowed actions only.

---

## P0.2 Communication Engine (WhatsApp/SMS/Push abstraction)

### Goal

Automate trip lifecycle notifications and escalation/retry behavior.

### Backend tasks

- Add notification service abstraction and provider adapters.
  - `backend/app/services/communication.py` (new)
- Add trigger hooks:
  - On trip approve/start/complete
  - On alert creation
  - `backend/app/crud.py`
- Persist notification attempts.
  - Add `NotificationLog` model in `backend/app/models.py`

### Frontend tasks

- Show communication status on trip/alert detail UI.
  - `frontend/src/pages/TrackingPage.tsx`
  - `frontend/src/pages/AlertsPage.tsx`

### Acceptance criteria

- Notifications fire on trip state transitions.
- Failed sends retry with capped attempts and log entries.

---

## P0.3 Vehicle Model + Assignment Upgrade

### Goal

Move from driver-only nearest assignment to driver+vehicle intelligent matching.

### Backend tasks

- Add `Vehicle` model and relations to `Trip`.
  - `backend/app/models.py`
- Extend trip serialization with vehicle metadata.
  - `backend/app/crud.py`
- Implement assignment scoring function (distance + availability + vehicle capacity fit + driver rating placeholder).
  - `backend/app/services/assignment.py` (new)
- Replace assignment call paths to use new engine.
  - `backend/app/crud.py`

### Frontend tasks

- Show assigned vehicle details and capacity fit reason.
  - `frontend/src/pages/AutoTripPage.tsx`
  - `frontend/src/pages/TrackingPage.tsx`
- Extend shared types.
  - `frontend/src/types.ts`

### Acceptance criteria

- Trip creation returns `driver + vehicle`.
- Assignment avoids mismatched capacity.

---

## P0.4 Route Engine (Primary + Alternate)

### Goal

Attach route plan to trips and expose alternate routes.

### Backend tasks

- Add route model/JSON fields (`primary_route`, `alternate_routes`, ETA baseline).
  - `backend/app/models.py`
- Integrate maps provider abstraction.
  - `backend/app/services/routing.py` (new)
- Generate route on trip creation and reassignment.
  - `backend/app/crud.py`

### Frontend tasks

- Render route summary + alternate route selector (non-map MVP is acceptable).
  - `frontend/src/pages/AutoTripPage.tsx`
  - `frontend/src/pages/TrackingPage.tsx`

### Acceptance criteria

- Every assigned trip has route metadata.
- Alternate route list available via trip payload.

---

## P0.5 Prediction + ETA Service (MVP heuristic)

### Goal

Expose delay risk score and dynamic ETA from backend (not hardcoded UI).

### Backend tasks

- Add prediction service (phase-1 heuristic).
  - `backend/app/services/prediction.py` (new)
- Add fields to trip payload (`delayRisk`, `eta`, `etaConfidence`).
  - `backend/app/crud.py`, `backend/app/schemas.py`
- Update simulation to feed predictor.
  - `backend/app/crud.py`

### Frontend tasks

- Replace static status labels with API-driven risk/ETA.
  - `frontend/src/pages/TrackingPage.tsx`
  - `frontend/src/pages/AutoTripPage.tsx`

### Acceptance criteria

- Trips show backend-computed risk + ETA.
- Alerting references risk threshold logic.

---

## P0.6 Cost + Profit Engine

### Goal

Provide real backend profit calculations per trip.

### Backend tasks

- Add cost model fields (`fuel`, `driver_cost`, `toll`, `misc`, `revenue`, `profit`).
  - `backend/app/models.py` (or separate `TripFinance`)
- Implement calculation service.
  - `backend/app/services/finance.py` (new)
- Add finance endpoint.
  - `backend/app/main.py` (`GET /trips/{id}/finance`, optional aggregate endpoint)

### Frontend tasks

- Replace static profit values with API data.
  - `frontend/src/pages/AutoTripPage.tsx`
- Add profit summary widget in dashboard.
  - `frontend/src/pages/DashboardPage.tsx`

### Acceptance criteria

- Finance numbers in UI match backend response.
- Profit can be computed after completion and displayed for in-progress estimates.

---

## P0.7 NLP Intake (Email/WhatsApp/API normalization)

### Goal

Support unstructured order intake and extraction pipeline.

### Backend tasks

- Add ingestion endpoint for raw message payload.
  - `backend/app/main.py` (`POST /ingestion/messages`)
- Add NLP extraction service abstraction (initial: LLM API + parser/validator).
  - `backend/app/services/nlp_extraction.py` (new)
- Normalize extracted result into `OrderCreate`.
  - `backend/app/crud.py`

### Frontend tasks

- Add "paste raw request" UI for ops simulation.
  - `frontend/src/pages/DashboardPage.tsx`

### Acceptance criteria

- Raw logistics sentence creates structured order with confidence metadata.
- Missing fields produce explicit clarification-needed response.

---

## P1: Product Completion

## P1.1 Reject/Edit Workflow

### Tasks

- Add trip rejection endpoint and editable recommendation flow.
  - `backend/app/main.py`, `backend/app/crud.py`
- Add UI actions: Approve / Reject / Edit.
  - `frontend/src/pages/AutoTripPage.tsx`

### Acceptance criteria

- User can reject a suggestion and regenerate assignment/route.

---

## P1.2 Auto-Approval Mode

### Tasks

- Add policy config (`manual`, `rule_auto`).
  - `backend/app/core/config.py`
- Add audit logs for auto-approved actions.
  - `backend/app/models.py`, `backend/app/crud.py`

### Acceptance criteria

- Eligible trips auto-transition based on configured policy with traceable audit.

---

## P1.3 Alerts with Actionable Recommendations

### Tasks

- Extend alerts to include recommended action and reason.
  - `backend/app/models.py`, `backend/app/crud.py`
- Add action endpoints:
  - `POST /alerts/{id}/reroute`
  - `POST /alerts/{id}/reassign`
  - `backend/app/main.py`
- Wire CTAs in alerts UI.
  - `frontend/src/pages/AlertsPage.tsx`

### Acceptance criteria

- Alert cards include machine recommendation + one-click action.

---

## P1.4 Profit View Screen

### Tasks

- Add dedicated Profit page in nav.
  - `frontend/src/AppMain.tsx`
  - `frontend/src/pages/ProfitPage.tsx` (new)
- Add backend aggregate metrics endpoint.
  - `backend/app/main.py` (`GET /finance/summary`)

### Acceptance criteria

- Financial view shows per-trip and summary profit metrics sourced from backend.

---

## P1.5 Customer Tracking View

### Tasks

- Create public tokenized tracking endpoint.
  - `backend/app/main.py` (`GET /public/tracking/{token}`)
- Create minimal customer-facing UI page.
  - `frontend/src/pages/CustomerTrackingPage.tsx` (new)

### Acceptance criteria

- Customer can open link and see live status + ETA without full ops access.

---

## P1.6 Driver Mobile Surface (initial web-compatible module)

### Tasks

- Add driver task endpoints (`start`, `reached_pickup`, `delivered`).
  - `backend/app/main.py`, `backend/app/crud.py`
- Build mobile-first driver web view as interim before React Native app.
  - `frontend/src/pages/DriverOpsPage.tsx` (new)

### Acceptance criteria

- Driver can update statuses with minimal clicks.

---

## P2: Scale + Intelligence Maturity

## P2.1 Event Store + Telemetry

### Tasks

- Add `Event` model and trip event stream writes.
  - `backend/app/models.py`, `backend/app/crud.py`
- Refactor alert generation to consume events.

### Acceptance criteria

- Every status/location/alert mutation emits persistable event records.

---

## P2.2 Queue + Workers

### Tasks

- Introduce async task queue (Celery/RQ/Kafka consumer style).
- Move notification, prediction, and heavy computations off request thread.

### Acceptance criteria

- API latency remains stable under load due to async background processing.

---

## P2.3 Learning Loop Pipeline

### Tasks

- Build dataset exporter from trips/events/alerts outcomes.
- Add offline evaluation scripts for assignment/prediction improvements.
- Add model/version metadata tracking.

### Acceptance criteria

- Monthly model iteration with measurable KPI improvement.

---

## Cross-Cutting Engineering Tasks

- Add migration toolchain (`alembic`) and remove runtime schema patching.
- Add API test suites for core flows (`pytest`).
- Add frontend integration tests for key journeys.
- Add observability (request IDs, structured logs, error tracking).
- Add rate limiting and basic abuse protections for public endpoints.

---

## Suggested Sprint Breakdown

- **Sprint 1-2**: P0.1, P0.3, P0.4
- **Sprint 3-4**: P0.5, P0.6, P0.2
- **Sprint 5**: P0.7 + hardening
- **Sprint 6-8**: P1 set
- **Sprint 9+**: P2 set

---

## Definition of Done (Program Level)

- Core flows align with documentation intent: system-led logistics with human oversight.
- Security and financial correctness are production-safe.
- Recommendations and automation are actionable, observable, and auditable.
