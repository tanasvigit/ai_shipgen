import { StyleSheet, Text, View } from 'react-native'

interface StatusBadgeProps {
  status: string
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const isInTransit = status.toLowerCase().includes('transit')
  const tone = isInTransit ? styles.inTransit : styles.assigned
  return (
    <View style={[styles.badge, tone]}>
      <Text
        style={[styles.label, isInTransit ? styles.labelDark : styles.labelMuted]}
        numberOfLines={3}
      >
        {status}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: '100%',
    flexShrink: 1,
  },
  assigned: {
    backgroundColor: '#dbeafe',
  },
  inTransit: {
    backgroundColor: '#86efac',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    textTransform: 'capitalize',
  },
  labelDark: {
    color: '#065f46',
  },
  labelMuted: {
    color: '#1e3a8a',
  },
})
