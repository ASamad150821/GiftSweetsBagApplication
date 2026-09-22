import { useNavigate } from 'react-router-dom'
import { GiftBagIllustration } from '../components/GiftBagIllustration'
import { PRICE_PER_BAG } from '../store/orderStore'
import { Feature } from '../components/Feature';

export function HomePage() {
    const navigate = useNavigate();

    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="grid gap-10 sm:grid-cols-2 sm:items-center">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
              <GiftBagIllustration className="mx-auto h-auto w-full max-w-xs"></GiftBagIllustration>
          </div>

          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-mint">
            Our one and only bestseller
            </p>
            <h1 className="mt-1 text-4xl font-semibold text-plum">Sweet Surprise Gift Bags</h1>
            <p className="mt-4 text-plum/70">
            A generous, random assortment of sweets packed into a gift bag and finished with a
            kind message label of your choosing. No two bags are quite the same — that's part of
            the fun.
            </p>
            <p className="mt-4 text-plum/70">
            Whether it's a birthday, a thank-you, or just because, pick how many bags you'd like
            and write the words you want on the label. We'll take care of the rest.
            </p>
            <p className="mt-6 text-3xl font-semibold text-berry">
              From £{PRICE_PER_BAG.toFixed(2)}
            </p>


          <button type="button" onClick={() => navigate('/order')} className="mt-8 w-full rounded-full bg-berry px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-berry-dark sm:w-auto">
            Order A Gift Bag
          </button>

          </div> 
        </div>

      <section className="mt-16 grid gap-6 sm:grid-cols-3">
        <Feature title="Random assortment" body="Every bag is filled with a generous, surprise mix of sweets."></Feature>
        <Feature title="A kind message" body="Add your own words for the label, or let us pick something sweet."></Feature>
        <Feature title="Delivered with care" body="Packed and posted so it arrives ready to bring a smile."></Feature>
      </section>
      </main>
    )
}