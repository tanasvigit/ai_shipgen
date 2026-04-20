import type { Dispatch, SetStateAction } from 'react'
import { useMemo } from 'react'
import type { Order, OrdersListFilter, Screen, Trip } from '../types'

interface OrdersPageProps {
  orders: Order[]
  trips: Trip[]
  ordersFilter: OrdersListFilter
  setOrdersFilter: Dispatch<SetStateAction<OrdersListFilter>>
  setScreen: (screen: Screen) => void
  setSelectedTripId: Dispatch<SetStateAction<number | null>>
}

function bucketForOrder(order: Order, trips: Trip[]): OrdersListFilter {
  const trip = trips.find((t) => t.orderId === order.id)
  if (!trip) return 'other'
  if (trip.status === 'completed') return 'completed'
  return 'active'
}

function orderMatchesFilter(order: Order, trips: Trip[], filter: OrdersListFilter): boolean {
  if (filter === 'all') return true
  return bucketForOrder(order, trips) === filter
}

const FILTER_OPTIONS: { id: OrdersListFilter; label: string; hint: string }[] = [
  { id: 'all', label: 'All', hint: 'Every order' },
  { id: 'active', label: 'Active', hint: 'Trip not completed' },
  { id: 'completed', label: 'Completed', hint: 'Trip done' },
  { id: 'other', label: 'Other', hint: 'No trip yet' },
]

function OrdersPage({ orders, trips, ordersFilter, setOrdersFilter, setScreen, setSelectedTripId }: OrdersPageProps) {
  const filteredOrders = useMemo(
    () => orders.filter((order) => orderMatchesFilter(order, trips, ordersFilter)),
    [orders, trips, ordersFilter],
  )

  const filterHint = FILTER_OPTIONS.find((f) => f.id === ordersFilter)?.hint ?? ''

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-headline text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface">All Orders</h1>
            <p className="text-on-surface-variant font-medium">Complete list of auto-created shipment orders.</p>
            <p className="text-xs text-on-surface-variant mt-2">
              Showing <span className="font-bold text-on-surface">{filteredOrders.length}</span> of {orders.length} orders
              {ordersFilter !== 'all' ? <span className="text-on-surface-variant"> · {filterHint}</span> : null}
            </p>
          </div>
          <button
            onClick={() => {
              setOrdersFilter('all')
              setScreen('dashboard')
            }}
            className="self-start sm:self-auto px-4 py-2 rounded-lg border border-outline-variant/30 text-sm font-semibold hover:bg-surface-container-low"
          >
            Back to Dashboard
          </button>
        </header>

        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setOrdersFilter(opt.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide border transition-colors ${
                ordersFilter === opt.id
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/30 hover:bg-surface-container-low'
              }`}
            >
              {opt.label}
            </button>
          ))}
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
                {filteredOrders.map((order) => {
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
