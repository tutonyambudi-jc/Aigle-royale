export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'

export function tierLabel(tier: string): string {
  if (tier === 'PLATINUM') return 'Platinum'
  if (tier === 'GOLD') return 'Or'
  if (tier === 'SILVER') return 'Argent'
  return 'Bronze'
}

export function getLoyaltyProgress(points: number): {
  currentTier: LoyaltyTier
  nextTier: LoyaltyTier | null
  currentMin: number
  nextAt: number | null
  progress01: number
  pointsToNext: number | null
} {
  const p = Number.isFinite(points) ? Math.max(0, points) : 0

  if (p >= 500) {
    return {
      currentTier: 'PLATINUM',
      nextTier: null,
      currentMin: 500,
      nextAt: null,
      progress01: 1,
      pointsToNext: null,
    }
  }
  if (p >= 250) {
    const currentMin = 250
    const nextAt = 500
    const progress01 = (p - currentMin) / (nextAt - currentMin)
    return {
      currentTier: 'GOLD',
      nextTier: 'PLATINUM',
      currentMin,
      nextAt,
      progress01: Math.min(1, Math.max(0, progress01)),
      pointsToNext: Math.max(0, nextAt - p),
    }
  }
  if (p >= 100) {
    const currentMin = 100
    const nextAt = 250
    const progress01 = (p - currentMin) / (nextAt - currentMin)
    return {
      currentTier: 'SILVER',
      nextTier: 'GOLD',
      currentMin,
      nextAt,
      progress01: Math.min(1, Math.max(0, progress01)),
      pointsToNext: Math.max(0, nextAt - p),
    }
  }

  const currentMin = 0
  const nextAt = 100
  const progress01 = (p - currentMin) / (nextAt - currentMin)
  return {
    currentTier: 'BRONZE',
    nextTier: 'SILVER',
    currentMin,
    nextAt,
    progress01: Math.min(1, Math.max(0, progress01)),
    pointsToNext: Math.max(0, nextAt - p),
  }
}

