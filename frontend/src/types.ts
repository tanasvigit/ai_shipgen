export type Screen = 'dashboard' | 'auto-trip' | 'tracking' | 'alerts'

export type TripStatus = 'created' | 'assigned' | 'approved' | 'in_transit' | 'completed'

export interface Order {
  id: number
  pickupLocation: string
  dropLocation: string
  load: string
  date: string
  status?: string
  createdAt?: string
}

export interface Driver {
  id: number
  name: string
  truckNumber?: string
  availability: boolean
}

export interface Trip {
  id: number
  orderId: number
  driverId: number | null
  status: TripStatus
  currentLat?: number | null
  currentLng?: number | null
  lastUpdated?: string | null
  inTransitStartedAt?: string | null
  order?: Order
  driver?: Driver
}

export interface Alert {
  id: number
  tripId: number
  type: string
  message: string
  resolved: boolean
  createdAt?: string
}

export interface CreateOrderForm {
  pickupLocation: string
  dropLocation: string
  load: string
  date: string
}
