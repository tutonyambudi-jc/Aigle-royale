/**
 * Utility functions for booking payment deadlines and auto-cancellation
 */

interface BookingWithTrip {
    id: string
    createdAt: Date
    status: string
    trip: {
        departureTime: Date
    }
    payment?: {
        status: string
        method: string
    } | null
}

/**
 * Calculate the payment deadline for a booking based on trip timing
 * - Trips > 5 days away: 24 hours to pay
 * - Trips < 48 hours away: 2 hours to pay
 * - Trips between 48h and 5 days: 24 hours to pay (default)
 */
export function getPaymentDeadline(booking: BookingWithTrip): Date {
    const now = new Date()
    const bookingTime = new Date(booking.createdAt)
    const departureTime = new Date(booking.trip.departureTime)

    // Calculate time until departure in hours
    const hoursUntilDeparture = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    // Determine payment window based on departure time
    let paymentWindowHours: number

    // convert days to hours for clarity: 5 days = 120 hours
    if (hoursUntilDeparture < 48) {
        // Less than 48 hours: 2 hours to pay
        paymentWindowHours = 2
    } else if (hoursUntilDeparture > 120) {
        // More than 5 days: 24 hours to pay
        paymentWindowHours = 24
    } else {
        // Between 48h and 5 days: 24 hours (default)
        paymentWindowHours = 24
    }

    // Calculate deadline
    const deadline = new Date(bookingTime.getTime() + paymentWindowHours * 60 * 60 * 1000)

    return deadline
}

/**
 * Check if a booking should be automatically cancelled
 * Only applies to online bookings (not CASH, not agent bookings)
 */
export function shouldCancelBooking(booking: BookingWithTrip): boolean {
    // Only cancel PENDING bookings
    if (booking.status !== 'PENDING') {
        return false
    }

    // Only cancel if payment is pending
    if (booking.payment?.status === 'PAID') {
        return false
    }

    // Don't cancel CASH payments (handled by agents)
    if (booking.payment?.method === 'CASH') {
        return false
    }

    // Check if payment deadline has passed
    const deadline = getPaymentDeadline(booking)
    const now = new Date()

    return now > deadline
}

/**
 * Get the time remaining until payment deadline
 * Returns an object with hours, minutes, and a formatted string
 */
export function getPaymentTimeRemaining(booking: BookingWithTrip): {
    totalMinutes: number
    hours: number
    minutes: number
    isExpired: boolean
    formatted: string
} {
    const deadline = getPaymentDeadline(booking)
    const now = new Date()
    const diffMs = deadline.getTime() - now.getTime()
    const totalMinutes = Math.floor(diffMs / (1000 * 60))

    if (totalMinutes <= 0) {
        return {
            totalMinutes: 0,
            hours: 0,
            minutes: 0,
            isExpired: true,
            formatted: 'Expiré'
        }
    }

    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    let formatted: string
    if (hours > 0) {
        formatted = `${hours}h ${minutes}min`
    } else {
        formatted = `${minutes}min`
    }

    return {
        totalMinutes,
        hours,
        minutes,
        isExpired: false,
        formatted
    }
}

/**
 * Check if a booking needs urgent attention (less than 30 minutes remaining)
 */
export function isPaymentUrgent(booking: BookingWithTrip): boolean {
    const timeRemaining = getPaymentTimeRemaining(booking)
    return !timeRemaining.isExpired && timeRemaining.totalMinutes <= 30
}
