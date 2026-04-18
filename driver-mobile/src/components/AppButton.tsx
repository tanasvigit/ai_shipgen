import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface AppButtonProps {
  label: string
  onPress: () => void
  disabled?: boolean
  variant?: ButtonVariant
  style?: StyleProp<ViewStyle>
}

export default function AppButton({ label, onPress, disabled = false, variant = 'primary', style }: AppButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.base, variantStyles[variant], style, disabled ? styles.disabled : null]}
    >
      <Text style={[styles.text, textStyles[variant]]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  disabled: {
    opacity: 0.5,
  },
})

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: '#020617' },
  secondary: { backgroundColor: '#e2e8f0' },
  ghost: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#d1d5db' },
  danger: { backgroundColor: '#fee2e2' },
})

const textStyles = StyleSheet.create({
  primary: { color: '#ffffff' },
  secondary: { color: '#0f172a' },
  ghost: { color: '#0f172a' },
  danger: { color: '#b91c1c' },
})
