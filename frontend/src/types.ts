export type Screen = 'dashboard' | 'orders' | 'auto-trip' | 'tracking' | 'alerts' | 'profit' | 'driver-ops' | 'customer-tracking'

export interface NavItem {
  label: string
  screen: Screen
  icon: string
}

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
  rating?: number
}

export interface Vehicle {
  id: number
  name: string
  type: string
  capacityKg: number
  available: boolean
}

export interface TripFinance {
  fuelCost: number
  driverCost: number
  tollCost: number
  miscCost: number
  revenue: number
  profit: number
}

export interface Trip {
  id: number
  orderId: number
  driverId: number | null
  vehicleId?: number | null
  status: TripStatus
  currentLat?: number | null
  currentLng?: number | null
  lastUpdated?: string | null
  inTransitStartedAt?: string | null
  primaryRoute?: Record<string, unknown> | null
  alternateRoutes?: Array<Record<string, unknown>>
  eta?: string | null
  delayRisk?: number | null
  etaConfidence?: number | null
  publicTrackingToken?: string
  pickupReachedAt?: string | null
  finance?: TripFinance
  order?: Order
  driver?: Driver
  vehicle?: Vehicle
}

export interface Alert {
  id: number
  tripId: number
  type: string
  message: string
  recommendedAction?: 'reroute' | 'reassign' | string | null
  reason?: string | null
  resolved: boolean
  createdAt?: string
}

export interface CreateOrderForm {
  pickupLocation: string
  dropLocation: string
  load: string
  date: string
}

export interface AuthSession {
  accessToken: string
  role: string
}

export interface FinanceSummary {
  tripCount: number
  totalRevenue: number
  totalCost: number
  totalProfit: number
  avgProfitPerTrip: number
}

export interface SystemReadiness {
  environment: string
  communications: {
    provider: string
    whatsappReady: boolean
    smsReady: boolean
    pushReady: boolean
  }
  routing: {
    provider: string
    ready: boolean
  }
  nlp: {
    provider: string
    ready: boolean
  }
  queue: {
    backend: string
    redisConfigured: boolean
  }
}
