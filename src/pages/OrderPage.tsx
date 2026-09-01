import { useNavigate } from "react-router-dom"
import { PRICE_PER_BAG, useOrderStore } from "../store/orderStore";
import { GiftBagPicture } from "../components/GiftBagPicture";

const MAX_MESSAGE_LENGTH = 120

export function OrderPage() {

    const navigate = useNavigate();
    const quantity = useOrderStore((state) => state.quantity);
    const personalMessage = useOrderStore((state) => state.personalMessage);
    const setQuantity = useOrderStore((state) => state.setQuantity);
    const setPersonalMessage = useOrderStore((state) => state.setPersonalMessage);

    const total = (quantity * PRICE_PER_BAG).toFixed(2);

    function handleBuyNow() {
        navigate('/checkout');
    }

    return (
        <main className="mx-auto max-w-4xl px-6 py-12">
            <div className="grid gap-10 sm:grid-cols-2 sm:items-center">
                <div className="rounded-3xl bg-white p-6 shadow-sm">
                    <GiftBagPicture className="mx-auto h-auto w-full max-w-xs" />
                </div>

                <div>
                    <h1 className="text-4xl font-semibold text-plum">Sweet Surprise Gift Bag</h1>
                    <p className="mt-4 text-plum/70">A random assortment of sweets, finished with a kind message label of your choosing. You can order up to 10 bags at a time.</p>
                    <p className="mt-6 text-3xl font-semibold text-berry">£{PRICE_PER_BAG.toFixed(2)}</p>
                    
                    <div className="mt-8 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-plum" htmlFor="quantity">Quantity</label>

                            <div className="mt-2 inline-flex items-center rounded-full border border-plum/20 bg-white">
                                <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-10 w-10 rounded-full text-lg text-plum hover:bg-cream" aria-label="Decrease quantity">−</button>
                                <span id="quantity" className="w-10 text-center font-medium" aria-live="polite">{quantity}</span>
                                <button type="button" onClick={() => setQuantity(Math.min(10, quantity + 1))} className="h-10 w-10 rounded-full text-lg text-plum hover:bg-cream" aria-label="Increase quantity">+</button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-plum mt-8 space-y-6" htmlFor="personalMessage">Kind message for the label</label>
                                <textarea id="message" value={personalMessage} onChange={(e) => setPersonalMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))} placeholder="e.g. Thinking of you and hoping today is a little sweeter!" className="mt-2 w-full rounded-2xl border border-plum/20 bg-white p-3 text-sm text-plum placeholder:text-plum/40 focus:border-berry focus:outline-none"></textarea>
                                <p className="mt-1 text-right text-xs text-plum/40">{personalMessage.length}/{MAX_MESSAGE_LENGTH}</p>
                            </div>
                        </div>

                        <button type="button" onClick={handleBuyNow} className="w-full rounded-full bg-berry px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-berry-dark sm:w-auto">Buy now — £{total}</button>

                    </div>
                </div>
            </div>

        </main>
    )
}