import { useState, type ChangeEvent} from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, apiRequest } from '../lib/api'
import { customerSchema } from '../lib/validation'
import { lookupPostcode } from '../lib/postcode'
import { useAuthStore } from '../store/authStore'
import { PRICE_PER_BAG, useOrderStore, type CustomerDetails, type PlacedOrder } from '../store/orderStore'

type FieldErrors = Partial<Record<keyof CustomerDetails, string>>
type PostcodeStatus = 'idle' | 'loading' | 'found' | 'not-found' | 'error'

export function CheckoutPage() {
  const navigate = useNavigate()
  const token = useAuthStore((state) => state.token)
  const quantity = useOrderStore((state) => state.quantity)
  const personalMessage = useOrderStore((state) => state.personalMessage)
  const customer = useOrderStore((state) => state.customer)
  const setCustomer = useOrderStore((state) => state.setCustomer)
  const setLastOrder = useOrderStore((state) => state.setLastOrder)

  const [errors, setErrors] = useState<FieldErrors>({})
  const [postcodeStatus, setPostcodeStatus] = useState<PostcodeStatus>('idle');
  const [form, setForm] = useState<CustomerDetails>(customer);
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const total = (quantity * PRICE_PER_BAG).toFixed(2)

  function updateField(field: keyof CustomerDetails, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }))
  }

  async function handlePostcodeBlur() {
    const postcode = form.postcode.trim()
    if (!postcode) {
      setPostcodeStatus('idle')
      return
    }

    setPostcodeStatus('loading')
    try {
      const result = await lookupPostcode(postcode)
      setForm((previous) => {
        if (previous.postcode.trim() !== postcode || !result) return previous
        return { ...previous, city: result.city }
      })
      setPostcodeStatus(result ? 'found' : 'not-found')
    } catch {
      setPostcodeStatus('error')
    }
  }

  async function handleSubmit(event: ChangeEvent) {
    event.preventDefault()
    const result = customerSchema.safeParse(form)

    if (!result.success) {
      const nextErrors: FieldErrors = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof CustomerDetails
        nextErrors[field] = issue.message
      }
      setErrors(nextErrors)
      return
    }

    setErrors({})
    setSubmitError(null)
    setCustomer(result.data)
    setSubmitting(true)

    try {
      const { order } = await apiRequest<{ order: PlacedOrder }>('/orders', {
        method: 'POST',
        token,
        body: { quantity, personalMessage, customer: result.data },
      })
      setLastOrder(order)
      navigate('/confirmation')
    } catch (err) {
      setSubmitError(
        err instanceof ApiError ? err.message : 'Could not place your order, please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-semibold text-plum">Your details</h1>
      <p className="mt-2 text-plum/60">Tell us where to send your Sweet Surprise Gift Bag.</p>

      <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-plum">Order summary</h2>
        <dl className="mt-3 space-y-1 text-sm text-plum/70">
          <div className="flex justify-between">
            <dt>Sweet Surprise Gift Bag × {quantity}</dt>
            <dd>£{total}</dd>
          </div>
          {personalMessage && (
            <div className="flex justify-between gap-4">
              <dt>Label message</dt>
              <dd className="text-right italic">"{personalMessage}"</dd>
            </div>
          )}
        </dl>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <Field
          id="name"
          label="Full name"
          value={form.name}
          error={errors.name}
          onChange={(value) => updateField('name', value)}
        />
        <Field
          id="email"
          label="Email address"
          type="email"
          value={form.email}
          error={errors.email}
          onChange={(value) => updateField('email', value)}
        />
        <Field
          id="address"
          label="Delivery address"
          value={form.address}
          error={errors.address}
          onChange={(value) => updateField('address', value)}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="city"
            label="City / Town"
            value={form.city}
            error={errors.city}
            onChange={(value) => updateField('city', value)}
          />
          <div>
            <Field
              id="postcode"
              label="Postcode"
              value={form.postcode}
              error={errors.postcode}
              onChange={(value) => updateField('postcode', value)}
              onBlur={handlePostcodeBlur}
            />
            <PostcodeStatusMessage status={postcodeStatus} />
          </div>
        </div>

        {submitError && (
          <p role="alert" className="text-sm text-berry-dark">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-berry px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-berry-dark disabled:opacity-60 sm:w-auto"
        >
          {submitting ? 'Placing order…' : `Place order — £${total}`}
        </button>
        <p className="text-xs text-plum/40">This is a demo store. No real payment is taken.</p>
      </form>
    </main>
  )
}

function Field({
  id,
  label,
  value,
  error,
  type = 'text',
  onChange,
  onBlur,
}: {
  id: keyof CustomerDetails
  label: string
  value: string
  error?: string
  type?: string
  onChange: (value: string) => void
  onBlur?: () => void
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-plum">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="mt-2 w-full rounded-xl border border-plum/20 bg-white p-3 text-sm text-plum focus:border-berry focus:outline-none"
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-berry-dark">
          {error}
        </p>
      )}
    </div>
  )
}

function PostcodeStatusMessage({ status }: { status: PostcodeStatus }) {
  if (status === 'idle') return null

  const copy: Record<Exclude<PostcodeStatus, 'idle'>, { text: string; className: string }> = {
    loading: { text: 'Looking up postcode…', className: 'text-plum/50' },
    found: { text: 'Town found and filled in from the postcode.', className: 'text-mint' },
    error: {
      text: "Couldn't verify that postcode right now — please enter your town manually.",
      className: 'text-berry-dark',
    },
    'not-found': {
      text: "We couldn't find that postcode — please enter your town manually.",
      className: 'text-berry-dark',
    },
  }

  const { text, className } = copy[status]

  return (
    <p aria-live="polite" className={`mt-1 text-xs ${className}`}>
      {text}
    </p>
  )
}
