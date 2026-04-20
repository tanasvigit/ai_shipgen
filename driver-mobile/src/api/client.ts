import type { Alert, AuthMe, AuthSession, DriverProfile, Trip } from '../types'
import { parseApiError } from './errorUtils'

const API_BASE = 'http://192.168.0.171:8000'

function authHeader(session: AuthSession): Record<string, string> {
  return { Authorization: `Bearer ${session.accessToken}` }
}

async function requireOk(response: Response, fallback: string): Promise<void> {
  if (response.ok) return
  throw await parseApiError(response, fallback)
}

export async function fetchAlerts(session: AuthSession): Promise<Alert[]> {
  const response = await fetch(`${API_BASE}/alerts`, { headers: authHeader(session) })
  await requireOk(response, 'We could not load alerts right now.')
  return (await response.json()) as Alert[]
}

export async function login(username: string, password: string): Promise<AuthSession> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  await requireOk(response, 'Sign-in failed. Check your username and password.')
  return (await response.json()) as AuthSession
}

export async function fetchAuthMe(session: AuthSession): Promise<AuthMe> {
  const response = await fetch(`${API_BASE}/auth/me`, { headers: authHeader(session) })
  await requireOk(response, 'We could not load your account right now.')
  return (await response.json()) as AuthMe
}

export async function fetchMyDriverProfile(session: AuthSession): Promise<DriverProfile | null> {
  const response = await fetch(`${API_BASE}/drivers`, { headers: authHeader(session) })
  await requireOk(response, 'We could not load your driver profile right now.')
  const list = (await response.json()) as DriverProfile[]
  return list[0] ?? null
}

export async function fetchDriverTrips(session: AuthSession): Promise<Trip[]> {
  const response = await fetch(`${API_BASE}/trips`, { headers: authHeader(session) })
  await requireOk(response, 'We could not load your trips right now.')
  return (await response.json()) as Trip[]
}

export async function fetchTrip(session: AuthSession, tripId: number): Promise<Trip> {
  const response = await fetch(`${API_BASE}/trips/${tripId}`, { headers: authHeader(session) })
  await requireOk(response, 'We could not load trip details right now.')
  return (await response.json()) as Trip
}

export async function driverStartTrip(session: AuthSession, tripId: number): Promise<Trip> {
  const response = await fetch(`${API_BASE}/driver/trips/${tripId}/start`, {
    method: 'POST',
    headers: authHeader(session),
  })
  await requireOk(response, 'We could not start this trip. Please try again.')
  return (await response.json()) as Trip
}

export async function driverReachedPickup(session: AuthSession, tripId: number): Promise<Trip> {
  const response = await fetch(`${API_BASE}/driver/trips/${tripId}/reached-pickup`, {
    method: 'POST',
    headers: authHeader(session),
  })
  await requireOk(response, 'We could not confirm pickup yet. Please try again.')
  return (await response.json()) as Trip
}

export async function driverDelivered(session: AuthSession, tripId: number): Promise<Trip> {
  const response = await fetch(`${API_BASE}/driver/trips/${tripId}/delivered`, {
    method: 'POST',
    headers: authHeader(session),
  })
  await requireOk(response, 'We could not mark this trip delivered. Please try again.')
  return (await response.json()) as Trip
}

export async function reportDriverIssue(session: AuthSession, tripId: number, message: string): Promise<Alert> {
  const response = await fetch(`${API_BASE}/driver/trips/${tripId}/report-issue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader(session) },
    body: JSON.stringify({ message }),
  })
  await requireOk(response, 'We could not report this issue. Please try again.')
  return (await response.json()) as Alert
}

export async function updateTripLocation(session: AuthSession, tripId: number, lat: number, lng: number): Promise<Trip> {
  const response = await fetch(`${API_BASE}/trips/${tripId}/location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader(session) },
    body: JSON.stringify({ lat, lng }),
  })
  await requireOk(response, 'We could not update your location. Please try again.')
  return (await response.json()) as Trip
}
