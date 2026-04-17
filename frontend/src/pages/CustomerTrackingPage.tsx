import type { Trip } from '../types'

interface CustomerTrackingPageProps {
  trip: Trip | null
  token: string
}

function CustomerTrackingPage({ trip, token }: CustomerTrackingPageProps) {
  return (
    <main className="min-h-screen bg-surface p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold">Shipment Tracking</h1>
          <p className="text-on-surface-variant">Public link token: {token}</p>
        </header>

        {trip ? (
          <div className="bg-surface-container-lowest rounded-2xl p-6 border border-black/5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">TRK-{trip.id}</h2>
              <span className="px-3 py-1 rounded-full bg-surface-container-low text-xs font-bold uppercase">{trip.status.replace('_', ' ')}</span>
            </div>
            <p className="text-sm">
              <span className="font-semibold">Route:</span> {trip.order?.pickupLocation} to {trip.order?.dropLocation}
            </p>
            <p className="text-sm">
              <span className="font-semibold">ETA:</span> {trip.eta ? new Date(trip.eta).toLocaleString() : 'Pending'}
            </p>
            <p className="text-sm">
              <span className="font-semibold">Current Position:</span> {Number(trip.currentLat ?? 0).toFixed(3)}, {Number(trip.currentLng ?? 0).toFixed(3)}
            </p>
            <p className="text-sm">
              <span className="font-semibold">Delay Risk:</span> {Math.round((trip.delayRisk ?? 0) * 100)}%
            </p>
          </div>
        ) : (
          <div className="bg-error-container text-on-error-container rounded-xl p-4 text-sm font-semibold">Unable to load tracking data.</div>
        )}
      </div>
    </main>
  )
}

export default CustomerTrackingPage
