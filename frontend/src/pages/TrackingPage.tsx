import { InfoRow, TimelineBadge } from '../components/ui/PageParts'
import type { Dispatch, SetStateAction } from 'react'
import type { Trip } from '../types'

interface TrackingPageProps {
  selectedTrip: Trip | null
  trips: Trip[]
  setSelectedTripId: Dispatch<SetStateAction<number | null>>
}

function TrackingPage({ selectedTrip, trips, setSelectedTripId }: TrackingPageProps) {
  return (
    <div className="flex-1 overflow-hidden flex flex-col xl:flex-row p-4 sm:p-6 gap-6 min-w-0">
      <div className="flex-1 flex flex-col gap-6">
        <section className="flex-1 relative rounded-xl overflow-hidden bg-surface-container-low shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-200/30 to-slate-400/20" />
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <div className="bg-surface-container-lowest/80 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-pulse" />
              <span className="text-xs font-bold tracking-tight font-headline">Live Tracking - AI Monitoring Active</span>
            </div>
          </div>
          {selectedTrip ? (
            <div className="absolute bottom-4 right-4 z-10 bg-surface-container-lowest p-3 rounded-lg shadow-md text-xs font-semibold">
              Lat: {Number(selectedTrip.currentLat || 0).toFixed(6)}<br />
              Lng: {Number(selectedTrip.currentLng || 0).toFixed(6)}
            </div>
          ) : null}
        </section>

        <section className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10">
          <div className="flex justify-between items-center relative">
            <TimelineBadge label="Trip Started" active />
            <TimelineBadge label="Reached Pickup" active={selectedTrip?.status !== 'created'} />
            <TimelineBadge label="In Transit" active={selectedTrip?.status === 'in_transit' || selectedTrip?.status === 'completed'} />
            <TimelineBadge label="Delivered" active={selectedTrip?.status === 'completed'} />
          </div>
        </section>
      </div>

      <aside className="w-full xl:w-80 xl:min-w-80 flex flex-col gap-6">
        <section className="flex-1 bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10">
          <h2 className="text-sm font-black tracking-[0.15em] text-on-surface-variant uppercase font-headline mb-4">AI INSIGHTS</h2>
          <div className="mb-6">
            <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Select Trip</label>
            <select
              className="mt-2 w-full h-10 rounded-lg border border-outline-variant/30 px-3 bg-white"
              value={selectedTrip?.id || ''}
              onChange={(event) => setSelectedTripId(Number(event.target.value))}
            >
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>TRK-{trip.id}</option>
              ))}
            </select>
          </div>

          {selectedTrip ? (
            <div className="space-y-3">
              <div className="p-4 bg-error-container/30 rounded-lg border-l-4 border-error">
                <h3 className="text-sm font-bold text-on-error-container mb-1">Live Status</h3>
                <p className="text-sm font-medium">{selectedTrip.status.replace('_', ' ')}</p>
              </div>
              <InfoRow label="Driver" value={selectedTrip.driver?.name || 'Unassigned'} />
              <InfoRow label="Vehicle" value={selectedTrip.vehicle?.name || 'Unassigned'} />
              <InfoRow label="Last Update" value={selectedTrip.lastUpdated ? new Date(selectedTrip.lastUpdated).toLocaleString() : '-'} />
              <InfoRow label="Current Position" value={`${Number(selectedTrip.currentLat || 0).toFixed(3)}, ${Number(selectedTrip.currentLng || 0).toFixed(3)}`} />
              <InfoRow label="ETA" value={selectedTrip.eta ? new Date(selectedTrip.eta).toLocaleString() : '-'} />
              <InfoRow label="Delay Risk" value={`${Math.round((selectedTrip.delayRisk ?? 0) * 100)}%`} />
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant">No trips available.</p>
          )}
        </section>
      </aside>
    </div>
  )
}

export default TrackingPage
