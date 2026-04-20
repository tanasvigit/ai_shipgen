# External Integration Gaps (Fleetbase + Traccar)

This document compares the **current ShipGen codebase** with the target architecture you described:

- **Fleetbase** as the source of real operational master/transactional data (drivers, vehicles, orders/shipments, assignments).
- **Traccar** as real-time telemetry source (GPS/device events).
- **ShipGen** as orchestration + AI automation + operator/driver workflows.

---

## 1) Target Architecture (as understood)

1. Logistics agency operates core data in **Fleetbase**.
2. ShipGen reads/syncs that data and runs automation:
   - trip lifecycle,
   - assignment/reroute/reassign,
   - alerts, prediction, finance insights.
3. **Traccar** provides live device location/telemetry.
4. ShipGen consumes telemetry, updates trips, risk, ETA, and driver/ops UI in near real-time.

---

## 2) Current Implementation Snapshot

### 2.1 Data origin

Current backend seeds local data on startup:

- `seed_drivers`
- `seed_vehicles`
- `ensure_default_user`
- `ensure_driver_users`

These are in `backend/app/crud.py` and called from startup in `backend/app/main.py`.

Orders are created locally via:

- `POST /orders` (web form)
- ingestion routes (`/ingestion/messages`, `/ingestion/email`, `/ingestion/whatsapp`) using regex extraction.

### 2.2 External provider status

Providers are mostly **sandbox/local-ready toggles** in `backend/app/core/config.py`:

- comm provider (`SHIPGEN_COMM_PROVIDER`)
- route provider (`SHIPGEN_ROUTE_PROVIDER`)
- NLP provider (`SHIPGEN_NLP_PROVIDER`)
- queue backend (`SHIPGEN_QUEUE_BACKEND`)

Service modules currently provide internal/sandbox logic:

- `services/communication.py`: logs notifications + readiness flags, no concrete third-party transport implementation.
- `services/routing.py`: mock route plan generation.
- `services/nlp_extraction.py`: regex parsing, not production-grade model/service integration.
- `workers/*`: internal queue/worker with Redis or memory fallback.

### 2.3 Tracking source

Trip coordinates are currently updated by:

- driver action API (`POST /trips/{id}/location`)
- internal simulation loop (`simulate_in_transit_updates`) that moves coords and raises synthetic alerts.

No Traccar ingestion path exists yet.

---

## 3) Integration Gap Matrix

## A. Fleetbase Integration Gaps

### A1. Master data source-of-truth gap (critical)

**Current:** drivers/vehicles/users are locally seeded and locally managed tables.  
**Needed:** Fleetbase authoritative data ingestion/sync and ID mapping.

Missing:

- Fleetbase connector client (auth, pagination, retries, rate-limit handling).
- import/sync jobs for:
  - drivers,
  - vehicles/assets,
  - shipments/orders,
  - assignment metadata.
- external-to-internal ID mapping strategy (`fleetbase_*_id` fields).
- conflict resolution policy (Fleetbase wins vs ShipGen local edits).

### A2. Transaction/event sync gap (critical)

**Current:** ShipGen changes state locally only.  
**Needed:** bidirectional state consistency with Fleetbase.

Missing:

- outbound updates from ShipGen -> Fleetbase (trip status changes, delivery, issue reporting).
- inbound updates Fleetbase -> ShipGen (new/edited orders, cancellations, reassignment from external ops).
- idempotent sync processor keyed by external event IDs.
- replay/reconciliation jobs for missed events.

### A3. Multi-tenant isolation gap (critical for real-world SaaS)

**Current:** single-tenant local assumptions in schema and auth model.  
**Needed:** tenant-scoped data and credentials.

Missing:

- tenant/org identifier across key tables and queries.
- per-tenant Fleetbase credentials/secrets storage.
- tenant-aware API auth and access control.
- tenant-scoped workers and queue routing.

### A4. Schema completeness gap for real fleet ops (high)

