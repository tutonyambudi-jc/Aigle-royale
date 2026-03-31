const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const { startOfDay } = require('date-fns')

async function testSearch() {
    const query = 'AR-MKR19ESO-3IJI'.toLowerCase()
    const start = startOfDay(new Date())

    console.log('Query:', query)
    console.log('Start of Day:', start)

    const bookings = await prisma.booking.findMany({
        where: {
            trip: {
                departureTime: {
                    gte: start,
                },
                isActive: true,
            },
            status: 'CONFIRMED',
            OR: [
                { ticketNumber: { contains: query } },
                { qrCode: { contains: query } },
                { passengerName: { contains: query } },
                { passengerPhone: { contains: query } },
            ]
        },
        include: {
            trip: true
        }
    })

    console.log('Results found:', bookings.length)
    if (bookings.length > 0) {
        console.log('Result 0 Ticket:', bookings[0].ticketNumber)
        console.log('Result 0 Trip Departure:', bookings[0].trip.departureTime)
    }
}

testSearch()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
