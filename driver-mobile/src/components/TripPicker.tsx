import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { tripPublicRef } from '../formatTrip'
import type { Trip } from '../types'

interface TripPickerProps {
  trips: Trip[]
  selectedTripId: number
  onSelectTripId: (id: number) => void
}

export default function TripPicker({ trips, selectedTripId, onSelectTripId }: TripPickerProps) {
  if (trips.length <= 1) return null

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Select trip</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {trips.map((trip) => {
          const active = trip.id === selectedTripId
          return (
            <Pressable
              key={trip.id}
              onPress={() => onSelectTripId(trip.id)}
              style={[styles.chip, active ? styles.chipActive : null]}
            >
              <Text style={[styles.chipText, active ? styles.chipTextActive : null]} numberOfLines={1}>
                {tripPublicRef(trip)}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: '#f4f5f7',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: {
    backgroundColor: '#020617',
    borderColor: '#020617',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  chipTextActive: {
    color: '#fff',
  },
})
