import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import AlertsPage from './pages/AlertsPage'
import AutoTripPage from './pages/AutoTripPage'
import CustomerTrackingPage from './pages/CustomerTrackingPage'
import DashboardPage from './pages/DashboardPage'
import DriverOpsPage from './pages/DriverOpsPage'
import LoginPage from './pages/LoginPage'
import ProfitPage from './pages/ProfitPage'
import TrackingPage from './pages/TrackingPage'
import OrdersPage from './pages/OrdersPage'
import AppLayout from './components/layout/AppLayout'
import useShipgenData from './hooks/useShipgenData'
import { clearSession, getStoredSession, login } from './services/authApi'
import {
  driverDeliveredTrip,
  driverReachedPickup,
  driverStartTrip,
  fetchApprovalMode,
  fetchFinanceSummary,
  fetchPublicTracking,
  fetchSystemReadiness,
  ingestRawOrder,
  reportDriverIssue,
} from './services/shipgenApi'
import type { AuthSession, CreateOrderForm, FinanceSummary, NavItem, Screen, SystemReadiness, Trip } from './types'

const initialOrder: CreateOrderForm = {
  pickupLocation: 'Chicago Logistics Hub',
  dropLocation: 'Port of Savannah',
  load: '14,200 kg / Dry Van',
  date: '2026-04-17',
}

const navItems: NavItem[] = [
  { label: 'Dashboard', screen: 'dashboard', icon: 'grid_view' },
  { label: 'Shipments', screen: 'auto-trip', icon: 'local_shipping' },
  { label: 'Routes', screen: 'tracking', icon: 'route' },
  { label: 'Alerts', screen: 'alerts', icon: 'warning' },
  { label: 'Profit', screen: 'profit', icon: 'payments' },
  { label: 'Driver Ops', screen: 'driver-ops', icon: 'badge' },
]

