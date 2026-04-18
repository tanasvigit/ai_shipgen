import type { Alert, AuthMe, AuthSession, DriverProfile, Trip } from '../types'

const API_BASE = 'http://192.168.0.171:8000'

function authHeader(session: AuthSession): Record<string, string> {
  return { Authorization: `Bearer ${session.accessToken}` }
}

async function requireOk(response: Response, fallback: string): Promise<void> {
  if (response.ok) return
  let detail = fallback
  try {
    const data = (await response.json()) as { detail?: string | { msg?: string }[] }
    if (typeof data.detail === 'string') {
      detail = data.detail
    } else if (Array.isArray(data.detail)) {
      detail = data.detail.map((d) => (typeof d === 'object' && d && 'msg' in d ? String(d.msg) : JSON.stringify(d))).join(', ')
    }
  } catch {
    /* ignore parse errors */
  }
  throw new Error(detail)
}

export async function fetchAlerts(session: AuthSession): Promise<Alert[]> {
  const response = await fetch(`${API_BASE}/alerts`, { headers: authHeader(session) })
  await requireOk(response, 'Failed to load alerts')
  return (await response.json()) as Alert[]
}

export async function login(username: string, password: string): Promise<AuthSession> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  await requireOk(response, 'Invalid credentials')
  return (await response.json()) as AuthSession
}

export async function fetchAuthMe(session: AuthSession): Promise<AuthMe> {
  const response = await fetch(`${API_BASE}/auth/me`, { headers: authHeader(session) })
  await requireOk(response, 'Failed to load account')
  return (await response.json()) as AuthMe
}

export async function fetchMyDriverProfile(session: AuthSession): Promise<DriverProfile | null> {
  const response = await fetch(`${API_BASE}/drivers`, { headers: authHeader(session) })
  await requireOk(response, 'Failed to load driver profile')
  const list = (await response.json()) as DriverProfile[]
  return list[0] ?? null
}

export async function fetchDriverTrips(session: AuthSession): Promise<Trip[]> {
  const response = await fetch(`${API_BASE}/trips`, { headers: authHeader(session) })
  await requireOk(response, 'Failed to load trips')
  return (await response.json()) as Trip[]
}

export async function fetchTrip(session: AuthSession, tripId: number): Promise<Trip> {
  const response = await fetch(`${API_BASE}/trips/${tripId}`, { headers: authHeader(session) })
  await requireOk(response, 'Failed to load trip details')
  return (await response.json()) as Trip
}

export async function driverStartTrip(session: AuthSession, tripId: number): Promise<Trip> {
  const response = await fetch(`${API_BASE}/driver/trips/${tripId}/start`, {
    method: 'POST',
    headers: authHeader(session),
  })
  await requireOk(response, 'Failed to start trip')
  return (await response.json()) as Trip
}

export async function driverReachedPickup(session: AuthSession, tripId: number): Promise<Trip> {
  const response = await fetch(`${API_BASE}/driver/trips/${tripId}/reached-pickup`, {
    method: 'POST',
    headers: authHeader(session),
  })
  await requireOk(response, 'Failed to mark reached pickup')
  return (await response.json()) as Trip
}

export async function driverDelivered(session: AuthSession, tripId: number): Promise<Trip> {
  const response = await fetch(`${API_BASE}/driver/trips/${tripId}/delivered`, {
    method: 'POST',
    headers: authHeader(session),
  })
  await requireOk(response, 'Failed to mark delivered')
  return (await response.json()) as Trip
}

export async function reportDriverIssue(session: AuthSession, tripId: number, message: string): Promise<Alert> {
  const response = await fetch(`${API_BASE}/driver/trips/${tripId}/report-issue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader(session) },
    body: JSON.stringify({ message }),
  })
  await requireOk(response, 'Failed to report issue')
  return (await response.json()) as Alert
}

export async function updateTripLocation(session: AuthSession, tripId: number, lat: number, lng: number): Promise<Trip> {
  const response = await fetch(`${API_BASE}/trips/${tripId}/location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader(session) },
    body: JSON.stringify({ lat, lng }),
  })
  await requireOk(response, 'Failed to update location')
  return (await response.json()) as Trip
}
