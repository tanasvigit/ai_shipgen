import type { Alert, AuthSession, CreateOrderForm, Driver, FinanceSummary, Order, SystemReadiness, Trip, TripFinance } from '../types'

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
  try {
    const data = (await response.json()) as { detail?: string | { msg?: string }[] }
    if (typeof data.detail === 'string') return data.detail
    if (Array.isArray(data.detail)) {
      return data.detail.map((d) => (typeof d === 'object' && d && 'msg' in d ? String(d.msg) : JSON.stringify(d))).join(', ')
    }
  } catch {
    /* ignore */
  }
  return fallback
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
    throw new Error('fetch failed')
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
  if (!response.ok) throw new Error('create failed')
  return (await response.json()) as CreateOrderResponse
}

export async function approveTrip(tripId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/trips/${tripId}/approve`, { method: 'POST', headers: getAuthHeader() })
  if (!response.ok) throw new Error('approve failed')
}

export async function resolveAlert(alertId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/alerts/${alertId}/resolve`, { method: 'POST', headers: getAuthHeader() })
  if (!response.ok) throw new Error('resolve failed')
}

export async function rejectTrip(tripId: number): Promise<Trip> {
  const response = await fetch(`${API_BASE}/trips/${tripId}/reject`, { method: 'POST', headers: getAuthHeader() })
  if (!response.ok) throw new Error('reject failed')
  return (await response.json()) as Trip
}

export async function regenerateTrip(tripId: number): Promise<Trip> {
  const response = await fetch(`${API_BASE}/trips/${tripId}/regenerate`, { method: 'POST', headers: getAuthHeader() })
  if (!response.ok) throw new Error('regenerate failed')
  return (await response.json()) as Trip
}

export async function rerouteAlert(alertId: number): Promise<Trip> {
  const response = await fetch(`${API_BASE}/alerts/${alertId}/reroute`, { method: 'POST', headers: getAuthHeader() })
  if (!response.ok) throw new Error('reroute failed')
  return (await response.json()) as Trip
}

export async function reassignAlert(alertId: number): Promise<Trip> {
  const response = await fetch(`${API_BASE}/alerts/${alertId}/reassign`, { method: 'POST', headers: getAuthHeader() })
  if (!response.ok) throw new Error('reassign failed')
  return (await response.json()) as Trip
}

export async function fetchTripFinance(tripId: number): Promise<TripFinance> {
  const response = await fetch(`${API_BASE}/trips/${tripId}/finance`, { headers: getAuthHeader() })
  if (!response.ok) throw new Error('finance fetch failed')
  return (await response.json()) as TripFinance
}

export async function fetchFinanceSummary(): Promise<FinanceSummary> {
  const response = await fetch(`${API_BASE}/finance/summary`, { headers: getAuthHeader() })
  if (!response.ok) throw new Error('finance summary failed')
  return (await response.json()) as FinanceSummary
}

export async function ingestRawOrder(rawText: string): Promise<CreateOrderResponse> {
  const response = await fetch(`${API_BASE}/ingestion/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ rawText }),
  })
  if (!response.ok) throw new Error('ingestion failed')
  return (await response.json()) as CreateOrderResponse
}

export async function fetchPublicTracking(token: string): Promise<Trip> {
  const response = await fetch(`${API_BASE}/public/tracking/${token}`)
  if (!response.ok) throw new Error('public tracking failed')
  return (await response.json()) as Trip
}

export async function fetchApprovalMode(): Promise<string> {
  const response = await fetch(`${API_BASE}/settings/approval-mode`, { headers: getAuthHeader() })
  if (!response.ok) throw new Error('approval mode fetch failed')
  const payload = (await response.json()) as { mode: string }
  return payload.mode
}

export async function fetchSystemReadiness(): Promise<SystemReadiness> {
  const response = await fetch(`${API_BASE}/system/readiness`, { headers: getAuthHeader() })
  if (!response.ok) throw new Error('system readiness fetch failed')
  return (await response.json()) as SystemReadiness
}

export async function driverStartTrip(tripId: number): Promise<Trip> {
  const response = await fetch(`${API_BASE}/driver/trips/${tripId}/start`, { method: 'POST', headers: getAuthHeader() })
  if (!response.ok) throw new Error(await readErrorDetail(response, 'Driver start failed'))
  return (await response.json()) as Trip
}

export async function driverReachedPickup(tripId: number): Promise<Trip> {
  const response = await fetch(`${API_BASE}/driver/trips/${tripId}/reached-pickup`, { method: 'POST', headers: getAuthHeader() })
  if (!response.ok) throw new Error(await readErrorDetail(response, 'Reached pickup failed'))
  return (await response.json()) as Trip
}

export async function driverDeliveredTrip(tripId: number): Promise<Trip> {
  const response = await fetch(`${API_BASE}/driver/trips/${tripId}/delivered`, { method: 'POST', headers: getAuthHeader() })
  if (!response.ok) throw new Error(await readErrorDetail(response, 'Mark delivered failed'))
  return (await response.json()) as Trip
}

export async function reportDriverIssue(tripId: number, message: string): Promise<Alert> {
  const response = await fetch(`${API_BASE}/driver/trips/${tripId}/report-issue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ message: message.trim() || 'Driver reported issue' }),
  })
  if (!response.ok) throw new Error(await readErrorDetail(response, 'Report issue failed'))
  return (await response.json()) as Alert
}
