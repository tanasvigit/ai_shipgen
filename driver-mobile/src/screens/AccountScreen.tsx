import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'

import { fetchAuthMe, fetchMyDriverProfile } from '../api/client'
import AppButton from '../components/AppButton'
import Card from '../components/Card'
import type { AuthMe, AuthSession, DriverProfile } from '../types'

interface AccountScreenProps {
  session: AuthSession
  onLogout: () => void
}

export default function AccountScreen({ session, onLogout }: AccountScreenProps) {
  const [me, setMe] = useState<AuthMe | null>(null)
  const [driver, setDriver] = useState<DriverProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const [meRes, driverRes] = await Promise.all([fetchAuthMe(session), fetchMyDriverProfile(session)])
      setMe(meRes)
      setDriver(driverRes)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load profile')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [session])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    load()
  }, [load])

  const initial = (driver?.name ?? me?.username ?? '?').trim().charAt(0).toUpperCase() || '?'

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.screenTitle}>Account</Text>
      <Text style={styles.screenSubtitle}>Your profile and session</Text>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#020617" />
        </View>
      ) : null}

      {error ? <Text style={styles.bannerError}>{error}</Text> : null}

      {!loading && me ? (
        <>
          <View style={styles.hero}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <Text style={styles.displayName}>{driver?.name ?? me.username}</Text>
            <Text style={styles.username}>@{me.username}</Text>
            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>Driver</Text>
            </View>
          </View>

          <Card style={styles.card}>
            <Text style={styles.sectionLabel}>Driver details</Text>
            {driver ? (
              <>
                <Row label="Driver ID" value={`#${driver.id}`} />
                <Row label="Base location" value={driver.currentLocation} />
                <Row label="Rating" value={Number.isFinite(driver.rating) ? `${driver.rating.toFixed(1)} ★` : '—'} />
                <Row label="Status" value={driver.availability ? 'Available for dispatch' : 'On active assignment'} last />
              </>
            ) : (
              <Text style={styles.muted}>No driver profile linked to this account.</Text>
            )}
          </Card>

          <Card style={styles.card}>
            <Text style={styles.sectionLabel}>Session</Text>
            <Row label="Signed in as" value={me.username} />
            <Row label="Account role" value={me.role} last />
          </Card>

          <Text style={styles.footerNote}>ShipGen Driver · Pull down to refresh</Text>

          <AppButton
            label="Sign out"
            variant="danger"
            onPress={() => {
              Alert.alert('Sign out?', 'You will need to sign in again to see trips and updates.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign out', style: 'destructive', onPress: onLogout },
              ])
            }}
            style={styles.logout}
          />
        </>
      ) : null}
    </ScrollView>
  )
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, last ? styles.rowLast : null]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 8 },
  screenTitle: { fontSize: 28, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  screenSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4, marginBottom: 20 },
  centered: { paddingVertical: 40, alignItems: 'center' },
  bannerError: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: 12,
    borderRadius: 12,
    fontWeight: '600',
    marginBottom: 16,
  },
  hero: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 36, fontWeight: '700', color: '#ffffff' },
  displayName: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  username: { fontSize: 15, color: '#64748b', marginTop: 2 },
  rolePill: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#e0f2fe',
  },
  rolePillText: { fontSize: 12, fontWeight: '700', color: '#0369a1', textTransform: 'uppercase', letterSpacing: 0.6 },
  card: { marginBottom: 14 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
    gap: 12,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { fontSize: 14, color: '#64748b', flexShrink: 0 },
  rowValue: { fontSize: 14, fontWeight: '600', color: '#0f172a', flex: 1, textAlign: 'right' },
  muted: { fontSize: 14, color: '#64748b' },
  footerNote: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 8, marginBottom: 16 },
  logout: { marginTop: 4 },
})
