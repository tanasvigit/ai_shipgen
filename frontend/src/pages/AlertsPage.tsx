import { InsightCard, SummaryCard } from '../components/ui/PageParts'
import type { Dispatch, SetStateAction } from 'react'
import { useEffect, useMemo, useState } from 'react'
import type { Alert, AlertsListFilter } from '../types'

interface AlertsPageProps {
  alerts: Alert[]
  unresolvedAlerts: Alert[]
  alertsFilter: AlertsListFilter
  setAlertsFilter: Dispatch<SetStateAction<AlertsListFilter>>
  handleResolveAlert: (alertId: number) => Promise<void>
  handleRerouteAlert: (alertId: number) => Promise<void>
  handleReassignAlert: (alertId: number) => Promise<void>
  actionError: string
}

function AlertsPage({
  alerts,
  unresolvedAlerts,
  alertsFilter,
  setAlertsFilter,
  handleResolveAlert,
  handleRerouteAlert,
  handleReassignAlert,
  actionError,
}: AlertsPageProps) {
  const ALERTS_PER_PAGE = 10
  const [alertsPage, setAlertsPage] = useState(1)
  const resolvedAlertsCount = useMemo(() => alerts.filter((alert) => alert.resolved).length, [alerts])
  const visibleAlerts = useMemo(() => {
    if (alertsFilter === 'critical') return alerts.filter((alert) => !alert.resolved)
    if (alertsFilter === 'resolved') return alerts.filter((alert) => alert.resolved)
    return alerts
  }, [alerts, alertsFilter])
  const totalAlertsPages = Math.max(1, Math.ceil(visibleAlerts.length / ALERTS_PER_PAGE))
  const pagedAlerts = useMemo(() => {
    const page = Math.min(alertsPage, totalAlertsPages)
    const start = (page - 1) * ALERTS_PER_PAGE
    return visibleAlerts.slice(start, start + ALERTS_PER_PAGE)
  }, [visibleAlerts, alertsPage, totalAlertsPages])
  const currentAlertsPage = Math.min(alertsPage, totalAlertsPages)

  useEffect(() => {
    setAlertsPage(1)
  }, [alertsFilter])

  return (
    <main className="pt-8 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-1">
            <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface">Alerts & Exceptions</h1>
            <p className="text-on-surface-variant font-medium">Real-time intelligence and automated intervention triggers.</p>
          </div>
          <div className="flex gap-4">
            <SummaryCard label="Total Alerts" value={alerts.length} active={alertsFilter === 'all'} onClick={() => setAlertsFilter('all')} />
            <SummaryCard
              label="Critical"
              value={unresolvedAlerts.length}
              danger
              active={alertsFilter === 'critical'}
              onClick={() => setAlertsFilter('critical')}
            />
            <SummaryCard
              label="Resolved"
              value={resolvedAlertsCount}
              active={alertsFilter === 'resolved'}
              onClick={() => setAlertsFilter('resolved')}
            />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <section className="lg:col-span-8 space-y-6">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAlertsFilter('all')}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide border transition-colors ${
                  alertsFilter === 'all'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/30 hover:bg-surface-container-low'
                }`}
              >
                All Alerts
              </button>
              <button
                type="button"
                onClick={() => setAlertsFilter('critical')}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide border transition-colors ${
                  alertsFilter === 'critical'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/30 hover:bg-surface-container-low'
                }`}
              >
                Critical Alerts
              </button>
              <button
                type="button"
                onClick={() => setAlertsFilter('resolved')}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide border transition-colors ${
                  alertsFilter === 'resolved'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/30 hover:bg-surface-container-low'
                }`}
              >
                Resolved
              </button>
            </div>
            {actionError ? <p className="text-sm font-semibold text-on-error-container bg-error-container px-4 py-3 rounded-xl">{actionError}</p> : null}
            {pagedAlerts.map((alert) => (
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
                    <p className="text-on-surface font-medium">
                      {alert.reason || 'Review and resolve operationally.'} Recommended action: {alert.recommendedAction || 'resolve'}.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex flex-wrap gap-3">
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
                    <button
                      disabled={alert.resolved}
                      onClick={() => handleRerouteAlert(alert.id)}
                      className="bg-on-tertiary-container text-white px-5 py-2 rounded-md text-sm font-bold hover:opacity-90 disabled:opacity-40"
                    >
                      Reroute
                    </button>
                    <button
                      disabled={alert.resolved}
                      onClick={() => handleReassignAlert(alert.id)}
                      className="bg-secondary text-on-secondary px-5 py-2 rounded-md text-sm font-bold hover:opacity-90 disabled:opacity-40"
                    >
                      Reassign
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {visibleAlerts.length > 0 ? (
              <div className="px-1 py-1 flex items-center justify-between gap-3">
                <p className="text-xs text-on-surface-variant">
                  Showing {visibleAlerts.length === 0 ? 0 : (currentAlertsPage - 1) * ALERTS_PER_PAGE + 1}-
                  {Math.min(currentAlertsPage * ALERTS_PER_PAGE, visibleAlerts.length)} of {visibleAlerts.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAlertsPage((current) => Math.max(1, current - 1))}
                    disabled={currentAlertsPage <= 1}
                    className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-container-low"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-semibold text-on-surface-variant">
                    Page {currentAlertsPage} / {totalAlertsPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAlertsPage((current) => Math.min(totalAlertsPages, current + 1))}
                    disabled={currentAlertsPage >= totalAlertsPages}
                    className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-container-low"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
            {visibleAlerts.length === 0 ? (
              <p className="text-sm text-on-surface-variant">
                {alertsFilter === 'critical'
                  ? 'No unresolved critical alerts right now.'
                  : alertsFilter === 'resolved'
                    ? 'No resolved alerts yet.'
                    : 'No alerts yet.'}
              </p>
            ) : null}
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
