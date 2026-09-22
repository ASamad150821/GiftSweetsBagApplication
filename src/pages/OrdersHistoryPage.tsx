import { useEffect, useState } from 'react'
import { apiRequest } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import type { PlacedOrder } from '../store/orderStore'

export function OrdersHistoryPage() {
    const token = useAuthStore((state) => state.token);
    const [orders, setOrders] = useState<PlacedOrder[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      let cancelled = false; 

      apiRequest<{ orders: PlacedOrder[] }>('/orders', {token: token})
      .then((result) => {
        if(!cancelled) {
          setOrders(result.orders)
        }
      })
      .catch(() => {
        if(!cancelled) {
          setError('Could not load your orders right now')
        }
      })

      return(() => {
        cancelled = true
      })

    }, [token]);
    
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-3xl font-semibold text-plum">My orders</h1>

        {error && <p className="mt-6 text-sm text-berry-dark">{error}</p>}

        {!error && orders?.length === 0 && (
          <p className="mt-6 text-plum/60">You haven't placed an order yet.</p>
        )}

        <ul className="mt-6 space-y-4">
          {orders?.map((order) => (
            <li key={order.id} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-sm font-semibold text-plum">
                  {order.orderNumber}
                </span>
                <span className="text-sm text-plum/50">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-2 text-sm text-plum/70">
                Sweet Surprise Gift Bag × {order.quantity} — £{order.totalPrice.toFixed(2)}
              </p>
              <p className="mt-1 text-sm text-plum/50">
                Delivered to {order.customer.address}, {order.customer.city} {order.customer.postcode}
              </p>
            </li>
          ))}
        </ul>

        
      </main>
    )
    
}
