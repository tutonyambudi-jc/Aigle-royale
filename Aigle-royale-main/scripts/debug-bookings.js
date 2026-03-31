const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const totalBookings = await prisma.booking.count()
    const confirmedBookingsToday = await prisma.booking.count({
        where: {
            status: 'CONFIRMED',
            trip: {
                departureTime: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    lte: new Date(new Date().setHours(23, 59, 59, 999))
                }
            }
        }
    })
    const confirmedBookingsFuture = await prisma.booking.count({
        where: {
            status: 'CONFIRMED',
            trip: {
                departureTime: {
                    gt: new Date()
                }
            }
        }
    })

    console.log('Total bookings:', totalBookings)
    console.log('Confirmed bookings today:', confirmedBookingsToday)
    console.log('Confirmed bookings future:', confirmedBookingsFuture)

    if (totalBookings > 0 && confirmedBookingsToday === 0) {
        console.log('Tip: No confirmed bookings for today. Try expanding the date range.')
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