function AppMain() {
  const [session, setSession] = useState<AuthSession | null>(getStoredSession())
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [publicTrackingToken, setPublicTrackingToken] = useState<string | null>(null)
  const [publicTrackedTrip, setPublicTrackedTrip] = useState<Trip | null>(null)
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null)
  const [approvalMode, setApprovalMode] = useState('manual')
  const [systemReadiness, setSystemReadiness] = useState<SystemReadiness | null>(null)
  const [form, setForm] = useState(initialOrder)
  const [rawOrderText, setRawOrderText] = useState('')
  const {
    orders,
    drivers,
    trips,
    alerts,
    setSelectedTripId,
    error,
    setError,
    isLoading,
    setIsLoading,
    activeTrips,
    completedTrips,
    unresolvedAlerts,
    selectedTrip,
    createOrderAndRefresh,
    approveTripAndRefresh,
    resolveAlertAndRefresh,
    rejectTripAndRefresh,
    regenerateTripAndRefresh,
    rerouteAlertAndRefresh,
    reassignAlertAndRefresh,
    refreshData,
  } = useShipgenData(Boolean(session))
  const roleAwareNavItems =
    session?.role === 'driver' ? navItems.filter((item) => item.screen === 'driver-ops' || item.screen === 'tracking') : navItems

  useEffect(() => {
    if (session?.role === 'driver' && !['tracking', 'driver-ops'].includes(screen)) {
      setScreen('driver-ops')
    }
  }, [screen, session?.role])

  useEffect(() => {
    const path = window.location.pathname
    const tokenPrefix = '/track/'
    if (path.startsWith(tokenPrefix)) {
      const token = path.replace(tokenPrefix, '').trim()
      if (token) {
        setPublicTrackingToken(token)
        fetchPublicTracking(token)
          .then((trip) => setPublicTrackedTrip(trip))
          .catch(() => setPublicTrackedTrip(null))
      }
    }
  }, [])

  useEffect(() => {
    if (!session) return
    if (screen !== 'profit') return
    fetchFinanceSummary()
      .then((summary) => setFinanceSummary(summary))
      .catch(() => setFinanceSummary(null))
  }, [screen, session])

  useEffect(() => {
    if (!session) return
    fetchApprovalMode()
      .then((mode) => setApprovalMode(mode))
      .catch(() => setApprovalMode('manual'))
  }, [session])

  useEffect(() => {
    if (!session) return
    fetchSystemReadiness()
      .then((readiness) => setSystemReadiness(readiness))
      .catch(() => setSystemReadiness(null))
  }, [session])

  async function handleLogin(username: string, password: string) {
    const nextSession = await login(username, password)
    setSession(nextSession)
  }

  async function handleLogout() {
    clearSession()
    setSession(null)
  }

  async function handleCreateOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await createOrderAndRefresh(form)
      setScreen('auto-trip')
    } catch {
      // Errors are surfaced via hook-managed UI state.
    }
  }

  async function handleApproveTrip(tripId = selectedTrip?.id) {
    try {
      await approveTripAndRefresh(tripId)
      setScreen('tracking')
    } catch {
      // Errors are surfaced via hook-managed UI state.
    }
  }

  async function handleResolveAlert(alertId: number) {
    await resolveAlertAndRefresh(alertId)
  }

  async function handleRejectTrip(tripId: number) {
    await rejectTripAndRefresh(tripId)
    setScreen('dashboard')
  }

  async function handleRegenerateTrip(tripId: number) {
    await regenerateTripAndRefresh(tripId)
  }

  async function handleRerouteAlert(alertId: number) {
    await rerouteAlertAndRefresh(alertId)
  }

  async function handleReassignAlert(alertId: number) {
    await reassignAlertAndRefresh(alertId)
  }

  async function handleIngestRawOrder() {
    if (!rawOrderText.trim()) return
    await ingestRawOrder(rawOrderText)
    setRawOrderText('')
    await refreshData()
    setScreen('auto-trip')
  }

  async function handleDriverStart(tripId: number) {
    setIsLoading(true)
    setError('')
    try {
      await driverStartTrip(tripId)
      await refreshData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Start trip failed')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDriverReachedPickup(tripId: number) {
    setIsLoading(true)
    setError('')
    try {
      await driverReachedPickup(tripId)
      await refreshData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reached pickup failed')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDriverDelivered(tripId: number) {
    setIsLoading(true)
    setError('')
    try {
      await driverDeliveredTrip(tripId)
      await refreshData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delivered failed')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDriverReportIssue(tripId: number, message: string) {
    setIsLoading(true)
    setError('')
    try {
      await reportDriverIssue(tripId, message)
      await refreshData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Report issue failed')
    } finally {
      setIsLoading(false)
    }
  }

  if (publicTrackingToken) {
    return <CustomerTrackingPage trip={publicTrackedTrip} token={publicTrackingToken} />
  }

  if (!session) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <AppLayout
      screen={screen}
      navItems={roleAwareNavItems}
      unresolvedAlertsCount={unresolvedAlerts.length}
      onSelectScreen={setScreen}
    >
      <div className="px-8 pt-3 flex justify-end">
        <button onClick={handleLogout} className="text-xs font-semibold text-on-surface-variant hover:text-on-surface underline underline-offset-4">
          Logout ({session.role})
        </button>
      </div>
      {error ? (
        <div className="px-8 pt-4">
          <p className="text-sm font-semibold text-on-error-container bg-error-container px-4 py-3 rounded-xl border border-red-200">{error}</p>
        </div>
      ) : null}
      {systemReadiness &&
      (!systemReadiness.routing.ready || !systemReadiness.nlp.ready || !systemReadiness.communications.whatsappReady || !systemReadiness.communications.smsReady) ? (
        <div className="px-8 pt-4">
          <p className="text-xs font-semibold text-on-error-container bg-error-container/90 px-4 py-2 rounded-lg border border-red-200">
            Degraded mode: sandbox or missing provider credentials detected. Core flows run, but external integrations are not fully live.
          </p>
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
          rawOrderText={rawOrderText}
          setRawOrderText={setRawOrderText}
          handleIngestRawOrder={handleIngestRawOrder}
          approvalMode={approvalMode}
          isLoading={isLoading}
        />
      )}
      {screen === 'orders' && <OrdersPage orders={orders} trips={trips} setScreen={setScreen} setSelectedTripId={setSelectedTripId} />}
      {screen === 'auto-trip' && (
        <AutoTripPage
          selectedTrip={selectedTrip}
          handleApproveTrip={handleApproveTrip}
          handleRejectTrip={handleRejectTrip}
          handleRegenerateTrip={handleRegenerateTrip}
          setScreen={setScreen}
          isLoading={isLoading}
        />
      )}
      {screen === 'tracking' && <TrackingPage selectedTrip={selectedTrip} trips={trips} setSelectedTripId={setSelectedTripId} />}
      {screen === 'alerts' && (
        <AlertsPage
          alerts={alerts}
          unresolvedAlerts={unresolvedAlerts}
          handleResolveAlert={handleResolveAlert}
          handleRerouteAlert={handleRerouteAlert}
          handleReassignAlert={handleReassignAlert}
        />
      )}
      {screen === 'profit' && <ProfitPage trips={trips} summary={financeSummary} />}
      {screen === 'driver-ops' && (
        <DriverOpsPage
          trips={activeTrips}
          selectedTrip={selectedTrip}
          setSelectedTripId={setSelectedTripId}
          onStart={handleDriverStart}
          onReachedPickup={handleDriverReachedPickup}
          onDelivered={handleDriverDelivered}
          onReportIssue={handleDriverReportIssue}
          isLoading={isLoading}
        />
      )}
    </AppLayout>
  )
}

export default AppMain
