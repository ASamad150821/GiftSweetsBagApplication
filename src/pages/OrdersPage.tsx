import { useEffect, useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { useSession } from "../hooks/useSession"
import { getSupabase } from "../lib/supabaseClient"

type Order = {
    id: string
    order_number: string
    quantity: number
    personal_message: string | null
    customer_name: string
    customer_email: string
    customer_address: string
    customer_city: string
    customer_postcode: string
    total_price: number
    created_at: string
}

export function OrdersPage() {

    const navigate = useNavigate();
    const { session, loading: sessionLoading } = useSession();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!session) return;

        let cancelled = false;

        async function loadOrders() {
            setIsLoading(true);
            setError(null);

            const { data, error: queryError } = await getSupabase()
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (cancelled) return;

            if (queryError) {
                setError("Couldn't load orders. Please try again.");
            } else {
                setOrders(data as Order[]);
            }
            setIsLoading(false);
        }

        loadOrders();

        return () => { cancelled = true };
    }, [session]);

    async function handleSignOut() {
        await getSupabase().auth.signOut();
        navigate('/login');
    }

    if (sessionLoading) return null;
    if (!session) return <Navigate to="/login" replace></Navigate>;

    return (
        <main className="mx-auto max-w-4xl px-6 py-12">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-semibold text-plum">Orders</h1>
                    <p className="mt-2 text-plum/60">Every Sweet Surprise Gift Bag order placed through the site.</p>
                </div>
                <button type="button" onClick={handleSignOut} className="rounded-full border border-plum/20 px-4 py-2 text-sm font-medium text-plum hover:bg-white">Sign out</button>
            </div>

            {isLoading && <p className="mt-8 text-plum/60">Loading orders…</p>}
            {error && <p className="mt-8 text-sm text-berry" role="alert">{error}</p>}
            {!isLoading && !error && orders.length === 0 && <p className="mt-8 text-plum/60">No orders yet.</p>}

            <div className="mt-8 space-y-4">
                {orders.map((order) => (
                    <div key={order.id} className="rounded-2xl bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-mono text-sm font-semibold text-plum">{order.order_number}</span>
                            <span className="text-xs text-plum/50">{new Date(order.created_at).toLocaleString()}</span>
                        </div>

                        <dl className="mt-3 space-y-1 text-sm text-plum/70">
                            <div className="flex justify-between gap-4">
                                <dt>Customer</dt>
                                <dd className="text-right text-plum/90">{order.customer_name} — {order.customer_email}</dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt>Delivering to</dt>
                                <dd className="text-right text-plum/90">{order.customer_address}, {order.customer_city} {order.customer_postcode}</dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt>Bags</dt>
                                <dd className="text-plum/90">{order.quantity}</dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt>Price</dt>
                                <dd className="text-plum/90">£{order.total_price.toFixed(2)}</dd>
                            </div>
                            {order.personal_message && 
                                <div className="flex justify-between gap-4">
                                    <dt>Message</dt>
                                    <dd className="text-right text-plum/90">"{order.personal_message}"</dd>
                                </div>
                            }
                        </dl>
                    </div>
                ))}
            </div>
        </main>
    )
}
