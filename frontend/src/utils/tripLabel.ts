import type { Trip } from '../types'

/** Public shipment-style label aligned with driver mobile: order id when present, else trip id. */
export function tripPublicRef(trip: Pick<Trip, 'id' | 'order'>): string {
  const orderId = trip.order?.id
  return `TRK-${orderId ?? trip.id}`
}
