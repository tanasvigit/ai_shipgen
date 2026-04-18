import * as Location from 'expo-location'

export type LatLng = { lat: number; lng: number }

/**
 * Requests foreground permission and returns current coordinates, or null if denied/unavailable.
 */
export async function getCurrentLatLng(): Promise<LatLng | null> {
  const { status } = await Location.requestForegroundPermissionsAsync()
  if (status !== 'granted') {
    return null
  }
  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  })
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
  }
}
