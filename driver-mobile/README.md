# ShipGen Driver Mobile (Android-first MVP)

## Setup

1. Install dependencies:
   - `npm install`
2. Start Expo:
   - `npx expo start`
3. Run on Android emulator/device.

## Env

Set API base in app code (`src/api/client.ts`) if backend host differs.

Default:

- `http://10.0.2.2:8000` for Android emulator

## Location (GPS)

After **Start Trip**, the app requests foreground location permission and posts coordinates to `POST /trips/{id}/location`. Grant permission for live sync; if denied, the trip still starts but GPS is not sent until you enable permission in system settings.

## MVP Screens

- Login
- Trip Details (aligned with web: start when `assigned`, navigation when allowed)
- Navigation (confirm pickup / mark delivered / report issue; arrival time from trip `eta` when present)
- Status Update (state-gated actions; pickup “completed” row is UI-only until backend adds a step)

## Web parity

Driver actions match the web **Driver Ops** rules: `Start` only in `assigned`; `Reached Pickup` and `Delivered` only in `in_transit`. Backend errors (e.g. `409`) are surfaced from API `detail` when available.
