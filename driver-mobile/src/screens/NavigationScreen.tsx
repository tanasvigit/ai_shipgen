import { useMemo } from 'react'
import Constants from 'expo-constants'
import { StyleSheet, Text, View } from 'react-native'
import MapView, { Marker, Polyline, type LatLng, type Region } from 'react-native-maps'

import AppButton from '../components/AppButton'
import Card from '../components/Card'
import { navigationDistanceLabel } from '../formatTrip'
import type { Trip } from '../types'

function arrivalStat(eta?: string | null): string {
  if (!eta) return '—'
  const d = new Date(eta)
  if (Number.isNaN(d.getTime())) return eta
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

interface NavigationScreenProps {
  tripLabel: string
  trip: Trip
  canConfirmPickup: boolean
  canMarkDelivered: boolean
  isLoading: boolean
  onConfirmPickup: () => void
  onMarkDelivered: () => void
  onReportIssue: () => void
}

function destinationCoordinate(trip: Trip): LatLng | null {
  const route = trip.primaryRoute
  if (!route || typeof route !== 'object') return null
  const candidate = route as Record<string, unknown>

  const lat = candidate.destinationLat ?? candidate.dropLat ?? candidate.endLat
  const lng = candidate.destinationLng ?? candidate.dropLng ?? candidate.endLng
  if (typeof lat !== 'number' || typeof lng !== 'number') return null
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { latitude: lat, longitude: lng }
}

export default function NavigationScreen({
  tripLabel,
  trip,
  canConfirmPickup,
  canMarkDelivered,
  isLoading,
  onConfirmPickup,
  onMarkDelivered,
  onReportIssue,
}: NavigationScreenProps) {
  const androidMapsApiKey = (Constants.expoConfig?.android as { config?: { googleMaps?: { apiKey?: string } } } | undefined)?.config?.googleMaps?.apiKey
  const canRenderNativeMap = Constants.appOwnership !== 'expo' || Boolean(androidMapsApiKey)
  const currentCoord = useMemo<LatLng | null>(() => {
    if (typeof trip.currentLat !== 'number' || typeof trip.currentLng !== 'number') return null
    if (!Number.isFinite(trip.currentLat) || !Number.isFinite(trip.currentLng)) return null
    return { latitude: trip.currentLat, longitude: trip.currentLng }
  }, [trip.currentLat, trip.currentLng])

  const destinationCoord = useMemo(() => destinationCoordinate(trip), [trip])

  const region = useMemo<Region>(
    () =>
      currentCoord
        ? {
            latitude: currentCoord.latitude,
            longitude: currentCoord.longitude,
            latitudeDelta: 0.045,
            longitudeDelta: 0.045,
          }
        : {
            latitude: 37.7749,
            longitude: -122.4194,
            latitudeDelta: 0.12,
            longitudeDelta: 0.12,
          },
    [currentCoord]
  )

  const routeCoords = useMemo<LatLng[]>(
    () => (currentCoord && destinationCoord ? [currentCoord, destinationCoord] : []),
    [currentCoord, destinationCoord]
  )

  return (
    <View style={styles.container}>
      <View style={styles.mapLayer}>
        {canRenderNativeMap ? (
          <MapView style={styles.map} initialRegion={region} region={region} showsTraffic showsCompass>
            {currentCoord ? <Marker coordinate={currentCoord} title="Current truck position" pinColor="#111827" /> : null}
            {destinationCoord ? <Marker coordinate={destinationCoord} title="Destination" pinColor="#0ea5e9" /> : null}
            {routeCoords.length === 2 ? (
              <Polyline coordinates={routeCoords} strokeWidth={5} strokeColor="#0ea5e9" lineDashPattern={[1]} />
            ) : null}
          </MapView>
        ) : (
          <View style={styles.mapFallback}>
            <Text style={styles.mapFallbackTitle}>Map temporarily unavailable</Text>
            <Text style={styles.mapFallbackText}>
              Android Google Maps API key is not configured in build settings. Trip actions still work below.
            </Text>
          </View>
        )}

        <View style={styles.topOverlay}>
          {!canRenderNativeMap ? (
            <View style={styles.configWarningBanner}>
              <Text style={styles.configWarningTitle}>Configuration warning</Text>
              <Text style={styles.configWarningText}>Map key missing. Set ANDROID_GOOGLE_MAPS_API_KEY in EAS secrets.</Text>
            </View>
          ) : null}
          <View style={styles.headerRow}>
            <Text style={styles.tripText}>{tripLabel}</Text>
            <View style={styles.navBadge}>
              <Text style={styles.navBadgeText}>AI Navigation Active</Text>
            </View>
          </View>

          <Card style={styles.instructionCard}>
            <Text style={styles.instructionTitle}>Continue on route</Text>
            <Text style={styles.instructionSub}>
              {destinationCoord ? 'Following optimized route to destination.' : 'Destination coordinates unavailable. Syncing route.'}
            </Text>
            <View style={styles.statsRow}>
              <View>
                <Text style={styles.statLabel}>Distance</Text>
                <Text style={styles.statValue}>{navigationDistanceLabel(trip)}</Text>
              </View>
              <View>
                <Text style={styles.statLabel}>Arrival</Text>
                <Text style={styles.statValue}>{arrivalStat(trip.eta)}</Text>
              </View>
            </View>
          </Card>
        </View>

        <View style={styles.bottomOverlay}>
          <View style={styles.trafficBanner}>
            <Text style={styles.trafficText}>
              {currentCoord
                ? 'Live traffic view active. Reroutes are applied automatically when available.'
                : 'Waiting for device location. Enable location permissions for live guidance.'}
            </Text>
          </View>
          <Text style={styles.footerHint}>Live Navigation - Optimized by AI</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <AppButton label="Confirm Pickup" onPress={onConfirmPickup} disabled={!canConfirmPickup || isLoading} />
        <AppButton label="Mark as Delivered" onPress={onMarkDelivered} variant="secondary" disabled={!canMarkDelivered || isLoading} />
        <AppButton label="Report Issue" onPress={onReportIssue} variant="danger" disabled={isLoading} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e5e7eb',
  },
  mapLayer: {
    flex: 1,
    backgroundColor: '#e2e8f0',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#dbeafe',
    gap: 8,
  },
  mapFallbackTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e3a8a',
  },
  mapFallbackText: {
    textAlign: 'center',
    color: '#1e40af',
    fontSize: 14,
    lineHeight: 20,
  },
  topOverlay: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  configWarningBanner: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  configWarningTitle: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  configWarningText: {
    color: '#78350f',
    fontSize: 12,
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  tripText: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  navBadge: {
    flexShrink: 0,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  navBadgeText: {
    fontWeight: '600',
    fontSize: 13,
    color: '#065f46',
  },
  instructionCard: {
    marginTop: 4,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  instructionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
  },
  instructionSub: {
    marginTop: 4,
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 22,
  },
  statsRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    color: '#6b7280',
    fontWeight: '700',
    letterSpacing: 1,
  },
  statValue: {
    marginTop: 4,
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  bottomOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    gap: 8,
  },
  trafficBanner: {
    alignSelf: 'center',
    width: '100%',
    backgroundColor: '#083b66',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  trafficText: {
    color: '#93c5fd',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  footerHint: {
    alignSelf: 'center',
    color: '#e2e8f0',
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontSize: 11,
  },
  actions: {
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#f3f4f6',
  },
})
