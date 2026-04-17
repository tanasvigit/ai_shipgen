import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import AlertsPage from './pages/AlertsPage'
import AutoTripPage from './pages/AutoTripPage'
import DashboardPage from './pages/DashboardPage'
import TrackingPage from './pages/TrackingPage'
import type { Alert, CreateOrderForm, Driver, Order, Screen, Trip } from './types'

const API_BASE = 'http://127.0.0.1:8000'
const POLL_MS = 5000

const initialOrder: CreateOrderForm = {
  pickupLocation: 'Chicago Logistics Hub',
  dropLocation: 'Port of Savannah',
  load: '14,200 kg / Dry Van',
  date: '2026-04-17',
}

const navItems: Array<{ label: string; screen: Screen; icon: string }> = [
  { label: 'Dashboard', screen: 'dashboard', icon: 'grid_view' },
  { label: 'Shipments', screen: 'auto-trip', icon: 'local_shipping' },
  { label: 'Routes', screen: 'tracking', icon: 'route' },
  { label: 'Alerts', screen: 'alerts', icon: 'warning' },
]

interface CreateOrderPayload {
  trip?: {
    id?: number
  }
}

function AppMain() {
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [orders, setOrders] = useState<Order[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null)
  const [form, setForm] = useState(initialOrder)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const activeTrips = useMemo(() => trips.filter((trip) => trip.status !== 'completed'), [trips])
  const completedTrips = useMemo(() => trips.filter((trip) => trip.status === 'completed'), [trips])
  const unresolvedAlerts = useMemo(() => alerts.filter((alert) => !alert.resolved), [alerts])
  const selectedTrip = useMemo(() => {
    if (trips.length === 0) return null
    return trips.find((trip) => trip.id === selectedTripId) || trips[0]
  }, [selectedTripId, trips])

  async function fetchAll({ preserveError = false }: { preserveError?: boolean } = {}) {
    if (!preserveError) setError('')
    try {
      const [ordersRes, driversRes, tripsRes, alertsRes] = await Promise.all([
        fetch(`${API_BASE}/orders`),
        fetch(`${API_BASE}/drivers`),
        fetch(`${API_BASE}/trips`),
        fetch(`${API_BASE}/alerts`),
      ])
      if (!ordersRes.ok || !driversRes.ok || !tripsRes.ok || !alertsRes.ok) throw new Error('fetch failed')
      const [ordersData, driversData, tripsData, alertsData] = await Promise.all([
        ordersRes.json() as Promise<Order[]>,
        driversRes.json() as Promise<Driver[]>,
        tripsRes.json() as Promise<Trip[]>,
        alertsRes.json() as Promise<Alert[]>,
      ])
      setOrders(ordersData)
      setDrivers(driversData)
      setTrips(tripsData)
      setAlerts(alertsData)
      if (tripsData.length > 0) {
        setSelectedTripId((previous) => (previous && tripsData.some((trip) => trip.id === previous) ? previous : tripsData[0].id))
      } else {
        setSelectedTripId(null)
      }
    } catch {
      setError('Unable to reach backend. Start FastAPI on :8000.')
    }
  }

  useEffect(() => {
    fetchAll()
    const timer = window.setInterval(() => fetchAll({ preserveError: true }), POLL_MS)
    return () => window.clearInterval(timer)
  }, [])

  async function handleCreateOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!response.ok) throw new Error('create failed')
      const payload = (await response.json()) as CreateOrderPayload
      await fetchAll()
      if (payload.trip?.id) setSelectedTripId(payload.trip.id)
      setScreen('auto-trip')
    } catch {
      setError('Could not create order.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleApproveTrip(tripId = selectedTrip?.id) {
    if (!tripId) return
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE}/trips/${tripId}/approve`, { method: 'POST' })
      if (!response.ok) throw new Error('approve failed')
      await fetchAll()
      setScreen('tracking')
    } catch {
      setError('Approve failed.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResolveAlert(alertId: number) {
    try {
      const response = await fetch(`${API_BASE}/alerts/${alertId}/resolve`, { method: 'POST' })
      if (!response.ok) throw new Error('resolve failed')
      await fetchAll()
    } catch {
      setError('Could not resolve alert.')
    }
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <aside className="h-screen w-64 fixed left-0 top-0 z-50 bg-[#f2f4f6] flex flex-col p-6 gap-2 font-['Manrope'] font-medium">
        <div className="mb-8 px-2 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-sm">local_shipping</span>
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tighter text-[#0f172a] leading-none">ShipGen</h1>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant opacity-70">Logistics Intelligence</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const active = screen === item.screen
            return (
              <button key={item.label} onClick={() => setScreen(item.screen)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 text-left ${active ? 'bg-[#ffffff] text-[#0f172a] shadow-sm font-bold' : 'text-[#45464d] hover:text-[#0f172a] hover:bg-[#e0e3e5]'}`}>
                <span className="material-symbols-outlined">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
        <div className="mt-auto space-y-2 pt-6 border-t border-black/5">
          <div className="text-[11px] text-on-surface-variant">Live polling every 5s</div>
          <div className="text-[11px] text-on-surface-variant">Alerts: {unresolvedAlerts.length}</div>
        </div>
      </aside>

      <main className="ml-64 min-h-screen flex flex-col">
        <header className="sticky top-0 w-full z-40 h-16 bg-[#f7f9fb]/70 backdrop-blur-xl flex items-center justify-between px-8 border-b border-black/5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] font-['Manrope'] text-sm tracking-wide">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <span className="font-black text-lg tracking-tight text-[#000000]">ShipGen AI</span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-on-tertiary-container/10 rounded-full border border-on-tertiary-container/20">
                <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container animate-pulse" />
                <span className="text-[10px] font-bold text-on-tertiary-container uppercase tracking-tight">AI Mode Active</span>
              </div>
            </div>
          </div>
        </header>

        {error ? (
          <div className="px-8 pt-4">
            <p className="text-sm font-semibold text-on-error-container bg-error-container px-4 py-3 rounded-xl border border-red-200">{error}</p>
          </div>
        ) : null}

        {screen === 'dashboard' && (
          <DashboardPage
            orders={orders}
            activeTrips={activeTrips}
            completedTrips={completedTrips}
            unresolvedAlerts={unresolvedAlerts}
            trips={trips}
            drivers={drivers}
            setScreen={setScreen}
            setSelectedTripId={setSelectedTripId}
            handleApproveTrip={handleApproveTrip}
            form={form}
            setForm={setForm}
            handleCreateOrder={handleCreateOrder}
            isLoading={isLoading}
          />
        )}
        {screen === 'auto-trip' && <AutoTripPage selectedTrip={selectedTrip} handleApproveTrip={handleApproveTrip} setScreen={setScreen} isLoading={isLoading} />}
        {screen === 'tracking' && <TrackingPage selectedTrip={selectedTrip} trips={trips} setSelectedTripId={setSelectedTripId} />}
        {screen === 'alerts' && <AlertsPage alerts={alerts} unresolvedAlerts={unresolvedAlerts} handleResolveAlert={handleResolveAlert} />}
      </main>
    </div>
  )
}

export default AppMain
