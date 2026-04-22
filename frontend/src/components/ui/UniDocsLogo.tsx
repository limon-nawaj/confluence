interface Props {
  size?: number
}

export function UniDocsLogo({ size = 28 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="ud-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="32" height="32" rx="8" fill="url(#ud-grad)" />

      {/* Document body */}
      <rect x="8" y="7" width="13" height="18" rx="2" fill="white" opacity="0.95" />

      {/* Folded corner */}
      <path d="M17 7 L21 11 L17 11 Z" fill="#6366f1" opacity="0.5" />
      <path d="M17 7 L21 11 H17 Z" fill="white" opacity="0.4" />

      {/* Text lines */}
      <rect x="10.5" y="13" width="7" height="1.5" rx="0.75" fill="#6366f1" opacity="0.5" />
      <rect x="10.5" y="16" width="9" height="1.5" rx="0.75" fill="#6366f1" opacity="0.35" />
      <rect x="10.5" y="19" width="6" height="1.5" rx="0.75" fill="#6366f1" opacity="0.35" />

      {/* Pen accent */}
      <rect x="19" y="17" width="5" height="2" rx="1" fill="white" opacity="0.9" transform="rotate(-45 21.5 18)" />
      <rect x="20.5" y="22" width="2" height="1.5" rx="0.5" fill="#fbbf24" opacity="0.9" transform="rotate(-45 21.5 22.75)" />
    </svg>
  )
}
