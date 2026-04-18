# ShipGen Driver Mobile App — End-to-End Documentation

This document describes the **ShipGen Driver** Expo app (`driver-mobile/`), how to run it, how it talks to the backend, what drivers can do, and how to produce installable Android builds.

---

## 1. Purpose and stack

- **Role:** Driver-facing MVP: sign in, see **assigned active trips**, run the **start → pickup → delivered** flow, report issues, post **GPS** after starting a trip, and manage **account / sign out**.
- **Stack:** **Expo SDK 54**, React Native **0.81**, React **19**, TypeScript.
- **Key dependencies:** `expo`, `expo-location`, `expo-asset`, `expo-status-bar`, `babel-preset-expo`.

---

## 2. Project layout (conceptual)

| Area | Path | Purpose |
|------|------|--------|
| Entry | `App.tsx` | Login, trip list/picker, tab navigation, trip screens, account |
| API | `src/api/client.ts` | HTTP calls to FastAPI |
| Types | `src/types.ts` | `AuthSession`, `Trip`, `Alert`, profile types |
| Screens | `src/screens/*` | Trip details, navigation, status, **Account** |
| Components | `src/components/*` | Buttons, trip picker, cards |
| Config | `app.json` | Expo app name, Android package, EAS project id, plugins |
| Builds | `eas.json` | EAS Build profiles (preview APK, production AAB) |

---

## 3. Backend connection

All requests use a single base URL in **`src/api/client.ts`**:

```ts
const API_BASE = 'http://<host>:8000'
```

**Important:**

- **`http://10.0.2.2:8000`** — Android **emulator** only (special alias to the dev machine).
- **Physical device** — use your PC’s **LAN IPv4** (e.g. `http://192.168.0.171:8000`) on the **same Wi‑Fi**.
- Start the backend with **`--host 0.0.0.0`** so phones on the LAN can reach it:

  ```bash
  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
  ```

- Allow **Windows Firewall** inbound **TCP 8000** if the phone cannot connect.

---

## 4. Running during development

From `driver-mobile/`:

```bash
npm install
npx expo start
```

Open in **Expo Go** (must match **SDK 54**). Scan the QR code from the Expo CLI or devtools page.

**Health check from the phone’s browser:**

- `http://<your-pc-ip>:8000/health`

---

## 5. Authentication

- **Login:** `POST /auth/login` with username/password.
- **Mobile restriction:** Only **`role === 'driver'`** is accepted after login; admin credentials are rejected with a clear message (drivers should use `driver1`, `driver2`, …).
- **Session:** `accessToken` + `driverId` (and role) kept in memory until **sign out**.

**Default seeded drivers (typical dev DB):**

| Username | Password | Notes |
|----------|----------|--------|
| `driver1` | `driver123` | Usually first driver id after seed |
| `driver2`, `driver3` | `driver123` | If multiple drivers seeded |

`admin` / `admin123` is for **web/ops**, not the driver app login.

---

## 6. Driver workflows

### 6.1 Trips list and picker

- **`GET /trips`** returns only trips **assigned to the logged-in driver** (`driver_id` match).
- Non-completed trips are shown; completed trips are filtered out for the main list.
- **Polling:** trips (and alerts) refresh on an interval (~5 seconds).
- **Multiple trips:** **Trip picker** chooses which trip is active for actions.

### 6.2 Happy path (status machine)

Aligned with backend rules and web **Driver Ops**:

| Trip status | Driver actions |
|-------------|----------------|
| **`assigned`** | **Start trip** → becomes **`in_transit`** |
| **`in_transit`** | **Reached pickup** (sets pickup timestamp), then **Delivered** → trip **completed** |

Endpoints used (via `client.ts`):

- `POST /driver/trips/{id}/start`
- `POST /driver/trips/{id}/reached-pickup`
- `POST /driver/trips/{id}/delivered`
- `POST /driver/trips/{id}/report-issue`
- `POST /trips/{id}/location` (lat/lng)

### 6.3 Location (GPS)

- After **start**, the app can request **foreground location** and post coordinates to **`/trips/{id}/location`**.
- If permission is denied, the trip can still proceed; enable location in system settings to resume updates.

### 6.4 Alerts

- **`GET /alerts`** returns alerts relevant to the driver’s trips (backend filters by trip ids).

### 6.5 Account and sign out

- **Account** tab: **`GET /auth/me`** (username, role, driverId) and **`GET /drivers`** (driver profile row for this user).
- **Pull to refresh** on Account.
- **Sign out** clears local session and returns to the login screen.
- If there are **no active trips**, the bottom tabs remain available so the driver can open **Account** and sign out.

---

## 7. Testing scenarios

### 7.1 One driver, one trip

1. On **web**, log in as **admin** and **create an order** (or use existing assignment).
2. On **phone**, log in as the assigned driver (often **`driver1`**).
3. Run **Start** → **Reached pickup** → **Delivered**; confirm trip disappears from active list when completed.

### 7.2 Two trips, different drivers

- Each driver only sees **their** trips. Test **`driver1`** and **`driver2`** separately (log out and switch accounts, or two devices).

### 7.3 Approval mode

- If **`SHIPGEN_APPROVAL_MODE=rule_auto`** in backend, new trips may jump to **`in_transit`** automatically; the **Start** step may not appear. Use **`manual`** (default) for the full **Start** button path unless you intend auto-start.

---

## 8. Expo / tooling fixes (reference)

Issues you may hit and how they were addressed in this project:

| Issue | Resolution |
|-------|------------|
| Missing **`expo-asset`** | `npx expo install expo-asset` |
| Missing **`babel-preset-expo`** | `npx expo install babel-preset-expo` |
| Expo Go **SDK mismatch** | Project upgraded to **SDK 54** to match store Expo Go |
| **`tsconfig` extends** | Use `"extends": "expo/tsconfig.base.json"` |

---

## 9. Building an APK / AAB (EAS)

**Prerequisites:** Expo account, **`eas-cli`**, project linked to EAS (`eas build:configure`).

**Config:** `driver-mobile/eas.json`

- **`preview`** — **APK** (`android.buildType: "apk"`) for direct install / QA.
- **`production`** — **AAB** for Play Store.

**Commands:**

```bash
cd driver-mobile
eas login
eas build -p android --profile preview
```

After the build, download the artifact from the EAS build page. **Signing:** EAS can generate and store the Android keystore; keep the same package name and keystore for updates.

**`app.json` (Android):**

- `expo.android.package` — application id (e.g. `com.lawde123.shipgendrivermobile`).
- `expo.extra.eas.projectId` — EAS project linkage.

---

## 10. Production considerations

- **API URL:** Replace hardcoded `API_BASE` with **environment-specific** config (e.g. EAS env + `expo-constants`) so QA/production do not point at a developer LAN IP.
- **HTTPS:** Production APIs should use TLS; update cleartext/network security as needed.
- **Versioning:** Bump `expo.version` and Android `versionCode` / Play policies as you release.

---

## 11. Related documentation

- **Web / ops application:** `docs/WEB_APPLICATION.md`
- **Local runbook (backend + frontend commands):** `run.txt` (repo root)
