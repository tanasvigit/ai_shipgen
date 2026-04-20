# Error Messaging Guide

This guide defines the error contract and client usage for ShipGen backend, web, and driver-mobile apps.

## Backend response contract

All API errors now return:

```json
{
  "detail": "Friendly summary for legacy clients",
  "error": {
    "code": "TRIP_INVALID_STATE",
    "message": "Trip cannot be completed from its current status.",
    "category": "business_rule",
    "status": 409,
    "details": {
      "currentStatus": "assigned"
    },
    "requestId": "req_ab12cd34ef56",
    "retryable": false
  }
}
```

- `detail` stays for backwards compatibility.
- `error.code` is stable for client logic.
- `requestId` can be used for support/debugging and appears in `x-request-id` response header.

## Core categories

- `auth`: sign-in/session issues.
- `authorization`: role/access ownership issues.
- `not_found`: missing resources.
- `business_rule`: invalid state transitions and workflow conflicts.
- `validation`: malformed input payloads.
- `system`: unexpected server failures.

## Current key error codes

- `AUTH_INVALID_CREDENTIALS`
- `AUTH_REQUIRED`
- `AUTH_INVALID_TOKEN`
- `AUTH_FORBIDDEN`
- `TRACKING_INVALID_TOKEN`
- `DRIVER_PROFILE_MISSING`
- `DRIVER_NOT_ASSIGNED`
- `ORDER_NOT_FOUND`
- `TRIP_NOT_FOUND`
- `ALERT_NOT_FOUND`
- `TRIP_INVALID_STATE`
- `VALIDATION_ERROR`
- `INTERNAL_ERROR`

## Web client behavior

- `frontend/src/services/errorUtils.ts` normalizes API/network errors.
- `frontend/src/services/shipgenApi.ts` and `frontend/src/services/authApi.ts` use normalized, user-friendly messages.
- `frontend/src/hooks/useShipgenData.ts` and `frontend/src/AppMain.tsx` surface clear action guidance instead of technical text.

## Mobile client behavior

- `driver-mobile/src/api/errorUtils.ts` parses backend envelope and normalizes offline states.
- `driver-mobile/src/api/client.ts` uses friendly fallback copy per action.
- `driver-mobile/App.tsx` and `driver-mobile/src/screens/AccountScreen.tsx` show clearer messaging and less technical wording.

## Testing

- Backend error envelope coverage: `backend/tests/test_error_contract.py`.
- Existing driver-access HTTP tests were updated to assert structured error codes.
