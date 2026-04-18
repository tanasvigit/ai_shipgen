import type { Order, Trip } from './types'

/** Same rule as web [tripPublicRef]: order id when present, else trip id. */
export function tripPublicRef(trip: Pick<Trip, 'id' | 'order'>): string {
  return `TRK-${trip.order?.id ?? trip.id}`
}

export function formatEtaLabel(eta?: string | null): string {
  if (!eta) return 'Pending'
  const d = new Date(eta)
  if (Number.isNaN(d.getTime())) return `ETA: ${eta}`
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  const day = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  return `ETA: ${time} · ${day}`
}

export function formatPickupWindow(order?: Order): string {
  if (!order?.date) return 'See dispatch for pickup window'
  return `Scheduled: ${order.date}`
}

export function parseLoadDisplay(order?: Order, vehicleType?: string | null): { primary: string; secondary: string } {
  if (!order?.load?.trim()) {
    return { primary: '—', secondary: vehicleType?.trim() || '—' }
  }
  const parts = order.load.split('|').map((p) => p.trim())
  if (parts.length >= 2) {
    return { primary: parts[0] || '—', secondary: parts[1] || vehicleType || '—' }
  }
  return { primary: order.load.trim(), secondary: vehicleType?.trim() || 'Dry Van' }
}

export function vehicleCapacityLabel(trip: Trip): string {
  const kg = trip.vehicle?.capacityKg
  if (kg == null) return '—'
  const lbs = Math.round(kg * 2.20462)
  return `Cap: ${lbs.toLocaleString()} lbs`
}

export function navigationDistanceLabel(trip: Trip): string {
  const route = trip.primaryRoute
  if (route && typeof route === 'object' && 'distanceKm' in route) {
    const km = (route as { distanceKm: unknown }).distanceKm
    if (typeof km === 'number' && Number.isFinite(km)) {
      return `${km.toFixed(1)} km`
    }
  }
  return '4.2 km'
}
