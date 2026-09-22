import type { PostcodeStatus } from "../pages/CheckoutPage";

export function PostcodeStatusMessage({ status }: { status: PostcodeStatus }) {
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