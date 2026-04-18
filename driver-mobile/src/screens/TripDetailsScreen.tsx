import { ScrollView, StyleSheet, Text, View } from 'react-native'

import AppButton from '../components/AppButton'
import Card from '../components/Card'
import StatusBadge from '../components/StatusBadge'
import { formatEtaLabel, formatPickupWindow, parseLoadDisplay, tripPublicRef, vehicleCapacityLabel } from '../formatTrip'
import type { Trip } from '../types'

function statusBadgeLabel(status: string): string {
  if (status === 'in_transit') return 'In Transit'
  if (status === 'assigned') return 'Assigned'
  return status.replace(/_/g, ' ')
}

function formatLastUpdated(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString()
}

interface TripDetailsScreenProps {
  trip: Trip
  exceptionSummary: string | null
  canStartTrip: boolean
  canOpenNavigation: boolean
  isLoading: boolean
  onStartTrip: () => void
  onOpenNavigation: () => void
}

export default function TripDetailsScreen({
  trip,
  exceptionSummary,
  canStartTrip,
  canOpenNavigation,
  isLoading,
  onStartTrip,
  onOpenNavigation,
}: TripDetailsScreenProps) {
  const pickup = trip.order?.pickupLocation ?? 'Pickup location'
  const drop = trip.order?.dropLocation ?? 'Drop-off location'
  const ref = tripPublicRef(trip)
  const load = parseLoadDisplay(trip.order, trip.vehicle?.type ?? null)
  const lat = trip.currentLat ?? null
  const lng = trip.currentLng ?? null
  const pos =
    lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)
      ? `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`
      : '—'

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.tripId}>{ref}</Text>
        <StatusBadge status={statusBadgeLabel(trip.status)} />
      </View>
      <View style={styles.aiTag}>
        <Text style={styles.aiTagText}>Assigned by ShipGen AI</Text>
      </View>

      {exceptionSummary ? (
        <View style={styles.warnBanner}>
          <Text style={styles.warnTitle}>Exception watch</Text>
          <Text style={styles.warnText}>{exceptionSummary}</Text>
        </View>
      ) : null}

      <Card>
        <Text style={styles.sectionTitle}>Live status</Text>
        <Text style={styles.metaText}>{formatEtaLabel(trip.eta)}</Text>
        <Text style={styles.metaText}>Delay risk: {Math.round((trip.delayRisk ?? 0) * 100)}%</Text>
        <Text style={styles.metaText}>Last update: {formatLastUpdated(trip.lastUpdated)}</Text>
        <Text style={styles.metaText}>Position: {pos}</Text>
        <Text style={styles.metaText}>Vehicle: {trip.vehicle?.name ?? '—'}</Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Pickup</Text>
        <Text style={styles.locationText}>{pickup}</Text>
        <Text style={styles.metaText}>{formatPickupWindow(trip.order)}</Text>
        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Drop-Off</Text>
        <Text style={styles.locationText}>{drop}</Text>
        <Text style={styles.metaText}>{formatEtaLabel(trip.eta)}</Text>
      </Card>

      <View style={styles.row}>
        <Card style={styles.halfCard}>
          <Text style={styles.sectionTitle}>Load Info</Text>
          <Text style={styles.locationText}>{load.primary}</Text>
          <Text style={styles.metaText}>{load.secondary}</Text>
        </Card>
        <Card style={styles.halfCard}>
          <Text style={styles.sectionTitle}>Vehicle</Text>
          <Text style={styles.locationText}>{trip.vehicle?.name ?? 'Assigned Vehicle'}</Text>
          <Text style={styles.metaText}>{vehicleCapacityLabel(trip)}</Text>
        </Card>
      </View>

      <Card style={styles.routeCard}>
        <Text style={styles.routeLabel}>View Route Detail</Text>
      </Card>

      <AppButton label="Open Navigation" onPress={onOpenNavigation} variant="secondary" disabled={!canOpenNavigation || isLoading} />
      <View style={styles.spacer} />
      <AppButton label="Start Trip & Begin Navigation" onPress={onStartTrip} variant="primary" disabled={!canStartTrip || isLoading} />
      <Text style={styles.helperText}>Navigation and updates will be handled automatically</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f5f7',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 18,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripId: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  aiTag: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dbe3ef',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#eef6ff',
  },
  aiTagText: {
    color: '#2b6cb0',
    textTransform: 'uppercase',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  warnBanner: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    borderRadius: 12,
    padding: 12,
  },
  warnTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#991b1b',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  warnText: {
    fontSize: 13,
    color: '#7f1d1d',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#6b7280',
    fontWeight: '700',
  },
  locationText: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 20,
  },
  metaText: {
    marginTop: 4,
    fontSize: 13,
    color: '#525f70',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfCard: {
    flex: 1,
  },
  routeCard: {
    minHeight: 105,
    justifyContent: 'flex-end',
    backgroundColor: '#d1d5db',
  },
  routeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  spacer: {
    height: 2,
  },
  helperText: {
    marginTop: 4,
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '500',
  },
})