**Current models:** minimal fields (`Driver.name/location_score`, `Vehicle.name/type/capacity`, `Order.pickup/drop/load/date`).  
**Needed:** production operations fields.

Missing likely fields:

- driver: license/compliance, contact, status lifecycle, hub/team.
- vehicle: plate/VIN, ownership, maintenance state, telematics device linkage.
- order/shipment: customer, SLA windows, stops, service type, constraints.
- trip: richer planning artifacts (waypoints, stop sequence, handoff checkpoints).

### A5. Lifecycle orchestration gap (high)

**Current:** create order -> auto-assign driver/vehicle using simple heuristics; status transitions are local.  
**Needed:** lifecycle interoperability with Fleetbase workflow states.

Missing:

- explicit state mapping table (Fleetbase states <-> ShipGen states).
- transition guard alignment and fallback handling for out-of-order external events.
- canonical ownership of each state transition.

---

## B. Traccar Integration Gaps

### B1. Telemetry ingestion gap (critical)

**Current:** no Traccar endpoint/client integration.  
**Needed:** robust ingest pipeline for location/device events.

Missing:

- Traccar webhook/polling integration module.
- secure inbound endpoint with signature/token validation.
- event parsing and normalization (timestamp, lat/lng, speed, heading, ignition, accuracy).
- dedupe logic by device event ID + timestamp.

### B2. Device-to-domain mapping gap (critical)

**Current:** `Trip` has no external device linkage model.  
**Needed:** deterministic mapping between Traccar device, Fleetbase vehicle, and active ShipGen trip.

Missing:

- device registry table(s) and mapping fields.
- resolution strategy:
  - device -> vehicle,
  - vehicle -> active trip,
  - driver assignment consistency checks.

### B3. Real-time risk/ETA engine input gap (high)

**Current:** risk and ETA are heuristic + simulation based (`prediction.py`, `simulate_in_transit_updates`).  
**Needed:** telemetry-driven prediction updates.

Missing:

- route-progress computation from live breadcrumbs.
- stale-signal detection from real timestamps.
- deviation detection against planned route geometry.
- ETA recomputation from real speeds/events.

### B4. Alert semantics gap (high)

**Current alerts:** synthetic inactive/delay/deviation generated internally.  
**Needed:** telemetry-backed alerts with confidence and evidence.

Missing:

- standardized alert triggers from Traccar signals.
- suppress/noise-control (cooldowns, threshold tuning).
- per-alert evidence payload (recent points, distance-off-route, duration thresholds).

---

## C. Integration Platform / Reliability Gaps

### C1. Integration layer structure gap (critical)

**Current:** service modules are internal and synchronous-friendly.  
**Needed:** explicit integration adapters with contracts.

Missing:

- adapter interfaces + implementations:
  - `FleetbaseClient`,
  - `TraccarIngestService`,
  - `ExternalSyncOrchestrator`.
- clear separation between domain logic and external IO concerns.

### C2. Outbox/inbox and idempotency robustness gap (high)

**Current:** queue has idempotency key support, but external event architecture is not implemented.  
**Needed:** formal inbound/outbound event processing model.

Missing:

- inbound event store with processed marker.
- outbound event/outbox table with retry lifecycle.
- dead-letter observability + replay tooling.

### C3. Observability gap (high)

**Current:** readiness endpoint exists; limited integration metrics.  
**Needed:** integration SLO-level observability.

Missing:

- sync lag metrics per source (Fleetbase/Traccar).
- ingest throughput/error rates.
- per-tenant integration health.
- alerting on webhook failures, queue DLQ growth, stale telemetry.

### C4. Security/compliance gap (high)

Missing:

- secret vault strategy (no plaintext env at scale).
- webhook authentication/rotation.
- audit trail for external writes.
- PII/retention policy for telemetry histories.

---

## 4) Web + Mobile Surface Gaps for External Integrations

### 4.1 Current UI assumptions to replace

