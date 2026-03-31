const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function debug() {
    try {
        // Find a confirmed booking
        const booking = await prisma.booking.findFirst({
            where: { status: 'CONFIRMED' }
        })

        if (!booking) {
            console.log('No confirmed booking found.')
            return
        }

        console.log('Trying to update booking:', booking.id)

        const updated = await prisma.booking.update({
            where: { id: booking.id },
            data: {
                checkedInAt: new Date(),
                baggageCount: 1,
                baggageWeight: 10,
                checkInNotes: 'Debug check-in'
            }
        })

        console.log('Success:', updated)
    } catch (error) {
        console.error('Error Details:', JSON.stringify(error, null, 2))
    } finally {
        await prisma.$disconnect()
    }
}

debug()
