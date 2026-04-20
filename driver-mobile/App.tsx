import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert as RNAlert, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native'
import {
  driverDelivered,
  driverReachedPickup,
  driverStartTrip,
  fetchAlerts,
  fetchDriverTrips,
  fetchTrip,
  login as apiLogin,
  reportDriverIssue,
  updateTripLocation,
} from './src/api/client'
import { DEFAULT_ERROR_AUTO_HIDE_MS, isBlockingMessage, openIssueSummary, toFriendlyMessage } from './src/api/errorUtils'
import AppButton from './src/components/AppButton'
import TripPicker from './src/components/TripPicker'
import { tripPublicRef } from './src/formatTrip'
import { getCurrentLatLng } from './src/location'
import AccountScreen from './src/screens/AccountScreen'
import TripDetailsScreen from './src/screens/TripDetailsScreen'
import NavigationScreen from './src/screens/NavigationScreen'
import StatusUpdateScreen from './src/screens/StatusUpdateScreen'
import type { Alert as TripAlert, AuthSession, Trip } from './src/types'

type DriverScreen = 'trip-details' | 'navigation' | 'status-update' | 'account'

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [username, setUsername] = useState('driver1')
  const [password, setPassword] = useState('driver123')
  const [trips, setTrips] = useState<Trip[]>([])
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null)
  const [activeScreen, setActiveScreen] = useState<DriverScreen>('trip-details')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [alerts, setAlerts] = useState<TripAlert[]>([])

  const selectedTrip = useMemo(() => trips.find((trip) => trip.id === selectedTripId) ?? null, [selectedTripId, trips])

  const canStart = selectedTrip?.status === 'assigned'
  const canReachedPickup = selectedTrip?.status === 'in_transit'
  const canMarkDelivered = selectedTrip?.status === 'in_transit'
  const canOpenNavigation = selectedTrip?.status === 'assigned' || selectedTrip?.status === 'in_transit'

  const suggestionText = useMemo(() => {
    if (!selectedTrip) return ''
    if (selectedTrip.status === 'assigned') {
      return "Start the trip when you're ready to depart."
    }
    if (selectedTrip.status === 'in_transit') {
      if (!selectedTrip.pickupReachedAt) {
        return 'If you reached pickup, confirm it now.'
      }
      return 'Proceed to destination; mark delivered when the drop-off is complete.'
    }
    return 'Follow dispatch instructions.'
  }, [selectedTrip])

  const exceptionSummary = useMemo(() => {
    if (!selectedTrip) return null
    const parts: string[] = []
    if ((selectedTrip.delayRisk ?? 0) >= 0.6) {
      parts.push(`Delay risk is ${Math.round((selectedTrip.delayRisk ?? 0) * 100)}%. Check route and contact operations if needed.`)
    }
    const issueSummary = openIssueSummary(alerts, selectedTrip.id)
    if (issueSummary) parts.push(issueSummary)
    return parts.length ? parts.join(' ') : null
  }, [selectedTrip, alerts])

  async function refreshTrips(currentSession: AuthSession) {
    const [nextTrips, nextAlerts] = await Promise.all([
      fetchDriverTrips(currentSession),
      fetchAlerts(currentSession).catch(() => [] as TripAlert[]),
    ])
    setAlerts(nextAlerts)
    const activeTrips = nextTrips.filter((trip) => trip.status !== 'completed')
    setTrips(activeTrips)
    const selected = selectedTripId && activeTrips.some((trip) => trip.id === selectedTripId) ? selectedTripId : activeTrips[0]?.id ?? null
    setSelectedTripId(selected)
    if (selected) {
      const latest = await fetchTrip(currentSession, selected)
      setTrips((prev) => prev.map((trip) => (trip.id === latest.id ? latest : trip)))
    }
  }

  async function selectTripById(tripId: number) {
    if (!session) return
    setActiveScreen('trip-details')
    setSelectedTripId(tripId)
    setError('')
    try {
      const latest = await fetchTrip(session, tripId)
      setTrips((prev) => prev.map((trip) => (trip.id === latest.id ? latest : trip)))
      const nextAlerts = await fetchAlerts(session).catch(() => [] as TripAlert[])
      setAlerts(nextAlerts)
    } catch (err) {
      setError(toFriendlyMessage(err, 'We could not load this trip. Please try again.'))
    }
  }

  useEffect(() => {
    if (!session) return
    refreshTrips(session).catch((err) => setError(toFriendlyMessage(err, 'We could not load trips right now.')))
    const timer = setInterval(() => {
      refreshTrips(session).catch(() => null)
    }, 5000)
    return () => clearInterval(timer)
  }, [session])

  useEffect(() => {
    if (session && trips.length === 0 && activeScreen !== 'account') {
      setActiveScreen('trip-details')
    }
  }, [session, trips.length, activeScreen])

  useEffect(() => {
    if (!error) return
    if (isBlockingMessage(error)) return
    const timer = setTimeout(() => setError(''), DEFAULT_ERROR_AUTO_HIDE_MS)
    return () => clearTimeout(timer)
  }, [error])

  function performLogout() {
    setSession(null)
    setTrips([])
    setSelectedTripId(null)
    setAlerts([])
    setActiveScreen('trip-details')
    setError('')
  }

  async function handleLogin() {
    setLoading(true)
    setError('')
    try {
      const nextSession = await apiLogin(username, password)
      if (nextSession.role !== 'driver') {
        setError('Please sign in with a driver account.')
        return
      }
      setSession(nextSession)
      setActiveScreen('trip-details')
    } catch (err) {
      setError(toFriendlyMessage(err, 'Sign-in failed. Please check your credentials.'))
    } finally {
      setLoading(false)
    }
  }

  async function runMutation(action: 'start' | 'pickup' | 'delivered' | 'issue') {
    if (!session || !selectedTrip) return
    setLoading(true)
    setError('')
    try {
      if (action === 'start') await driverStartTrip(session, selectedTrip.id)
      if (action === 'pickup') await driverReachedPickup(session, selectedTrip.id)
      if (action === 'delivered') await driverDelivered(session, selectedTrip.id)
      if (action === 'issue') await reportDriverIssue(session, selectedTrip.id, 'Driver reported issue from mobile workflow')
      await refreshTrips(session)
    } catch (err) {
      setError(toFriendlyMessage(err, 'We could not complete that action. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  async function postLocationFromDevice() {
    if (!session || !selectedTrip) return
    const coords = await getCurrentLatLng()
    if (!coords) {
      setError('Location permission is off. Enable it to share live location.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await updateTripLocation(session, selectedTrip.id, coords.lat, coords.lng)
      await refreshTrips(session)
    } catch (err) {
      setError(toFriendlyMessage(err, 'We could not update your location. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  async function handleStartTripAndNavigate() {
    if (!session || !selectedTrip || selectedTrip.status !== 'assigned') return
    setLoading(true)
    setError('')
    try {
      await driverStartTrip(session, selectedTrip.id)
      await refreshTrips(session)
    } catch (err) {
      setError(toFriendlyMessage(err, 'We could not start this trip. Please try again.'))
      return
    } finally {
      setLoading(false)
    }
    await postLocationFromDevice()
    setActiveScreen('navigation')
  }

  function onTabPress(label: string) {
    if (label === 'TRIPS') {
      setActiveScreen('trip-details')
      return
    }
    if (label === 'MAP') {
      if (!selectedTrip) {
        RNAlert.alert('No active trip', 'When operations assigns a trip, open the Map tab for navigation actions.')
        return
      }
      setActiveScreen('navigation')
      return
    }
    if (label === 'ACCOUNT') {
      setActiveScreen('account')
      return
    }
    RNAlert.alert('Coming soon', `${label} will be available in a future release.`)
  }

  const tabTripsActive = activeScreen === 'trip-details' || activeScreen === 'status-update'
  const tabMapActive = activeScreen === 'navigation'
  const tabAccountActive = activeScreen === 'account'

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text style={styles.title}>ShipGen Driver</Text>
          <TextInput value={username} onChangeText={setUsername} placeholder="Username" style={styles.input} autoCapitalize="none" />
          <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry style={styles.input} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <AppButton label={loading ? 'Signing in...' : 'Sign in'} onPress={handleLogin} disabled={loading} />
        </View>
      </SafeAreaView>
    )
  }

  const tripLabel = selectedTrip ? tripPublicRef(selectedTrip) : ''

  const bottomTabItems = [
    { label: 'TRIPS', icon: '🚚' },
    { label: 'MAP', icon: '🗺️' },
    { label: 'MESSAGES', icon: '💬' },
    { label: 'ACCOUNT', icon: '👤' },
  ] as const

  function tabPillActive(label: string): boolean {
    if (label === 'TRIPS') return tabTripsActive
    if (label === 'MAP') return tabMapActive
    if (label === 'ACCOUNT') return tabAccountActive
    return false
  }

  if (session && !selectedTrip) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.screenHost}>
          {activeScreen === 'account' ? (
            <AccountScreen session={session} onLogout={performLogout} />
          ) : (
            <View style={[styles.container, styles.emptyTripsBody]}>
              <Text style={styles.title}>No active trips</Text>
              <Text style={styles.subtle}>When ops assigns work, it will show under Trips. Open Account to sign out or refresh your profile.</Text>
            </View>
          )}
        </View>
        <View style={styles.bottomTabs}>
          {bottomTabItems.map((item) => (
            <Pressable
              key={item.label}
              onPress={() => onTabPress(item.label)}
              style={[styles.tabPill, tabPillActive(item.label) ? styles.tabPillActive : null]}
            >
              <Text style={[styles.tabText, tabPillActive(item.label) ? styles.tabTextActive : null]}>
                {item.icon} {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
        {loading ? <ActivityIndicator style={styles.loader} /> : null}
        {error ? <Text style={styles.errorSticky}>{error}</Text> : null}
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      {activeScreen !== 'account' ? (
        <TripPicker trips={trips} selectedTripId={selectedTrip!.id} onSelectTripId={selectTripById} />
      ) : null}
      <View style={styles.screenHost}>
        {activeScreen === 'account' ? <AccountScreen session={session} onLogout={performLogout} /> : null}
        {activeScreen === 'trip-details' && selectedTrip ? (
          <TripDetailsScreen
            trip={selectedTrip}
            exceptionSummary={exceptionSummary}
            canStartTrip={!!canStart}
            canOpenNavigation={!!canOpenNavigation}
            isLoading={loading}
            onStartTrip={handleStartTripAndNavigate}
            onOpenNavigation={() => setActiveScreen('navigation')}
          />
        ) : null}
        {activeScreen === 'navigation' && selectedTrip ? (
          <NavigationScreen
            tripLabel={tripLabel}
            trip={selectedTrip}
            canConfirmPickup={!!canReachedPickup}
            canMarkDelivered={!!canMarkDelivered}
            isLoading={loading}
            onConfirmPickup={async () => {
              await runMutation('pickup')
              setActiveScreen('status-update')
            }}
            onMarkDelivered={() => runMutation('delivered')}
            onReportIssue={() => runMutation('issue')}
          />
        ) : null}
        {activeScreen === 'status-update' && selectedTrip ? (
          <StatusUpdateScreen
            tripLabel={tripLabel}
            status={selectedTrip.status}
            suggestionText={suggestionText}
            canReachedPickup={!!canReachedPickup}
            canMarkDelivered={!!canMarkDelivered}
            isLoading={loading}
            onReachedPickup={() => runMutation('pickup')}
            onMarkDelivered={() => runMutation('delivered')}
            onReportIssue={() => runMutation('issue')}
          />
        ) : null}
      </View>
      <View style={styles.bottomTabs}>
        {bottomTabItems.map((item) => (
          <Pressable
            key={item.label}
            onPress={() => onTabPress(item.label)}
            style={[styles.tabPill, tabPillActive(item.label) ? styles.tabPillActive : null]}
          >
            <Text style={[styles.tabText, tabPillActive(item.label) ? styles.tabTextActive : null]}>
              {item.icon} {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {loading ? <ActivityIndicator style={styles.loader} /> : null}
      {error ? <Text style={styles.errorSticky}>{error}</Text> : null}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f6f8' },
  screenHost: { flex: 1 },
  container: { padding: 16, gap: 12, justifyContent: 'center' },
  emptyTripsBody: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  subtle: { fontSize: 14, color: '#64748b' },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
  },
  error: { color: '#b91c1c', fontSize: 12, fontWeight: '600' },
  bottomTabs: {
    minHeight: 70,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#dbe1ea',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 10,
  },
  tabPill: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPillActive: {
    backgroundColor: '#020617',
  },
  tabText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  loader: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  errorSticky: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 12,
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: 8,
    borderRadius: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
})
