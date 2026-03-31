const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testIntermediateStops() {
  console.log('🔍 Test des arrêts intermédiaires...\n')

  // 1. Vérifier s'il y a des routes
  const routes = await prisma.route.findMany({
    where: { isActive: true },
    include: {
      originCity: true,
      destinationCity: true
    },
    take: 3
  })
  
  console.log(`✅ Routes trouvées: ${routes.length}`)
  if (routes.length > 0) {
    console.log(`   Exemple: ${routes[0].originCity.name} → ${routes[0].destinationCity.name}`)
  }

  // 2. Vérifier s'il y a des CityStops
  const cityStops = await prisma.cityStop.findMany({
    where: { isActive: true },
    include: { city: true },
    take: 5
  })
  
  console.log(`\n✅ Arrêts de ville trouvés: ${cityStops.length}`)
  cityStops.forEach(stop => {
    console.log(`   - ${stop.name} (${stop.city.name})`)
  })

  // 3. Vérifier s'il y a des RouteStops
  const routeStops = await prisma.routeStop.findMany({
    include: {
      route: {
        include: {
          originCity: true,
          destinationCity: true
        }
      },
      stop: {
        include: { city: true }
      }
    }
  })
  
  console.log(`\n✅ Arrêts de route configurés: ${routeStops.length}`)
  if (routeStops.length > 0) {
    routeStops.forEach(rs => {
      console.log(`   - Route: ${rs.route.originCity.name} → ${rs.route.destinationCity.name}`)
      console.log(`     Arrêt: ${rs.stop.name} (${rs.stop.city.name}) - Ordre: ${rs.order} - Rôle: ${rs.role}`)
    })
  }

  // 4. Vérifier les bus qui permettent les arrêts intermédiaires
  const busesWithStops = await prisma.bus.findMany({
    where: { allowsIntermediateStops: true }
  })
  
  console.log(`\n✅ Bus permettant les arrêts intermédiaires: ${busesWithStops.length}`)
  if (busesWithStops.length > 0) {
    busesWithStops.forEach(bus => {
      console.log(`   - ${bus.registrationNumber} (${bus.capacity} places)`)
    })
  }

  console.log('\n✅ Test terminé!')
  await prisma.$disconnect()
}

testIntermediateStops().catch(console.error)
