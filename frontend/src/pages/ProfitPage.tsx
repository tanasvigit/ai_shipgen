import type { FinanceSummary, Trip } from '../types'

interface ProfitPageProps {
  trips: Trip[]
  summary: FinanceSummary | null
}

function ProfitPage({ trips, summary }: ProfitPageProps) {
  return (
    <main className="p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Profit View</h1>
        <p className="text-on-surface-variant">Trip-wise and aggregate financial snapshot from backend finance engine.</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-black/5">
          <p className="text-xs text-on-surface-variant">Trips</p>
          <p className="text-2xl font-bold">{summary?.tripCount ?? 0}</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-black/5">
          <p className="text-xs text-on-surface-variant">Revenue</p>
          <p className="text-2xl font-bold">${Math.round(summary?.totalRevenue ?? 0)}</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-black/5">
          <p className="text-xs text-on-surface-variant">Cost</p>
          <p className="text-2xl font-bold">${Math.round(summary?.totalCost ?? 0)}</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-black/5">
          <p className="text-xs text-on-surface-variant">Profit</p>
          <p className="text-2xl font-bold">${Math.round(summary?.totalProfit ?? 0)}</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-black/5">
          <p className="text-xs text-on-surface-variant">Avg Profit/Trip</p>
          <p className="text-2xl font-bold">${Math.round(summary?.avgProfitPerTrip ?? 0)}</p>
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-xl border border-black/5 overflow-hidden">
        <div className="p-5 border-b border-black/5">
          <h2 className="text-lg font-bold">Trip Finance Ledger</h2>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low/60">
              <th className="px-4 py-3 text-xs font-bold uppercase">Trip</th>
              <th className="px-4 py-3 text-xs font-bold uppercase">Revenue</th>
              <th className="px-4 py-3 text-xs font-bold uppercase">Fuel</th>
              <th className="px-4 py-3 text-xs font-bold uppercase">Driver</th>
              <th className="px-4 py-3 text-xs font-bold uppercase">Toll</th>
              <th className="px-4 py-3 text-xs font-bold uppercase">Profit</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((trip) => (
              <tr key={trip.id} className="border-t border-black/5">
                <td className="px-4 py-3 text-sm font-semibold">TRK-{trip.id}</td>
                <td className="px-4 py-3 text-sm">${Math.round(trip.finance?.revenue ?? 0)}</td>
                <td className="px-4 py-3 text-sm">${Math.round(trip.finance?.fuelCost ?? 0)}</td>
                <td className="px-4 py-3 text-sm">${Math.round(trip.finance?.driverCost ?? 0)}</td>
                <td className="px-4 py-3 text-sm">${Math.round(trip.finance?.tollCost ?? 0)}</td>
                <td className="px-4 py-3 text-sm font-bold">${Math.round(trip.finance?.profit ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}

export default ProfitPage
