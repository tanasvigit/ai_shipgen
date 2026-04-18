import { StyleSheet, Text, View } from 'react-native'

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
  return (
    <View style={styles.container}>
      <View style={styles.mapLayer}>
        <View style={styles.header}>
          <Text style={styles.tripText}>{tripLabel}</Text>
          <View style={styles.navBadge}>
            <Text style={styles.navBadgeText}>AI Navigation Active</Text>
          </View>
        </View>

        <Card style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>Turn right</Text>
          <Text style={styles.instructionSub}>in 500 meters into Industrial Way</Text>
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

        <View style={styles.trafficBanner}>
          <Text style={styles.trafficText}>Traffic ahead - rerouting applied automatically by AI optimizer.</Text>
        </View>
        <View style={styles.routePath} />
        <View style={styles.vehicleDot} />
        <Text style={styles.footerHint}>Live Navigation - Optimized by AI</Text>
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
    padding: 16,
    backgroundColor: '#d6e9da',
  },
  header: {
    gap: 10,
  },
  tripText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  navBadge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  navBadgeText: {
    fontWeight: '600',
    fontSize: 13,
    color: '#065f46',
  },
  instructionCard: {
    marginTop: 18,
    borderRadius: 18,
  },
  instructionTitle: {
    fontSize: 46,
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
    gap: 24,
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
    fontSize: 34,
    fontWeight: '800',
    color: '#111827',
  },
  trafficBanner: {
    marginTop: 14,
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
  routePath: {
    position: 'absolute',
    left: '52%',
    top: 300,
    width: 8,
    height: 150,
    borderRadius: 999,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#0ea5e9',
  },
  vehicleDot: {
    position: 'absolute',
    left: '50%',
    bottom: 96,
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: '#020617',
  },
  footerHint: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 52,
    color: '#0f172a',
    fontWeight: '600',
    letterSpacing: 1.2,
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
