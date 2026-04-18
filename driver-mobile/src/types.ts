export interface AuthSession {
  accessToken: string
  role: string
  driverId?: number | null
}

/** GET /auth/me */
export interface AuthMe {
  username: string
  role: string
  driverId: number | null
}

/** GET /drivers (driver role returns own profile only) */
export interface DriverProfile {
  id: number
  name: string
  currentLocation: string
  availability: boolean
  rating: number
}

export interface Order {
  id: number
  pickupLocation: string
  dropLocation: string
  load: string
  date: string
}

export interface Trip {
  id: number
  orderId: number
  driverId: number | null
  status: string
  currentLat?: number | null
  currentLng?: number | null
  primaryRoute?: Record<string, unknown> | null
  eta?: string | null
  delayRisk?: number | null
  pickupReachedAt?: string | null
  lastUpdated?: string | null
  inTransitStartedAt?: string | null
  order?: Order
  vehicle?: {
    id: number
    name: string
    type: string
    capacityKg: number
  } | null
}

export interface Alert {
  id: number
  tripId: number
  type: string
  message: string
  resolved: boolean
}
