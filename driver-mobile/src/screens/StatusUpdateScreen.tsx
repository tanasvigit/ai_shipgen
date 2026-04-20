import { StyleSheet, Text, View } from 'react-native'

import AppButton from '../components/AppButton'
import Card from '../components/Card'
import StatusBadge from '../components/StatusBadge'

function statusBadgeLabel(status: string): string {
  if (status === 'in_transit') return 'In Transit'
  if (status === 'assigned') return 'Assigned'
  return status.replace(/_/g, ' ')
}

interface StatusUpdateScreenProps {
  tripLabel: string
  status: string
  suggestionText: string
  canReachedPickup: boolean
  canMarkDelivered: boolean
  isLoading: boolean
  onReachedPickup: () => void
  onMarkDelivered: () => void
  onReportIssue: () => void
}

export default function StatusUpdateScreen({
  tripLabel,
  status,
  suggestionText,
  canReachedPickup,
  canMarkDelivered,
  isLoading,
  onReachedPickup,
  onMarkDelivered,
  onReportIssue,
}: StatusUpdateScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.label}>Current Trip</Text>
          <Text style={styles.trip}>{tripLabel}</Text>
        </View>
        <StatusBadge status={statusBadgeLabel(status)} />
      </View>

      <Card style={styles.suggestionCard}>
        <Text style={styles.suggestionTitle}>Smart Action</Text>
        <Text style={styles.suggestionText}>{suggestionText}</Text>
      </Card>

      <Text style={styles.label}>Update Progress</Text>
      <AppButton label="Reached Pickup" onPress={onReachedPickup} disabled={!canReachedPickup || isLoading} />
      <AppButton label="Pickup Completed" onPress={() => {}} variant="ghost" style={styles.lockedBtn} disabled />

      <View style={styles.gridRow}>
        <View style={styles.gridItem}>
          <AppButton
            label="Reached Destination"
            onPress={onMarkDelivered}
            variant="ghost"
            style={styles.gridBtn}
            disabled={!canMarkDelivered || isLoading}
          />
        </View>
        <View style={styles.gridItem}>
          <AppButton
            label="Delivery Completed"
            onPress={onMarkDelivered}
            variant="ghost"
            style={styles.gridBtn}
            disabled={!canMarkDelivered || isLoading}
          />
        </View>
      </View>

      <AppButton label="Report Issue" onPress={onReportIssue} variant="secondary" style={styles.reportBtn} disabled={isLoading} />
      <Text style={styles.syncText}>Updates are shared automatically.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f5f7',
    padding: 16,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    fontWeight: '700',
    fontSize: 12,
  },
  trip: {
    marginTop: 4,
    fontSize: 44,
    fontWeight: '800',
    color: '#111827',
  },
  suggestionCard: {
    backgroundColor: '#fbfdff',
  },
  suggestionTitle: {
    fontWeight: '700',
    color: '#111827',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  suggestionText: {
    marginTop: 4,
    color: '#374151',
    fontSize: 15,
    lineHeight: 21,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  gridItem: {
    flex: 1,
  },
  lockedBtn: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  gridBtn: {
    minHeight: 95,
    alignItems: 'center',
  },
  reportBtn: {
    marginTop: 2,
  },
  syncText: {
    marginTop: 6,
    textAlign: 'center',
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
})
