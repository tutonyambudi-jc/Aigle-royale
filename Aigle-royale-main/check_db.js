const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        const columns = await prisma.$queryRaw`PRAGMA table_info(freight_orders)`
        const names = columns.map(c => c.name)
        console.log('Columns:', names.join(', '))

        if (names.includes('qrCode')) console.log('qrCode exists')
        else console.log('qrCode MISSING')

        if (names.includes('originStopId')) console.log('originStopId exists')
        else console.log('originStopId MISSING')
    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
