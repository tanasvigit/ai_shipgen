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
      <View style={styles.topMetaRow}>
        <View style={styles.topMetaCol}>
          <Text style={styles.tripId} numberOfLines={2}>
            {ref}
          </Text>
        </View>
        <View style={[styles.topMetaCol, styles.topMetaColCenter]}>
          <View style={styles.aiTag}>
            <Text style={styles.aiTagText} numberOfLines={2}>
              Assigned by ShipGen AI
            </Text>
          </View>
        </View>
        <View style={[styles.topMetaCol, styles.topMetaColRight]}>
          <StatusBadge status={statusBadgeLabel(trip.status)} />
        </View>
      </View>

      {exceptionSummary ? (
        <View style={styles.warnBanner}>
          <Text style={styles.warnTitle}>Trip attention needed</Text>
          <Text style={styles.warnText}>{exceptionSummary}</Text>
        </View>
      ) : null}

      <Card>
        <Text style={styles.sectionTitle}>Live status</Text>
        <Text style={styles.locationText}>{formatEtaLabel(trip.eta)}</Text>
        <Text style={styles.metaText}>Delay risk: {Math.round((trip.delayRisk ?? 0) * 100)}%</Text>
        <Text style={styles.metaText}>Last update: {formatLastUpdated(trip.lastUpdated)}</Text>
        <Text style={styles.metaText}>Position: {pos}</Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Pickup</Text>
        <Text style={styles.locationText}>{pickup}</Text>
        <Text style={styles.metaText}>{formatPickupWindow(trip.order)}</Text>
        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Drop-Off</Text>
        <Text style={styles.locationText}>{drop}</Text>
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
    width: '100%',
    maxWidth: '100%',
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 32,
    gap: 12,
  },
  topMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: '100%',
    gap: 8,
  },
  topMetaCol: {
    flex: 1,
    minWidth: 0,
  },
  topMetaColCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topMetaColRight: {
    alignItems: 'flex-end',
  },
  tripId: {
    fontSize: 22,
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: 28,
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  aiTag: {
    maxWidth: '100%',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dbeafe',
    paddingHorizontal: 5,
    paddingVertical: 3,
    backgroundColor: '#eff6ff',
  },
  aiTagText: {
    color: '#1d4ed8',
    textTransform: 'uppercase',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.25,
    flexShrink: 1,
  },
  warnBanner: {
    width: '100%',
    maxWidth: '100%',
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    borderRadius: 12,
    padding: 14,
  },
  warnTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#991b1b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  warnText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#7f1d1d',
    lineHeight: 22,
    flexShrink: 1,
    maxWidth: '100%',
  },
  sectionTitle: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: '#64748b',
    fontWeight: '600',
  },
  locationText: {
    marginTop: 8,
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: 24,
    flexShrink: 1,
    maxWidth: '100%',
  },
  metaText: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '400',
    color: '#64748b',
    lineHeight: 22,
    flexShrink: 1,
    maxWidth: '100%',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    maxWidth: '100%',
  },
  halfCard: {
    flex: 1,
    minWidth: 0,
    maxWidth: '100%',
  },
  spacer: {
    height: 2,
  },
  helperText: {
    marginTop: 8,
    textAlign: 'center',
    color: '#64748b',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    maxWidth: '100%',
    flexShrink: 1,
    paddingHorizontal: 8,
  },
})
