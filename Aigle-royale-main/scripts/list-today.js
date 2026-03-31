const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const { startOfDay, endOfDay } = require('date-fns')

async function listToday() {
    const start = startOfDay(new Date())
    const end = endOfDay(new Date())

    const bookings = await prisma.booking.findMany({
        where: {
            status: 'CONFIRMED',
            trip: {
                departureTime: {
                    gte: start,
                    lte: end
                }
            }
        },
        include: {
            trip: {
                include: {
                    route: true
                }
            }
        }
    })

    console.log(`Found ${bookings.length} confirmed bookings for today:`)
    bookings.forEach(b => {
        console.log(`- Ticket: [${b.ticketNumber}] | Pax: ${b.passengerName} | Trip: ${b.trip.route.origin} -> ${b.trip.route.destination} at ${b.trip.departureTime.toISOString()}`)
    })
}

listToday()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
