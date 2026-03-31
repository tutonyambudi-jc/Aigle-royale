/** Places occupées = réservations non annulées (même logique que la recherche de trajets). */
const ACTIVE_BOOKING_STATUSES = ['CONFIRMED', 'PENDING'] as const

export function tripSeatsInfo(trip: {
  bus: { capacity: number }
  _count?: { bookings: number }
}): { remaining: number; capacity: number; occupied: number } | null {
  if (trip._count === undefined) return null
  const capacity = Number(trip.bus?.capacity) || 0
  const occupied = Math.min(trip._count.bookings, capacity)
  return {
    capacity,
    occupied,
    remaining: Math.max(0, capacity - occupied),
  }
}

export { ACTIVE_BOOKING_STATUSES }
