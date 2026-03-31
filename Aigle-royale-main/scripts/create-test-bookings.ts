import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@aigleroyale.com' },
  })
  if (!admin) throw new Error('Admin introuvable')

  const trips = await prisma.trip.findMany({
    where: { departureTime: { gte: new Date() } },
    orderBy: { departureTime: 'asc' },
    take: 2,
  })
  if (trips.length === 0) throw new Error('Aucun trajet futur')

  let created = 0
  for (const trip of trips) {
    const seats = await prisma.seat.findMany({
      where: { busId: trip.busId },
      orderBy: { seatNumber: 'asc' },
      take: 2,
    })

    for (let i = 0; i < seats.length; i++) {
      const seat = seats[i]
      const ticketNumber = `TEST-${trip.id.slice(0, 6).toUpperCase()}-${seat.seatNumber}-${Date.now()
        .toString()
        .slice(-4)}-${i}`

      await prisma.booking.create({
        data: {
          tripId: trip.id,
          userId: admin.id,
          seatId: seat.id,
          passengerName: i === 0 ? 'Client Test A' : 'Client Test B',
          passengerPhone: '+2250700000000',
          passengerEmail: 'client.test@example.com',
          passengerType: 'ADULT',
          status: i === 0 ? 'PENDING' : 'CONFIRMED',
          ticketNumber,
          totalPrice: trip.price,
          basePrice: trip.price,
          discountAmount: 0,
        },
      })
      created++
    }
  }

  console.log(`TEST_BOOKINGS_CREATED=${created}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
