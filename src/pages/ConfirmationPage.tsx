import { Navigate, useNavigate } from "react-router"
import { PRICE_PER_BAG, useOrderStore } from "../store/orderStore";

export function ConfirmationPage() {
   
   const navigate = useNavigate();
   const orderNumber = useOrderStore((state) => state.orderNumber);
   const quantity = useOrderStore((state) => state.quantity);
   const customer = useOrderStore((state) => state.customer);
   const reset = useOrderStore((state) => state.reset);

   const total = (quantity * PRICE_PER_BAG).toFixed(2);

  if (!orderNumber) {
    return <Navigate to="/" replace></Navigate>
  }

   function handleOrderAgain() {
        reset();
        navigate("/");
   }
   
    return (
        <main className="mx-auto max-w-xl px-6 py-16 text-center">
            <div className="text-5xl">🎉</div>
            <h1 className="mt-4 text-3xl font-semibold text-plum">Order placed!</h1>
            <p className="mt-2 text-plum/70">
                Thanks, {customer.name.split(" ")[0]}. Your Sweet Surprise Gift Bag is on its way.
            </p>

            <div className="mt-8 rounded-2xl bg-white p-6 text-left shadow-sm">
                <dl className="space-y-2 text-sm text-plum/70">
                    <div className="flex justify-between">
                        <dt>Order reference</dt>
                        <dd className="font-mono font-semibold text-plum">{orderNumber}</dd>
                    </div>
                    <div className="flex justify-between">
                        <dt>Sweet Surprise Gift Bag X {quantity}</dt>
                        <dd>£{total}</dd>
                    </div>
                    <div className="flex justify-between">
                        <dt>Delivering to</dt>
                        <dd className="text-right">
                            {customer.address}, {customer.city} {customer.postcode}
                        </dd>
                    </div>
                    <div className="flex justify-between">
                        <dt>Confirmation sent to</dt>
                        <dd>{customer.email}</dd>
                    </div>
                </dl>
            </div>

            <button type="button" onClick={handleOrderAgain} className="mt-6 rounded-md bg-plum px-6 py-3 text-white hover:bg-plum/90">
                Order another bag
            </button>

        </main>
    )
}
     