- Data appears from local DB quickly (seed + local create flow).
- Tracking can rely on simulation and manual location updates.

### 4.2 Needed UI upgrades

- external sync states:
  - last sync time,
  - stale data banners,
  - partial sync warnings.
- source attribution:
  - “from Fleetbase” / “from Traccar”.
- conflict indicators:
  - assignment mismatch,
  - stale trip/device mapping.
- fallback UX:
  - operate in degraded mode when one external system is unavailable.

---

## 5) Priority Implementation Roadmap

## Phase 1 (must-have before pilot customers)

1. Fleetbase read sync for master + order/shipment data.
2. External ID mapping schema migration.
3. Remove startup dependence on seed data for production mode.
4. Basic Traccar ingest endpoint + device mapping.
5. Telemetry-driven location update path replacing simulation in prod mode.

## Phase 2 (operational consistency)

1. Bidirectional status sync with idempotent outbox/inbox.
2. Reconciliation jobs and conflict resolution.
3. Per-tenant credentials and tenant-aware auth/data isolation.
4. Sync health dashboards + alerting.

## Phase 3 (automation maturity)

1. Prediction model upgrades using real telemetry.
2. Advanced anomaly detection (route deviation, dwell, unauthorized stops).
3. Robust replay tooling and incident workflows.

---

## 6) Concrete Codebase Change Targets

### Backend (new/major)

- New integration packages:
  - `backend/app/integrations/fleetbase/*`
  - `backend/app/integrations/traccar/*`
- New sync orchestrator and webhook routes in `backend/app/main.py` or split router modules.
- Model migrations in `backend/alembic/versions/*` for:
  - external IDs,
  - device mappings,
  - sync metadata tables.
- Worker extensions in `backend/app/workers/*` for sync jobs.

### Existing modules to refactor

- `backend/app/crud.py`: remove production dependency on seeding and simulation for live ops path.
- `backend/app/services/prediction.py`: consume real telemetry features.
- `backend/app/services/routing.py`: replace mock route provider logic with external provider adapter.
- `backend/app/services/communication.py`: real provider transports + delivery feedback handling.

### Frontend/Mobile

- Add sync/health indicators and integration-aware error states.
- Extend trip/driver views with source + freshness metadata.
- Add handling for “external data delayed” and “mapping unresolved” states.

---

## 7) Critical Decisions Required (business + technical)

1. **System of record boundaries**
   - Which entity is mastered by Fleetbase vs ShipGen?
2. **Direction of truth on conflicts**
   - Fleetbase-first, ShipGen-first, or hybrid per field?
3. **Telemetry ownership**
   - Does Traccar feed ShipGen directly or via Fleetbase integration layer?
4. **Tenant model**
   - Single org first, then multi-tenant, or multi-tenant from day one?
5. **Near real-time SLA**
   - acceptable lag for sync and tracking updates.

---

## 8) Acceptance Criteria to Close the Main Gaps

Fleetbase integration done when:

- New/updated drivers, vehicles, shipments in Fleetbase appear in ShipGen reliably.
- ShipGen trip status actions propagate back and remain consistent.
- No dependency on mock seed data in production mode.

Traccar integration done when:

- Live device telemetry updates trip location without simulation path.
- Device/vehicle/trip mapping is deterministic and auditable.
- Delay/deviation alerts are derived from real telemetry signals.

Platform readiness done when:

- Idempotent sync with replay/reconciliation is in place.
- Integration health is observable and alertable.
- Tenant/security controls satisfy production requirements.

---

## 9) Bottom Line

The current codebase is a strong MVP orchestration core, but it is still **internally simulated/sandbox-oriented** for data sources and tracking.  
To reach your target product:

- integrate **Fleetbase** for real operational data ingestion + sync authority,
- integrate **Traccar** for real telemetry ingestion + device mapping,
- add reliability, tenancy, and observability layers so automation remains correct at scale.
