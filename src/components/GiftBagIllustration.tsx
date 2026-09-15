export function GiftBagIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 420 460"
      className={className}
      role="img"
      aria-label="Illustration of a paper gift bag tied with a ribbon, filled with an assortment of sweets, with a heart-shaped message tag"
    >
      <ellipse cx="210" cy="430" rx="140" ry="16" fill="#3d1f3a" opacity="0.08" />

      <path
        d="M95 190 L120 420 A20 20 0 0 0 140 438 H280 A20 20 0 0 0 300 420 L325 190 Z"
        fill="var(--color-berry)"
      />
      <path
        d="M95 190 L120 420 A20 20 0 0 0 140 438 H210 L192 190 Z"
        fill="var(--color-berry-dark)"
        opacity="0.5"
      />

      <path d="M92 150 H328 L325 190 H95 Z" fill="var(--color-plum)" />

      <rect x="150" y="120" width="30" height="70" rx="8" fill="var(--color-mint)" />
      <rect x="240" y="120" width="30" height="70" rx="8" fill="var(--color-mint)" />

      <g>
        <circle cx="150" cy="135" r="26" fill="var(--color-sunny)" />
        <circle cx="150" cy="135" r="17" fill="var(--color-berry)" />
        <circle cx="150" cy="135" r="9" fill="var(--color-cream)" />
      </g>

      <g>
        <circle cx="215" cy="140" r="20" fill="var(--color-sky)" />
        <ellipse
          cx="208"
          cy="133"
          rx="6"
          ry="4"
          fill="white"
          opacity="0.55"
          transform="rotate(-20 208 133)"
        />
      </g>

      <g transform="translate(275 135) rotate(-12)">
        <path d="M-20 -9 L-32 -16 L-32 6 L-20 9 Z" fill="var(--color-sunny)" />
        <path d="M20 -9 L32 -16 L32 6 L20 9 Z" fill="var(--color-sunny)" />
        <rect x="-20" y="-9" width="40" height="18" rx="9" fill="var(--color-sunny)" />
      </g>

      <line x1="313" y1="150" x2="308" y2="180" stroke="var(--color-plum)" strokeWidth="2.5" />
      <g transform="translate(280 180)">
        <rect
          x="0"
          y="0"
          width="56"
          height="62"
          rx="10"
          fill="var(--color-cream)"
          stroke="var(--color-plum)"
          strokeWidth="3"
        />
        <circle cx="28" cy="14" r="3" fill="none" stroke="var(--color-plum)" strokeWidth="2.5" />
        <path
          d="M28 44 C22 38 16 34 16 28 a7 7 0 0 1 12 -5 a7 7 0 0 1 12 5 c0 6 -6 10 -12 16 Z"
          fill="var(--color-berry)"
        />
      </g>
    </svg>
  )
}
