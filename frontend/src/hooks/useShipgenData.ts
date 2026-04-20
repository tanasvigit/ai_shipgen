import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Alert, CreateOrderForm, Driver, Order, Trip } from '../types'
import { userMessageFromUnknown } from '../services/errorUtils'
import { approveTrip, createOrder, fetchShipgenSnapshot, reassignAlert, regenerateTrip, rejectTrip, rerouteAlert, resolveAlert } from '../services/shipgenApi'

const POLL_MS = 5000
const AUTH_STORAGE_KEY = 'shipgen-auth-session'

function useShipgenData(enabled = true) {
  const [orders, setOrders] = useState<Order[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const refreshData = useCallback(async (preserveError = false) => {
    if (!enabled) return
    const hasSession = Boolean(window.localStorage.getItem(AUTH_STORAGE_KEY))
    if (!hasSession) return
    if (!preserveError) setError('')
    try {
      const snapshot = await fetchShipgenSnapshot()
      setOrders(snapshot.orders)
      setDrivers(snapshot.drivers)
      setTrips(snapshot.trips)
      setAlerts(snapshot.alerts)
      if (snapshot.trips.length > 0) {
        setSelectedTripId((previous) =>
          previous && snapshot.trips.some((trip) => trip.id === previous) ? previous : snapshot.trips[0].id,
        )
      } else {
        setSelectedTripId(null)
      }
    } catch (err) {
      setError(userMessageFromUnknown(err, 'We could not refresh data right now. Please try again.'))
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    refreshData()
    const timer = window.setInterval(() => refreshData(true), POLL_MS)
    return () => window.clearInterval(timer)
  }, [enabled, refreshData])

  const createOrderAndRefresh = useCallback(
    async (form: CreateOrderForm) => {
      setIsLoading(true)
      setError('')
      try {
        const payload = await createOrder(form)
        await refreshData()
        if (payload.trip?.id) setSelectedTripId(payload.trip.id)
        return payload
      } catch (err) {
        const message = userMessageFromUnknown(err, 'We could not create the order. Please try again.')
        setError(message)
        throw new Error(message)
      } finally {
        setIsLoading(false)
      }
    },
    [refreshData],
  )

  const approveTripAndRefresh = useCallback(
    async (tripId?: number) => {
      if (!tripId) return
      setIsLoading(true)
      setError('')
      try {
        await approveTrip(tripId)
        await refreshData()
      } catch (err) {
        const message = userMessageFromUnknown(err, 'We could not start this trip. Please try again.')
        setError(message)
        throw new Error(message)
      } finally {
        setIsLoading(false)
      }
    },
    [refreshData],
  )

  const resolveAlertAndRefresh = useCallback(
    async (alertId: number) => {
      try {
        await resolveAlert(alertId)
        await refreshData()
      } catch (err) {
        const message = userMessageFromUnknown(err, 'We could not resolve this alert. Please try again.')
        setError(message)
        throw new Error(message)
      }
    },
    [refreshData],
  )

  const rejectTripAndRefresh = useCallback(
    async (tripId: number) => {
      await rejectTrip(tripId)
      await refreshData()
    },
    [refreshData],
  )

  const regenerateTripAndRefresh = useCallback(
    async (tripId: number) => {
      await regenerateTrip(tripId)
      await refreshData()
    },
    [refreshData],
  )

  const rerouteAlertAndRefresh = useCallback(
    async (alertId: number) => {
      await rerouteAlert(alertId)
      await refreshData()
    },
    [refreshData],
  )

  const reassignAlertAndRefresh = useCallback(
    async (alertId: number) => {
      await reassignAlert(alertId)
      await refreshData()
    },
    [refreshData],
  )

  const activeTrips = useMemo(() => trips.filter((trip) => trip.status !== 'completed'), [trips])
  const completedTrips = useMemo(() => trips.filter((trip) => trip.status === 'completed'), [trips])
  const unresolvedAlerts = useMemo(() => alerts.filter((alert) => !alert.resolved), [alerts])
  const selectedTrip = useMemo(() => {
    if (trips.length === 0) return null
    return trips.find((trip) => trip.id === selectedTripId) || trips[0]
  }, [selectedTripId, trips])

  return {
    orders,
    drivers,
    trips,
    alerts,
    selectedTripId,
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
  }
}

export default useShipgenData
