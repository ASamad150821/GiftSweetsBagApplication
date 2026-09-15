import { Navigate, useNavigate } from 'react-router-dom'
import { useOrderStore } from '../store/orderStore'

export function ConfirmationPage() {
  const navigate = useNavigate()
  const lastOrder = useOrderStore((state) => state.lastOrder)
  const reset = useOrderStore((state) => state.reset)

  if (!lastOrder) {
    return <Navigate to="/" replace></Navigate>
  }

  function handleOrderAgain() {
    reset()
    navigate('/')
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-16 text-center">
      <div className="text-5xl">🎉</div>
      <h1 className="mt-4 text-3xl font-semibold text-plum">Order placed!</h1>
      <p className="mt-2 text-plum/70">
        Thanks, {lastOrder.customer.name.split(' ')[0]}. Your Sweet Surprise Gift Bag is on its
        way.
      </p>

      <div className="mt-8 rounded-2xl bg-white p-6 text-left shadow-sm">
        <dl className="space-y-2 text-sm text-plum/70">
          <div className="flex justify-between">
            <dt>Order reference</dt>
            <dd className="font-mono font-semibold text-plum">{lastOrder.orderNumber}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Sweet Surprise Gift Bag × {lastOrder.quantity}</dt>
            <dd>£{lastOrder.totalPrice.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Delivering to</dt>
            <dd className="text-right">
              {lastOrder.customer.address}, {lastOrder.customer.city} {lastOrder.customer.postcode}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt>Confirmation sent to</dt>
            <dd>{lastOrder.customer.email}</dd>
          </div>
        </dl>
      </div>

      <button
        type="button"
        onClick={handleOrderAgain}
        className="mt-8 rounded-full bg-berry px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-berry-dark"
      >
        Order another bag
      </button>
    </main>
  )
}
