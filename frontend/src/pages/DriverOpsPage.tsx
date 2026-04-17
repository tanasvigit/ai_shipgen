import type { Trip } from '../types'
import type { Dispatch, SetStateAction } from 'react'

interface DriverOpsPageProps {
  trips: Trip[]
  selectedTrip: Trip | null
  setSelectedTripId: Dispatch<SetStateAction<number | null>>
  onStart: (tripId: number) => Promise<void>
  onReachedPickup: (tripId: number) => Promise<void>
  onDelivered: (tripId: number) => Promise<void>
  isLoading: boolean
}

function DriverOpsPage({ trips, selectedTrip, setSelectedTripId, onStart, onReachedPickup, onDelivered, isLoading }: DriverOpsPageProps) {
  return (
    <main className="p-6 max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Driver Operations</h1>
        <p className="text-sm text-on-surface-variant">Minimal actions for execution updates.</p>
      </header>

      <section className="bg-surface-container-lowest border border-black/5 rounded-xl p-5 space-y-4">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Select Trip</span>
          <select
            className="mt-1 w-full h-10 rounded-lg border border-outline-variant/30 px-3"
            value={selectedTrip?.id ?? ''}
            onChange={(event) => setSelectedTripId(Number(event.target.value))}
          >
            {trips.map((trip) => (
              <option key={trip.id} value={trip.id}>
                TRK-{trip.id}
              </option>
            ))}
          </select>
        </label>

        {selectedTrip ? (
          <div className="space-y-3">
            <p className="text-sm">
              <span className="font-semibold">Status:</span> {selectedTrip.status.replace('_', ' ')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                disabled={isLoading}
                onClick={() => onStart(selectedTrip.id)}
                className="h-10 rounded-lg bg-primary text-white font-bold disabled:opacity-60"
              >
                Start Trip
              </button>
              <button
                disabled={isLoading}
                onClick={() => onReachedPickup(selectedTrip.id)}
                className="h-10 rounded-lg bg-secondary text-on-secondary font-bold disabled:opacity-60"
              >
                Reached Pickup
              </button>
              <button
                disabled={isLoading}
                onClick={() => onDelivered(selectedTrip.id)}
                className="h-10 rounded-lg bg-on-tertiary-container text-white font-bold disabled:opacity-60"
              >
                Delivered
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-on-surface-variant">No active trips.</p>
        )}
      </section>
    </main>
  )
}

export default DriverOpsPage
