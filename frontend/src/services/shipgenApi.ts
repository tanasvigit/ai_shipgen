import type { Alert, AuthSession, CreateOrderForm, Driver, FinanceSummary, Order, SystemReadiness, Trip, TripFinance } from '../types'
import { readApiError } from './errorUtils'

const API_BASE = 'http://127.0.0.1:8000'
const AUTH_STORAGE_KEY = 'shipgen-auth-session'

interface CreateOrderResponse {
  trip?: {
    id?: number
  }
}

export interface ShipgenSnapshot {
  orders: Order[]
  drivers: Driver[]
  trips: Trip[]
  alerts: Alert[]
}

export async function readErrorDetail(response: Response, fallback: string): Promise<string> {
  const parsed = await readApiError(response, fallback)
  return parsed.message
}

async function requireOk(response: Response, fallback: string): Promise<void> {
  if (response.ok) return
  const parsed = await readApiError(response, fallback)
  throw new Error(parsed.message)
}

function getAuthHeader(): HeadersInit {
  const rawSession = window.localStorage.getItem(AUTH_STORAGE_KEY)
  if (!rawSession) return {}
  try {
    const session = JSON.parse(rawSession) as AuthSession
    return { Authorization: `Bearer ${session.accessToken}` }
  } catch {
    return {}
  }
}

export async function fetchShipgenSnapshot(): Promise<ShipgenSnapshot> {
  const [ordersRes, driversRes, tripsRes, alertsRes] = await Promise.all([
    fetch(`${API_BASE}/orders`, { headers: getAuthHeader() }),
    fetch(`${API_BASE}/drivers`, { headers: getAuthHeader() }),
    fetch(`${API_BASE}/trips`, { headers: getAuthHeader() }),
    fetch(`${API_BASE}/alerts`, { headers: getAuthHeader() }),
  ])

  if (!ordersRes.ok || !driversRes.ok || !tripsRes.ok || !alertsRes.ok) {
    const source = [ordersRes, driversRes, tripsRes, alertsRes].find((res) => !res.ok) ?? ordersRes
    const parsed = await readApiError(source, 'Unable to load dashboard data right now.')
    throw new Error(parsed.message)
  }

  const [orders, drivers, trips, alerts] = await Promise.all([
    ordersRes.json() as Promise<Order[]>,
    driversRes.json() as Promise<Driver[]>,
    tripsRes.json() as Promise<Trip[]>,
    alertsRes.json() as Promise<Alert[]>,
  ])

  return { orders, drivers, trips, alerts }
}

export async function createOrder(payload: CreateOrderForm): Promise<CreateOrderResponse> {
  const response = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(payload),
  })
  await requireOk(response, 'We could not create the order. Please try again.')
  return (await response.json()) as CreateOrderResponse
}

export async function approveTrip(tripId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/trips/${tripId}/approve`, { method: 'POST', headers: getAuthHeader() })
  await requireOk(response, 'We could not start the trip. Please refresh and try again.')
}

export async function resolveAlert(alertId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/alerts/${alertId}/resolve`, { method: 'POST', headers: getAuthHeader() })
  await requireOk(response, 'We could not resolve this alert. Please try again.')
}

export async function rejectTrip(tripId: number): Promise<Trip> {
  const response = await fetch(`${API_BASE}/trips/${tripId}/reject`, { method: 'POST', headers: getAuthHeader() })
  await requireOk(response, 'We could not reject this trip. Please try again.')
  return (await response.json()) as Trip
}

export async function regenerateTrip(tripId: number): Promise<Trip> {
  const response = await fetch(`${API_BASE}/trips/${tripId}/regenerate`, { method: 'POST', headers: getAuthHeader() })
  await requireOk(response, 'We could not regenerate this trip plan. Please try again.')
  return (await response.json()) as Trip
}

export async function rerouteAlert(alertId: number): Promise<Trip> {
  const response = await fetch(`${API_BASE}/alerts/${alertId}/reroute`, { method: 'POST', headers: getAuthHeader() })
  await requireOk(response, 'We could not reroute this trip. Please try again.')
  return (await response.json()) as Trip
}

export async function reassignAlert(alertId: number): Promise<Trip> {
  const response = await fetch(`${API_BASE}/alerts/${alertId}/reassign`, { method: 'POST', headers: getAuthHeader() })
  await requireOk(response, 'We could not reassign the driver. Please try again.')
  return (await response.json()) as Trip
}

export async function fetchTripFinance(tripId: number): Promise<TripFinance> {
  const response = await fetch(`${API_BASE}/trips/${tripId}/finance`, { headers: getAuthHeader() })
  await requireOk(response, 'We could not load trip finance details.')
  return (await response.json()) as TripFinance
}

export async function fetchFinanceSummary(): Promise<FinanceSummary> {
  const response = await fetch(`${API_BASE}/finance/summary`, { headers: getAuthHeader() })
  await requireOk(response, 'We could not load finance summary right now.')
  return (await response.json()) as FinanceSummary
}

export async function ingestRawOrder(rawText: string): Promise<CreateOrderResponse> {
  const response = await fetch(`${API_BASE}/ingestion/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ rawText }),
  })
  await requireOk(response, 'We could not process this message. Please edit and retry.')
  return (await response.json()) as CreateOrderResponse
}

export async function fetchPublicTracking(token: string): Promise<Trip> {
  const response = await fetch(`${API_BASE}/public/tracking/${token}`)
  await requireOk(response, 'Tracking info is unavailable right now.')
  return (await response.json()) as Trip
}

export async function fetchApprovalMode(): Promise<string> {
  const response = await fetch(`${API_BASE}/settings/approval-mode`, { headers: getAuthHeader() })
  await requireOk(response, 'Could not load approval mode settings.')
  const payload = (await response.json()) as { mode: string }
  return payload.mode
}

export async function fetchSystemReadiness(): Promise<SystemReadiness> {
  const response = await fetch(`${API_BASE}/system/readiness`, { headers: getAuthHeader() })
  await requireOk(response, 'Could not load system readiness right now.')
  return (await response.json()) as SystemReadiness
}

export async function driverStartTrip(tripId: number): Promise<Trip> {
  const response = await fetch(`${API_BASE}/driver/trips/${tripId}/start`, { method: 'POST', headers: getAuthHeader() })
  await requireOk(response, 'We could not start this trip. Please try again.')
  return (await response.json()) as Trip
}

export async function driverReachedPickup(tripId: number): Promise<Trip> {
  const response = await fetch(`${API_BASE}/driver/trips/${tripId}/reached-pickup`, { method: 'POST', headers: getAuthHeader() })
  await requireOk(response, 'We could not confirm pickup yet. Please try again.')
  return (await response.json()) as Trip
}

export async function driverDeliveredTrip(tripId: number): Promise<Trip> {
  const response = await fetch(`${API_BASE}/driver/trips/${tripId}/delivered`, { method: 'POST', headers: getAuthHeader() })
  await requireOk(response, 'We could not mark this trip delivered. Please try again.')
  return (await response.json()) as Trip
}

export async function reportDriverIssue(tripId: number, message: string): Promise<Alert> {
  const response = await fetch(`${API_BASE}/driver/trips/${tripId}/report-issue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ message: message.trim() || 'Driver reported issue' }),
  })
  await requireOk(response, 'We could not report this issue. Please try again.')
  return (await response.json()) as Alert
}
