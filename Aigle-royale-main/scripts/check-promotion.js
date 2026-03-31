const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const busName = 'Aigle royal delux'
    console.log(`--- Checking Promotions for Bus: ${busName} ---`)

    const buses = await prisma.bus.findMany({
        where: { name: { contains: busName } }
    })

    if (buses.length === 0) {
        console.log('No bus found matching that name.')
    } else {
        for (const bus of buses) {
            console.log(`\nBus Found: ${bus.name} (${bus.plateNumber})`)
            const trips = await prisma.trip.findMany({
                where: { busId: bus.id },
                include: { route: true },
                orderBy: { departureTime: 'desc' }
            })

            if (trips.length === 0) {
                console.log('  No trips found for this bus.')
            } else {
                console.log(`  Found ${trips.length} trips. Details:`)
                trips.forEach(t => {
                    const status = t.promoActive ? '✅ ACTIVE' : '❌ INACTIVE'
                    console.log(`  Trip ${t.id.slice(0, 8)}: ${t.route.origin} -> ${t.route.destination} (${new Date(t.departureTime).toLocaleDateString()})`)
                    console.log(`    Status: ${status} | Mode: ${t.promoMode} | Price: ${t.price} | PromoPrice: ${t.promoPrice} | %: ${t.promotionPercentage}`)
                })
            }
        }
    }

    console.log('\n--- Active General Offers (apply to all) ---')
    const activeOffers = await prisma.offer.findMany({ where: { isActive: true } })
    if (activeOffers.length === 0) {
        console.log('No active general offers found.')
    } else {
        activeOffers.forEach(o => {
            console.log(`- ${o.title} (${o.code}): ${o.discountValue} ${o.discountType}`)
        })
    }
}

main().catch(e => console.error(e)).finally(async () => await prisma.$disconnect())
