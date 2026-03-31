/**
 * Utilities for calculating seat availability per segment on routes with intermediate stops
 */

interface RouteStop {
  id: string
  order: number
  role: string
  stopId: string
}

interface Booking {
  id: string
  seatId: string
  boardingStopId?: string | null
  alightingStopId?: string | null
}

interface Seat {
  id: string
  seatNumber: string
  isAvailable: boolean
}

/**
 * Calculate which seats are available for a specific segment of a route
 * @param allSeats - All seats in the bus
 * @param bookings - All confirmed/pending bookings for this trip
 * @param routeStops - Ordered list of stops on the route
 * @param requestedBoardingStopId - Where the passenger wants to board (null = origin)
 * @param requestedAlightingStopId - Where the passenger wants to alight (null = destination)
 * @returns Array of available seat IDs for the requested segment
 */
export function getAvailableSeatsForSegment(
  allSeats: Seat[],
  bookings: Booking[],
  routeStops: RouteStop[],
  requestedBoardingStopId?: string | null,
  requestedAlightingStopId?: string | null
): Seat[] {
  // If no intermediate stops, use simple logic
  if (!routeStops || routeStops.length === 0) {
    const occupiedSeatIds = new Set(bookings.map(b => b.seatId))
    return allSeats.filter(seat => seat.isAvailable && !occupiedSeatIds.has(seat.id))
  }

  // Build ordered list of all points on route: origin, stops, destination
  const orderedStops = routeStops.sort((a, b) => a.order - b.order)
  
  // Determine boarding and alighting order positions
  let boardingOrder = 0 // Origin is position 0
  let alightingOrder = orderedStops.length + 1 // Destination is last position
  
  if (requestedBoardingStopId) {
    const boardingStop = orderedStops.find(s => s.stopId === requestedBoardingStopId)
    if (boardingStop) {
      boardingOrder = boardingStop.order
    }
  }
  
  if (requestedAlightingStopId) {
    const alightingStop = orderedStops.find(s => s.stopId === requestedAlightingStopId)
    if (alightingStop) {
      alightingOrder = alightingStop.order
    }
  }

  // Check each seat for conflicts with existing bookings
  const availableSeats = allSeats.filter(seat => {
    if (!seat.isAvailable) return false
    
    // Check if any booking conflicts with our segment
    const hasConflict = bookings.some(booking => {
      if (booking.seatId !== seat.id) return false
      
      // Determine booking's segment
      let bookingBoardingOrder = 0
      let bookingAlightingOrder = orderedStops.length + 1
      
      if (booking.boardingStopId) {
        const stop = orderedStops.find(s => s.stopId === booking.boardingStopId)
        if (stop) bookingBoardingOrder = stop.order
      }
      
      if (booking.alightingStopId) {
        const stop = orderedStops.find(s => s.stopId === booking.alightingStopId)
        if (stop) bookingAlightingOrder = stop.order
      }
      
      // Check if segments overlap
      // Two segments overlap if: max(start1, start2) < min(end1, end2)
      const overlapStart = Math.max(boardingOrder, bookingBoardingOrder)
      const overlapEnd = Math.min(alightingOrder, bookingAlightingOrder)
      
      return overlapStart < overlapEnd
    })
    
    return !hasConflict
  })
  
  return availableSeats
}

/**
 * Calculate how many seats are available for different segments of a route
 * This is useful for displaying availability when users search by intermediate stops
 */
export function calculateSegmentAvailability(
  totalSeats: number,
  bookings: Booking[],
  routeStops: RouteStop[]
): Map<string, number> {
  const availability = new Map<string, number>()
  
  // For each possible segment combination
  const allPoints = [
    { id: 'origin', order: 0 },
    ...routeStops.map(s => ({ id: s.stopId, order: s.order })),
    { id: 'destination', order: routeStops.length + 1 }
  ]
  
  for (let i = 0; i < allPoints.length - 1; i++) {
    for (let j = i + 1; j < allPoints.length; j++) {
      const fromPoint = allPoints[i]
      const toPoint = allPoints[j]
      
      // Count seats occupied in this segment
      const occupiedInSegment = bookings.filter(booking => {
        let bookingStart = 0
        let bookingEnd = routeStops.length + 1
        
        if (booking.boardingStopId) {
          const stop = routeStops.find(s => s.stopId === booking.boardingStopId)
          if (stop) bookingStart = stop.order
        }
        
        if (booking.alightingStopId) {
          const stop = routeStops.find(s => s.stopId === booking.alightingStopId)
          if (stop) bookingEnd = stop.order
        }
        
        // Check overlap
        const overlapStart = Math.max(fromPoint.order, bookingStart)
        const overlapEnd = Math.min(toPoint.order, bookingEnd)
        return overlapStart < overlapEnd
      }).length
      
      const segmentKey = `${fromPoint.id}-${toPoint.id}`
      availability.set(segmentKey, totalSeats - occupiedInSegment)
    }
  }
  
  return availability
}
