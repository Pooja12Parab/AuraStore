// Payment-provider inline SVG glyphs (no external assets).
// All paths are simplified monograms; rendered at ~36×24 in the footer.

type Props = { className?: string; title: string }

const base = (label: string, dark: string) => ({
  role: 'img',
  'aria-label': label,
  viewBox: '0 0 60 24',
  xmlns: 'http://www.w3.org/2000/svg',
  fill: dark,
  className: 'h-6 w-auto',
})

export function VisaLogo({ className, title = 'Visa' }: Props) {
  return (
    <svg {...base(title, '#1a1f71')} className={className}>
      <path
        d="M22.4 5.4h-3.2c-.7 0-1.2.4-1.4 1L13 18.6h3.6s.6-1.5.7-1.9h4.4c.1.4.4 1.9.4 1.9h3.2L22.4 5.4zm-4.3 8.5c.3-.7 1.3-3.3 1.3-3.3s.3-.7.4-1l.2.9.7 3.4h-2.6zM40 5.4c-1.4 0-2.5.4-3.3 1.2-.9.8-1.2 1.9-1.2 3 0 2 1.4 3 2.7 3.7 1.3.7 1.7 1.1 1.7 1.7 0 .9-1 1.3-1.9 1.3-1.3 0-2-.4-2-.4l-.4 1.9s1.1.5 2.7.5c2.8 0 4.6-1.5 4.6-3.7 0-1.5-1-2.4-2.6-3.2-1.1-.5-1.7-.9-1.7-1.5 0-.5.5-1 1.5-1 1 0 1.7.3 1.7.3l.4-1.9c-.4-.2-1.2-.4-2.2-.4zm-19.4 0L17 18.6h3.4l3.5-13.2h-3.3zM30 5.4c-2 0-3.4 1.2-3.4 3.6 0 2.4 1.6 3.6 3.4 3.6 1.7 0 2.6-.8 2.8-1l-.4-1.7s-.9.7-2 .7c-1.5 0-2.3-1.1-2.3-2.3 0-1.6 1-2.6 2.3-2.6 1 0 1.7.4 1.7.4l.3-1.7c-.5-.2-1.3-.4-2.4-.4zM50.6 5.4l-2.7 7.1-.4-1.5c-.6-1.6-2-2.5-3.4-2.8l1.9 9.4h3.4l4.7-12.2h-3.5z"
      />
    </svg>
  )
}

export function MastercardLogo({ className, title = 'Mastercard' }: Props) {
  return (
    <svg {...base(title, '#000000')} className={className}>
      <circle cx="22" cy="12" r="8" fill="#eb001b" />
      <circle cx="38" cy="12" r="8" fill="#f79e1b" />
      <path
        d="M30 6.4c1.6 1.5 2.6 3.6 2.6 6s-1 4.5-2.6 6c-1.6-1.5-2.6-3.6-2.6-6s1-4.5 2.6-6z"
        fill="#ff5f00"
      />
    </svg>
  )
}

export function AmexLogo({ className, title = 'American Express' }: Props) {
  return (
    <svg {...base(title, '#2e77bc')} className={className}>
      <rect width="60" height="24" fill="#2e77bc" rx="3" />
      <text
        x="30"
        y="14.5"
        fontSize="6.5"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontWeight="800"
        textAnchor="middle"
        fill="white"
        letterSpacing="0.5"
      >
        AMEX
      </text>
    </svg>
  )
}

export function PayPalLogo({ className, title = 'PayPal' }: Props) {
  return (
    <svg {...base(title, '#003087')} className={className}>
      <path
        d="M11 5h6.5c2.4 0 4.4 1.2 4.4 3.7 0 2.9-2 4.7-4.7 4.7h-3.1l-1 5.6H10L11 5zm3.1 6.2c1.5 0 2.7-.7 2.7-2.3 0-1-.7-1.5-1.7-1.5h-1.6l-.5 3.8h1.1zM24 5h6.5c2.4 0 4.4 1.2 4.4 3.7 0 2.9-2 4.7-4.7 4.7h-3.1l-1 5.6H23L24 5zm3.1 6.2c1.5 0 2.7-.7 2.7-2.3 0-1-.7-1.5-1.7-1.5h-1.6l-.5 3.8h1.1zM36 5h10v2.4h-7.1l-.4 2.4h6.5v2.4h-6.5l-.5 3.2h7.4V19H36L36 5zM48 5h2.4l-1 14h-2.4l1-14zM40 5h2.6l2.4 8.3.8-8.3h2.4l-1 14h-2.6l-2.4-8.3-.8 8.3h-2.4l1-14z"
      />
    </svg>
  )
}

export function RuPayLogo({ className, title = 'RuPay' }: Props) {
  return (
    <svg {...base(title, '#097ccd')} className={className}>
      <rect width="60" height="24" fill="#097ccd" rx="3" />
      <text
        x="30"
        y="14.5"
        fontSize="6"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontWeight="800"
        textAnchor="middle"
        fill="white"
        letterSpacing="0.5"
      >
        RuPay
      </text>
    </svg>
  )
}
