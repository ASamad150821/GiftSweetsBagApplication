import { useState, type ChangeEvent } from "react"
import { useNavigate } from "react-router-dom";
import { PRICE_PER_BAG, useOrderStore, type CustomerDetails } from "../store/orderStore";
import { Field } from "../components/Field";
import { customerSchema } from "../lib/validation";
import { lookupPostcode } from "../lib/postcode";
import { PostcodeStatusMessage } from "../components/PostcodeStatusMessage";

export type PostcodeStatus = 'idle' | 'loading' | 'found' | 'not-found' | 'error'
type FieldErrors = Partial<Record<keyof CustomerDetails, string>>;

export function CheckoutPage() {

    const navigate = useNavigate();
    const quantity = useOrderStore((state) => state.quantity)
    const personalMessage = useOrderStore((state) => state.personalMessage)
    const customer = useOrderStore((state) => state.customer);
    const setCustomer = useOrderStore((state) => state.setCustomer);
    const placeOrder = useOrderStore((state) => state.placeOrder);

    const [form, setForm] = useState<CustomerDetails>(customer);
    const [postcodeStatus, setPostcodeStatus] = useState<PostcodeStatus>('idle');
    const [errors, setErrors] = useState<FieldErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const total = (quantity * PRICE_PER_BAG).toFixed(2);

    function updateField(field: keyof CustomerDetails, value: string) {
        setForm((previous) => ({...previous, [field]: value}));
    }

    async function handlePostcodeBlur() {
        const postcode = form.postcode.trim();
        if (!postcode) {
            setPostcodeStatus('idle');
            return;
        };
        setPostcodeStatus('loading');
        try {
            const result = await lookupPostcode(postcode);
            setForm((previous) => {
                if (previous.postcode.trim() !== postcode || !result) return previous;
                return { ...previous, city: result.city}
            });
            setPostcodeStatus(result ? 'found' : 'not-found');
        }
        catch{
            setPostcodeStatus('error');
        }
    }

    async function formSubmit(event: ChangeEvent) {
        event.preventDefault();
        setSubmitError(null);

        const result = customerSchema.safeParse(form);

        if(!result.success) {
            const nextErrors: FieldErrors = {};

            for (const issue of result.error.issues) {
                const field = issue.path[0] as keyof CustomerDetails
                nextErrors[field] = issue.message
            }

            setErrors(nextErrors);
            return;
        }

        setErrors({});
        setCustomer(result.data);

        setIsSubmitting(true);
        try {
            await placeOrder();
            navigate("/confirmation");
        } catch {
            setSubmitError("Sorry, we couldn't place your order. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="mx-auto max-w-2xl px-6 py-12">
            <h1 className="text-3xl font-semibold text-plum">Your Details</h1>
            <p className="mt-2 text-plum/60">Tell us where to send your Sweet Surprise Gift Bag.</p>
            
            <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-plum">Order summary</h2>
                <dl className="mt-3 space-y-1 text-sm text-plum/70">
                    <div className="flex justify-between">
                        <dt>Sweet Surprise Gift Bag × {quantity}</dt>
                        <dd className="text-plum/90">£{total}</dd>
                    </div>

                    {personalMessage && (
                        <div className="flex justify-between">
                            <dt>Label Message</dt>
                            <dd className="text-plum/90">"{personalMessage}"</dd>
                        </div>
                    )}
                </dl>
            </div>

            <form onSubmit={formSubmit} className="mt-8 space-y-5">
                <Field id="name" type="text" label="Full Name" value={form.name} onChange={(value) => updateField('name', value)} error={errors.name}></Field>
                <Field id="email" type="email" label="Email Address" value={form.email} onChange={(value) => updateField('email', value)} error={errors.email}></Field>
                <Field id="address" type="text" label=" Delivery Address" value={form.address} onChange={(value) => updateField('address', value)} error={errors.address}></Field>
                <Field id="city" type="text" label="City" value={form.city} onChange={(value) => updateField('city', value)} error={errors.city}></Field>
                <Field id="postcode" type="text" label="Postcode" value={form.postcode} onChange={(value) => updateField('postcode', value)} error={errors.postcode} onBlur={handlePostcodeBlur}></Field>
                <PostcodeStatusMessage status={postcodeStatus}></PostcodeStatusMessage>

                {submitError && <p className="text-sm text-berry" role="alert">{submitError}</p>}

                <button type="submit" disabled={isSubmitting} className="mt-6 w-full rounded-xl bg-berry px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-berry/80 disabled:cursor-not-allowed disabled:opacity-60">
                    {isSubmitting ? 'Placing order…' : 'Place Order'}
                </button>
            </form>

        </main>
    )
}