const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const ticketNumber = 'AR-MKR19ESO-3IJI'
    const booking = await prisma.booking.findUnique({
        where: { ticketNumber: ticketNumber },
        include: {
            trip: {
                include: {
                    route: true
                }
            },
            user: true,
            seat: true
        }
    })

    if (booking) {
        console.log('Ticket found!')
        console.log('Status:', booking.status)
        console.log('Trip ID:', booking.tripId)
        console.log('Departure Time:', booking.trip.departureTime)
        console.log('Passenger:', booking.passengerName)
        console.log('Route:', `${booking.trip.route.origin} -> ${booking.trip.route.destination}`)
        console.log('Is Trip Active:', booking.trip.isActive)
        console.log('Checked In At:', booking.checkedInAt)
    } else {
        console.log('Ticket not found in database.')

        // Search by partial match just in case
        const partials = await prisma.booking.findMany({
            where: {
                ticketNumber: {
                    contains: '3IJI'
                }
            }
        })
        console.log('Partial matches found:', partials.length)
        partials.forEach(p => console.log(' - ', p.ticketNumber))
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
