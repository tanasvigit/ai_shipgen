import { useState } from 'react'
import type { Trip } from '../types'
import type { Dispatch, SetStateAction } from 'react'
import { tripPublicRef } from '../utils/tripLabel'

interface DriverOpsPageProps {
  trips: Trip[]
  selectedTrip: Trip | null
  setSelectedTripId: Dispatch<SetStateAction<number | null>>
  onStart: (tripId: number) => Promise<void>
  onReachedPickup: (tripId: number) => Promise<void>
  onDelivered: (tripId: number) => Promise<void>
  onReportIssue: (tripId: number, message: string) => Promise<void>
  isLoading: boolean
}

function DriverOpsPage({
  trips,
  selectedTrip,
  setSelectedTripId,
  onStart,
  onReachedPickup,
  onDelivered,
  onReportIssue,
  isLoading,
}: DriverOpsPageProps) {
  const [issueText, setIssueText] = useState('')
  const actionableTrips = trips.filter((trip) => trip.status !== 'completed')
  const criticalTrips = actionableTrips.filter((trip) => (trip.delayRisk ?? 0) >= 0.6)

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl sm:text-3xl font-bold">Driver Operations</h1>
          <p className="text-sm text-on-surface-variant">Assigned trips and one-tap execution actions.</p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <section className="xl:col-span-8 bg-surface-container-lowest border border-black/5 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-on-surface-variant">Assigned Trips</h2>
              <span className="text-xs font-bold bg-surface-container px-2 py-1 rounded">{actionableTrips.length} active</span>
            </div>
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {actionableTrips.map((trip) => (
                <button
                  key={trip.id}
                  onClick={() => setSelectedTripId(trip.id)}
                  className={`w-full text-left p-4 rounded-xl border transition ${
                    selectedTrip?.id === trip.id ? 'border-primary bg-primary/5' : 'border-black/5 bg-surface hover:bg-surface-container-low'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm">{tripPublicRef(trip)}</p>
                    <span className="text-xs font-semibold capitalize">{trip.status.replace('_', ' ')}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {trip.order?.pickupLocation || '-'} to {trip.order?.dropLocation || '-'}
                  </p>
                  <div className="mt-2 text-[11px] text-on-surface-variant flex gap-4">
                    <span>ETA: {trip.eta ? new Date(trip.eta).toLocaleString() : '-'}</span>
                    <span>Risk: {Math.round((trip.delayRisk ?? 0) * 100)}%</span>
                  </div>
                </button>
              ))}
              {actionableTrips.length === 0 ? <p className="text-sm text-on-surface-variant">No assigned trips.</p> : null}
            </div>
          </section>

          <aside className="xl:col-span-4 space-y-4">
            <section className="bg-surface-container-lowest border border-black/5 rounded-xl p-5 space-y-4">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Current Trip</span>
                <select
                  className="mt-1 w-full h-10 rounded-lg border border-outline-variant/30 px-3"
                  value={selectedTrip?.id ?? ''}
                  onChange={(event) => setSelectedTripId(Number(event.target.value))}
                >
                  {actionableTrips.map((trip) => (
                    <option key={trip.id} value={trip.id}>
                      {tripPublicRef(trip)}
                    </option>
                  ))}
                </select>
              </label>

              {selectedTrip ? (
                <div className="space-y-3">
                  <p className="text-sm">
                    <span className="font-semibold">Status:</span> {selectedTrip.status.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {selectedTrip.order?.pickupLocation || '-'} to {selectedTrip.order?.dropLocation || '-'}
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      disabled={isLoading || selectedTrip.status !== 'assigned'}
                      onClick={() => onStart(selectedTrip.id)}
                      className="h-10 rounded-lg bg-primary text-white font-bold disabled:opacity-50"
                    >
                      Start Trip
                    </button>
                    <button
                      disabled={isLoading || selectedTrip.status !== 'in_transit'}
                      onClick={() => onReachedPickup(selectedTrip.id)}
                      className="h-10 rounded-lg bg-secondary text-on-secondary font-bold disabled:opacity-50"
                    >
                      Reached Pickup
                    </button>
                    <button
                      disabled={isLoading || selectedTrip.status !== 'in_transit'}
                      onClick={() => onDelivered(selectedTrip.id)}
                      className="h-10 rounded-lg bg-on-tertiary-container text-white font-bold disabled:opacity-50"
                    >
                      Delivered
                    </button>
                  </div>
                  <div className="pt-2 border-t border-outline-variant/20 space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Report issue</label>
                    <textarea
                      className="w-full min-h-[72px] rounded-lg border border-outline-variant/30 px-3 py-2 text-sm"
                      placeholder="Describe the issue for operations…"
                      value={issueText}
                      onChange={(e) => setIssueText(e.target.value)}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={async () => {
                        await onReportIssue(selectedTrip.id, issueText)
                        setIssueText('')
                      }}
                      className="w-full h-9 rounded-lg border border-outline-variant/40 text-sm font-bold text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
                    >
                      Submit report
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-on-surface-variant">No active trips.</p>
              )}
            </section>

            <section className="bg-surface-container-lowest border border-black/5 rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Exception Watch</h3>
              {criticalTrips.slice(0, 3).map((trip) => (
                <div key={trip.id} className="p-3 rounded-lg bg-error-container/30 border-l-4 border-error">
                  <p className="text-xs font-bold">{tripPublicRef(trip)}</p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Delay risk {Math.round((trip.delayRisk ?? 0) * 100)}% - monitor route and escalate to ops if blocked.
                  </p>
                </div>
              ))}
              {criticalTrips.length === 0 ? <p className="text-sm text-on-surface-variant">No critical exceptions right now.</p> : null}
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default DriverOpsPage
