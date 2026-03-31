'use client'

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

type RatingBadgeProps = {
  value: number
  max?: number
  /** Note entière (avis) : étoiles + pastille N/5 */
  variant?: 'integer' | 'average'
  size?: 'sm' | 'md'
}

export function RatingBadge({ value, max = 5, variant = 'integer', size = 'md' }: RatingBadgeProps) {
  const v = Math.min(max, Math.max(0, value))
  const starClass = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
  const textSm = size === 'sm' ? 'text-[11px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'

  if (variant === 'average') {
    const text = v.toFixed(2).replace('.', ',')
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-amber-50 font-bold text-amber-900 ring-1 ring-amber-200/80 shadow-sm tabular-nums ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'}`}
      >
        <StarIcon className={`${starClass} shrink-0 text-amber-500`} />
        <span>{text}</span>
        <span className="font-semibold text-amber-800/80">/ {max}</span>
      </span>
    )
  }

  const n = Math.round(v)
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${n} sur ${max} étoiles`}>
        {Array.from({ length: max }, (_, i) => (
          <StarIcon key={i} className={`${starClass} ${i < n ? 'text-amber-400' : 'text-gray-200'}`} />
        ))}
      </span>
      <span
        className={`inline-flex items-center rounded-full bg-amber-100 font-bold text-amber-900 tabular-nums ${textSm}`}
      >
        {n}/{max}
      </span>
    </span>
  )
}
