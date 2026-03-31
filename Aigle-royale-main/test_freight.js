const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
    try {
        const trip = await prisma.trip.findFirst({ where: { isActive: true } })
        const stop = await prisma.cityStop.findFirst({ where: { isActive: true } })

        if (!trip) {
            console.log('No active trip found for test')
            return
        }

        const data = {
            tripId: trip.id,
            senderName: 'Test Sender',
            senderPhone: '123456789',
            receiverName: 'Test Receiver',
            receiverPhone: '987654321',
            weight: 10,
            type: 'Test',
            value: 1000,
            notes: 'Test notes',
            agentId: null,
            originStopId: stop?.id || null,
            destinationStopId: null,
        }

        const pricePerKg = 1000
        const price = data.weight * pricePerKg
        const trackingCode = 'TEST-' + Date.now()

        console.log('Creating freight order with stopId:', data.originStopId)
        const freightOrder = await prisma.freightOrder.create({
            data: {
                ...data,
                price,
                trackingCode,
                status: 'RECEIVED',
            },
        })
        console.log('Created:', freightOrder.id)

        const QRCode = require('qrcode')
        const qrData = JSON.stringify({
            code: freightOrder.trackingCode,
            name: freightOrder.receiverName,
            phone: freightOrder.receiverPhone,
            date: freightOrder.createdAt,
        })
        const qrCode = await QRCode.toDataURL(qrData)
        console.log('QRCode generated')

        await (prisma.freightOrder.update as any)({
            where: { id: freightOrder.id },
            data: { qrCode },
        })
        console.log('Updated with QRCode')
    } catch (e) {
        console.error('Creation failed:', e)
    } finally {
        await prisma.$disconnect()
    }
}

test()
