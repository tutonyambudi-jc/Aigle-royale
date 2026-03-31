import type { LoyaltyTier } from '@/lib/loyalty'

export type MilesRules = {
  /**
   * Base miles earned per kilometer.
   * Example: 1 => 240 km = 240 miles
   */
  baseMilesPerKm: number

  /**
   * Frequency bonus table applied based on tripsCountLastYear (>= minTrips).
   * Must be sorted by minTrips ascending; last matching entry wins.
   */
  frequencyMultipliers: Array<{ minTrips: number; multiplier: number }>

  /**
   * Optional extra multiplier based on loyalty tier.
   * If omitted, defaults to 1 for all.
   */
  tierMultipliers?: Partial<Record<LoyaltyTier, number>>

  /**
   * Rolling window size in days (default 365).
   */
  windowDays: number

  /**
   * Trip count required to qualify a traveler.
   */
  qualifyingTrips: number
}

export const DEFAULT_MILES_RULES: MilesRules = {
  baseMilesPerKm: 1,
  frequencyMultipliers: [
    { minTrips: 0, multiplier: 1 },
    { minTrips: 5, multiplier: 1.05 },
    { minTrips: 10, multiplier: 1.1 },
    { minTrips: 20, multiplier: 1.2 },
    { minTrips: 40, multiplier: 1.35 },
  ],
  tierMultipliers: {
    BRONZE: 1,
    SILVER: 1.03,
    GOLD: 1.06,
    PLATINUM: 1.1,
  },
  windowDays: 365,
  qualifyingTrips: 10,
}

export type TripForMiles = {
  /**
   * Distance in km.
   * We can use Route.distance (km).
   */
  distanceKm: number | null | undefined
  /**
   * When the ticket was paid/confirmed (best), otherwise createdAt.
   */
  at: Date
}

export type AnnualMilesSummary = {
  windowStart: Date
  windowEnd: Date
  tripsCount: number
  totalDistanceKm: number
  baseMiles: number
  bonusMiles: number
  totalMiles: number
  appliedFrequencyMultiplier: number
  appliedTierMultiplier: number
  qualified: boolean
  qualifyingTrips: number
}

export function getWindowStart(now: Date, windowDays = 365): Date {
  const d = new Date(now)
  d.setDate(d.getDate() - windowDays)
  return d
}

export function getFrequencyMultiplier(tripsCountLastYear: number, rules: MilesRules): number {
  const n = Math.max(0, Math.floor(tripsCountLastYear || 0))
  let m = 1
  for (const row of rules.frequencyMultipliers) {
    if (n >= row.minTrips) m = row.multiplier
  }
  return Number.isFinite(m) && m > 0 ? m : 1
}

export function getTierMultiplier(tier: LoyaltyTier | string | null | undefined, rules: MilesRules): number {
  const t = (typeof tier === 'string' ? tier.toUpperCase() : '') as LoyaltyTier
  const m = rules.tierMultipliers?.[t]
  return Number.isFinite(m as number) && (m as number) > 0 ? (m as number) : 1
}

/**
 * Miles earned for one trip, given distance and current frequency context.
 */
export function computeMilesForTrip(opts: {
  distanceKm: number | null | undefined
  tripsCountLastYear: number
  tier?: LoyaltyTier | string | null
  rules?: MilesRules
}): number {
  const rules = opts.rules || DEFAULT_MILES_RULES
  const distanceKm = Number.isFinite(opts.distanceKm as number) ? Math.max(0, Number(opts.distanceKm)) : 0

  const base = distanceKm * rules.baseMilesPerKm
  const freqM = getFrequencyMultiplier(opts.tripsCountLastYear, rules)
  const tierM = getTierMultiplier(opts.tier, rules)

  const miles = base * freqM * tierM
  return Math.round(miles) // miles as integer
}

/**
 * Compute miles summary for the last `windowDays` (rolling year).
 * - Filters trips within the window
 * - Computes base + bonus (frequency & tier)
 * - Determines if traveler is "qualified" by trips count
 */
export function computeAnnualMilesSummary(opts: {
  trips: TripForMiles[]
  now?: Date
  tier?: LoyaltyTier | string | null
  rules?: MilesRules
}): AnnualMilesSummary {
  const rules = opts.rules || DEFAULT_MILES_RULES
  const now = opts.now || new Date()
  const start = getWindowStart(now, rules.windowDays)

  const tripsInWindow = (opts.trips || []).filter((t) => t.at >= start && t.at <= now)
  const tripsCount = tripsInWindow.length

  const freqM = getFrequencyMultiplier(tripsCount, rules)
  const tierM = getTierMultiplier(opts.tier, rules)

  let totalDistanceKm = 0
  let baseMiles = 0
  let totalMiles = 0

  for (const t of tripsInWindow) {
    const d = Number.isFinite(t.distanceKm as number) ? Math.max(0, Number(t.distanceKm)) : 0
    totalDistanceKm += d

    const base = d * rules.baseMilesPerKm
    baseMiles += base
    totalMiles += base * freqM * tierM
  }

  baseMiles = Math.round(baseMiles)
  totalMiles = Math.round(totalMiles)
  const bonusMiles = Math.max(0, totalMiles - baseMiles)

  return {
    windowStart: start,
    windowEnd: now,
    tripsCount,
    totalDistanceKm: Math.round(totalDistanceKm * 100) / 100,
    baseMiles,
    bonusMiles,
    totalMiles,
    appliedFrequencyMultiplier: freqM,
    appliedTierMultiplier: tierM,
    qualified: tripsCount >= rules.qualifyingTrips,
    qualifyingTrips: rules.qualifyingTrips,
  }
}

/**
 * Convenience: determines if traveler qualifies, given trips in the last year.
 * You can pass a different threshold via rules.qualifyingTrips.
 */
export function isQualifiedTraveler(tripsCountLastYear: number, rules: MilesRules = DEFAULT_MILES_RULES): boolean {
  return Math.max(0, Math.floor(tripsCountLastYear || 0)) >= rules.qualifyingTrips
}

