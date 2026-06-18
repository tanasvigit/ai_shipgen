import type { Dispatch, SetStateAction } from 'react'
import { useEffect, useMemo, useState } from 'react'
import type { Order, Screen, Trip, TripStatus } from '../types'

interface OrdersPageProps {
  orders: Order[]
  trips: Trip[]
  setScreen: (screen: Screen) => void
  setSelectedTripId: Dispatch<SetStateAction<number | null>>
}

const TRIP_STATUS_OPTIONS: Array<{ id: 'all' | TripStatus; label: string }> = [
  { id: 'all', label: 'All statuses' },
  { id: 'created', label: 'Created' },
  { id: 'assigned', label: 'Assigned' },
  { id: 'approved', label: 'Approved' },
  { id: 'in_transit', label: 'In Transit' },
  { id: 'completed', label: 'Completed' },
]

function OrdersPage({ orders, trips, setScreen, setSelectedTripId }: OrdersPageProps) {
  const ORDERS_PER_PAGE = 10
  const [ordersPage, setOrdersPage] = useState(1)
  const [tripStatusFilter, setTripStatusFilter] = useState<'all' | TripStatus>('all')
  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        if (tripStatusFilter === 'all') return true
        const orderTrip = trips.find((trip) => trip.orderId === order.id)
        return orderTrip?.status === tripStatusFilter
      }),
    [orders, trips, tripStatusFilter],
  )
  const totalOrdersPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE))
  const pagedOrders = useMemo(() => {
    const page = Math.min(ordersPage, totalOrdersPages)
    const start = (page - 1) * ORDERS_PER_PAGE
    return filteredOrders.slice(start, start + ORDERS_PER_PAGE)
  }, [filteredOrders, ordersPage, totalOrdersPages])

  const currentOrdersPage = Math.min(ordersPage, totalOrdersPages)

  useEffect(() => {
    setOrdersPage(1)
  }, [tripStatusFilter])

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-headline text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface">All Orders</h1>
            <p className="text-on-surface-variant font-medium">Complete list of auto-created shipment orders.</p>
            <p className="text-xs text-on-surface-variant mt-2">
              Showing{' '}
              <span className="font-bold text-on-surface">
                {filteredOrders.length === 0 ? 0 : (currentOrdersPage - 1) * ORDERS_PER_PAGE + 1}-
                {Math.min(currentOrdersPage * ORDERS_PER_PAGE, filteredOrders.length)}
              </span>{' '}
              of {filteredOrders.length} orders
            </p>
          </div>
          <button
            onClick={() => {
              setTripStatusFilter('all')
              setScreen('dashboard')
            }}
            className="self-start sm:self-auto px-4 py-2 rounded-lg border border-outline-variant/30 text-sm font-semibold hover:bg-surface-container-low"
          >
            Back to Dashboard
          </button>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-semibold text-on-surface-variant">Filter orders by trip status</span>
          <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-2">
            Trip Status
            <select
              value={tripStatusFilter}
              onChange={(event) => setTripStatusFilter(event.target.value as 'all' | TripStatus)}
              className="h-9 rounded-lg border border-outline-variant/30 px-3 bg-surface-container-lowest text-xs font-semibold"
            >
              {TRIP_STATUS_OPTIONS.map((statusOption) => (
                <option key={statusOption.id} value={statusOption.id}>
                  {statusOption.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <section className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-black/5">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Pickup</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Drop</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Load</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Trip Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {pagedOrders.map((order) => {
                  const orderTrip = trips.find((trip) => trip.orderId === order.id)
                  return (
                    <tr key={order.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-6 py-4 text-xs font-bold">SG-{order.id}</td>
                      <td className="px-6 py-4 text-xs font-medium">{order.pickupLocation}</td>
                      <td className="px-6 py-4 text-xs font-medium">{order.dropLocation}</td>
                      <td className="px-6 py-4 text-xs text-on-surface-variant">{order.load}</td>
                      <td className="px-6 py-4 text-xs text-on-surface-variant">{order.date}</td>
                      <td className="px-6 py-4 text-xs font-semibold">
                        {orderTrip ? orderTrip.status.replace('_', ' ') : 'pending'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {orderTrip ? (
                          <button
                            onClick={() => {
                              setSelectedTripId(orderTrip.id)
                              setScreen('auto-trip')
                            }}
                            className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90"
                          >
                            Open Trip
                          </button>
                        ) : (
                          <span className="text-xs text-on-surface-variant">No trip yet</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filteredOrders.length > 0 ? (
            <div className="px-6 py-4 border-t border-black/5 flex items-center justify-between gap-3">
              <p className="text-xs text-on-surface-variant">
                Showing {filteredOrders.length === 0 ? 0 : (currentOrdersPage - 1) * ORDERS_PER_PAGE + 1}-
                {Math.min(currentOrdersPage * ORDERS_PER_PAGE, filteredOrders.length)} of {filteredOrders.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOrdersPage((current) => Math.max(1, current - 1))}
                  disabled={currentOrdersPage <= 1}
                  className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-container-low"
                >
                  Previous
                </button>
                <span className="text-xs font-semibold text-on-surface-variant">
                  Page {currentOrdersPage} / {totalOrdersPages}
                </span>
                <button
                  type="button"
                  onClick={() => setOrdersPage((current) => Math.min(totalOrdersPages, current + 1))}
                  disabled={currentOrdersPage >= totalOrdersPages}
                  className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-container-low"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
          {orders.length === 0 ? <p className="px-6 py-6 text-sm text-on-surface-variant">No orders found.</p> : null}
          {orders.length > 0 && filteredOrders.length === 0 ? (
            <p className="px-6 py-6 text-sm text-on-surface-variant">No orders match this filter. Try &quot;All&quot; or another tab.</p>
          ) : null}
        </section>
      </div>
    </main>
  )
}

export default OrdersPage
