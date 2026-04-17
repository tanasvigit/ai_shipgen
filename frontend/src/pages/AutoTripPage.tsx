import { Detail, InfoCard, MiniMetric } from '../components/ui/PageParts'
import type { Screen, Trip } from '../types'

interface AutoTripPageProps {
  selectedTrip: Trip | null
  handleApproveTrip: (tripId?: number) => Promise<void>
  handleRejectTrip: (tripId: number) => Promise<void>
  handleRegenerateTrip: (tripId: number) => Promise<void>
  setScreen: (screen: Screen) => void
  isLoading: boolean
}

function AutoTripPage({ selectedTrip, handleApproveTrip, handleRejectTrip, handleRegenerateTrip, setScreen, isLoading }: AutoTripPageProps) {
  if (!selectedTrip) {
    return <div className="p-8 text-on-surface-variant">No trip yet. Create an order from Dashboard.</div>
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 overflow-x-hidden">
      <section className="max-w-4xl mx-auto text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed rounded-full text-xs font-bold mb-4">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          AI Mode Active
        </div>
        <h2 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface mb-3">Trip Auto-Created by ShipGen AI</h2>
        <p className="text-on-surface-variant max-w-2xl mx-auto leading-relaxed">Best driver, vehicle, and route selected based on availability and efficiency.</p>
      </section>

      <div className="grid grid-cols-12 gap-6 items-start">
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="bg-surface-container-lowest p-6 rounded-xl space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Order Details</h3>
            <Detail label="Pickup" value={selectedTrip.order?.pickupLocation} />
            <Detail label="Drop-off" value={selectedTrip.order?.dropLocation} />
            <Detail label="Load Details" value={selectedTrip.order?.load} />
            <Detail label="Scheduled" value={selectedTrip.order?.date} />
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoCard title="Assigned Driver" value={selectedTrip.driver?.name || 'Pending'} />
            <InfoCard title="Vehicle" value={selectedTrip.vehicle?.name || 'Pending'} />
          </div>

          <div className="relative rounded-2xl overflow-hidden h-[340px] bg-surface-container group">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-200/50 to-slate-400/20" />
            <div className="absolute top-4 left-4 z-10 bg-surface-container-lowest/80 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-pulse" />
              <span className="text-xs font-bold tracking-tight font-headline">Live Path Optimization</span>
            </div>
            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end z-10">
              <div className="text-slate-900">
                <p className="text-[10px] uppercase font-bold opacity-70 mb-1">Estimated Arrival</p>
                <p className="text-3xl font-headline font-black">Live ETA</p>
              </div>
              <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl flex gap-6 shadow-xl">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase">Lat</p>
                  <p className="font-headline font-bold text-lg">{Number(selectedTrip.currentLat || 0).toFixed(3)}</p>
                </div>
                <div className="w-px h-8 bg-outline-variant/30 self-center" />
                <div className="text-center">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase">Lng</p>
                  <p className="font-headline font-bold text-lg">{Number(selectedTrip.currentLng || 0).toFixed(3)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Cost & Profit Allocation</h3>
              <div className="bg-tertiary-fixed px-3 py-1 rounded-md text-on-tertiary-fixed text-xs font-bold">
                Estimated Profit: ${Math.round(selectedTrip.finance?.profit ?? 0)}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-8">
              <MiniMetric label="Fuel" value={`$${Math.round(selectedTrip.finance?.fuelCost ?? 0)}`} />
              <MiniMetric label="Driver" value={`$${Math.round(selectedTrip.finance?.driverCost ?? 0)}`} />
              <MiniMetric label="Tolls" value={`$${Math.round(selectedTrip.finance?.tollCost ?? 0)}`} />
            </div>
            <p className="mt-4 text-xs text-on-surface-variant">Route: {(selectedTrip.primaryRoute as { name?: string } | undefined)?.name || 'Primary route pending'}</p>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-3 space-y-4">
          <div className="bg-primary text-white p-6 rounded-xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <span className="text-xs font-bold uppercase tracking-widest text-on-primary-container">AI Insights</span>
                <span className="material-symbols-outlined opacity-50">insights</span>
              </div>
              <div className="space-y-6">
                <p className="text-sm font-medium">Trip status: {selectedTrip.status.replace('_', ' ')}</p>
                <p className="text-sm font-medium">
                  Driver assignment confidence is {Math.round((selectedTrip.etaConfidence ?? 0.8) * 100)}%.
                </p>
                <div className="pt-6 border-t border-white/10">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-medium text-on-primary-container">AI Confidence Score</span>
                    <span className="text-2xl font-black font-headline">{Math.round((selectedTrip.etaConfidence ?? 0.8) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-tertiary-fixed" style={{ width: `${Math.round((selectedTrip.etaConfidence ?? 0.8) * 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-on-primary-container/20 rounded-full blur-3xl" />
          </div>
        </div>
      </div>

      <footer className="mt-12 flex flex-col items-center gap-4 py-8 border-t border-outline-variant/10">
        <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            disabled={isLoading}
            onClick={() => handleApproveTrip(selectedTrip.id)}
            className="kinetic-gradient text-white px-6 py-4 rounded-xl text-base font-bold shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60"
          >
            {isLoading ? 'Dispatching...' : 'Approve'}
          </button>
          <button
            disabled={isLoading}
            onClick={() => handleRejectTrip(selectedTrip.id)}
            className="px-6 py-4 rounded-xl text-base font-bold bg-error text-white hover:opacity-90 disabled:opacity-60"
          >
            Reject
          </button>
          <button
            disabled={isLoading}
            onClick={() => handleRegenerateTrip(selectedTrip.id)}
            className="px-6 py-4 rounded-xl text-base font-bold bg-secondary text-on-secondary hover:opacity-90 disabled:opacity-60"
          >
            Edit + Recalculate
          </button>
        </div>
        <button onClick={() => setScreen('dashboard')} className="text-on-surface-variant hover:text-on-surface font-medium text-sm underline underline-offset-4">
          Modify Selection
        </button>
      </footer>
    </main>
  )
}

export default AutoTripPage
