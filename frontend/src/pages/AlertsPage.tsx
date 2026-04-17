import { InsightCard, SummaryCard } from '../components/ui/PageParts'
import type { Alert } from '../types'

interface AlertsPageProps {
  alerts: Alert[]
  unresolvedAlerts: Alert[]
  handleResolveAlert: (alertId: number) => Promise<void>
}

function AlertsPage({ alerts, unresolvedAlerts, handleResolveAlert }: AlertsPageProps) {
  return (
    <main className="pt-8 p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-1">
            <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface">Alerts & Exceptions</h1>
            <p className="text-on-surface-variant font-medium">Real-time intelligence and automated intervention triggers.</p>
          </div>
          <div className="flex gap-4">
            <SummaryCard label="Total Alerts" value={alerts.length} />
            <SummaryCard label="Critical" value={unresolvedAlerts.length} danger />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <section className="lg:col-span-8 space-y-6">
            {alerts.map((alert) => (
              <div key={alert.id} className="bg-surface-container-lowest rounded-xl p-6 transition-all hover:bg-surface-container-highest">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center text-on-error-container">
                      <span className="material-symbols-outlined">warning</span>
                    </div>
                    <div>
                      <h3 className="font-headline font-bold text-lg text-on-surface">{alert.message}</h3>
                      <span className="text-xs font-mono bg-surface-container px-2 py-0.5 rounded text-on-surface-variant">ID: TRK-{alert.tripId}</span>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${alert.resolved ? 'bg-surface-container-high text-on-surface-variant' : 'text-on-error-container bg-error-container'}`}>
                    {alert.resolved ? 'RESOLVED' : alert.type.toUpperCase()}
                  </span>
                </div>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-tighter">Problem</p>
                    <p className="text-on-surface font-medium">{alert.message}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-on-tertiary-container uppercase tracking-tighter">AI Suggestion</p>
                    <p className="text-on-surface font-medium">Review and resolve operationally</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    disabled={alert.resolved}
                    onClick={() => handleResolveAlert(alert.id)}
                    className="kinetic-gradient text-on-primary px-5 py-2 rounded-md text-sm font-bold hover:opacity-90 disabled:opacity-40"
                  >
                    Resolve
                  </button>
                  <button className="bg-surface-container-high text-on-surface px-5 py-2 rounded-md text-sm font-bold hover:bg-surface-container-highest">
                    View Details
                  </button>
                </div>
              </div>
            ))}
            {alerts.length === 0 ? <p className="text-sm text-on-surface-variant">No alerts yet.</p> : null}
          </section>

          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-surface-container-low rounded-2xl p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
                <h2 className="font-headline font-bold text-lg text-on-surface">Predictive Insights</h2>
              </div>
              <div className="space-y-4">
                <InsightCard text={`${unresolvedAlerts.length} unresolved alerts need review.`} />
                <InsightCard text="Auto-correction is enabled for low-risk exceptions." />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default AlertsPage
