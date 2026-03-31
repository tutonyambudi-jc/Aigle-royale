import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const createDemo = process.env.DEMO_SEED === 'true'

async function main() {
  console.log('🌱 Seeding database...')

  // Créer un administrateur (optionnel — activé uniquement si DEMO_SEED=true)
  let admin: any | undefined
  if (createDemo) {
    const adminPlain = process.env.ADMIN_PASSWORD || 'admin123'
    const adminPassword = await bcrypt.hash(adminPlain, 10)
    admin = await prisma.user.upsert({
      where: { email: 'admin@aigleroyale.com' },
      update: {},
      create: {
        email: 'admin@aigleroyale.com',
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'Aigle Royale',
        role: 'ADMINISTRATOR',
        referralCode: 'AR-ADMIN-0001',
        loyaltyPoints: 0,
        loyaltyTier: 'BRONZE',
      },
    })
    if (!admin.referralCode) {
      await prisma.user.update({
        where: { id: admin.id },
        data: { referralCode: 'AR-ADMIN-0001' },
      })
    }
    console.log('✅ Admin créé:', admin.email)
  } else {
    console.log('Skipped creating demo admin (DEMO_SEED!=true)')
  }

  // Créer un agent démo (optionnel)
  if (createDemo) {
    const agentPlain = process.env.AGENT_PASSWORD || 'demo123'
    const agentPassword = await bcrypt.hash(agentPlain, 10)
    const agent = await prisma.user.upsert({
      where: { email: 'agent@demo.com' },
      update: {},
      create: {
        email: 'agent@demo.com',
        password: agentPassword,
        firstName: 'Jean',
        lastName: 'Kouassi',
        phone: '+225 07 XX XX XX XX',
        role: 'AGENT',
        referralCode: 'AR-AGENT-DEMO',
        loyaltyPoints: 0,
        loyaltyTier: 'BRONZE',
      },
    })
    if (!agent.referralCode) {
      await prisma.user.update({
        where: { id: agent.id },
        data: { referralCode: 'AR-AGENT-DEMO' },
      })
    }
    console.log('✅ Agent démo créé:', agent.email)
  } else {
    console.log('Skipped creating demo agent (DEMO_SEED!=true)')
  }

  // Créer un super agent (vente en agence) - démo (optionnel)
  if (createDemo) {
    const superAgentPlain = process.env.SUPER_AGENT_PASSWORD || 'demo123'
    const superAgentPassword = await bcrypt.hash(superAgentPlain, 10)
    const superAgent = await prisma.user.upsert({
      where: { email: 'superagent@demo.com' },
      update: {},
      create: {
        email: 'superagent@demo.com',
        password: superAgentPassword,
        firstName: 'Marie',
        lastName: 'Koné',
        phone: '+225 01 23 45 67 89',
        role: 'SUPER_AGENT',
        referralCode: 'AR-SUPER-AGENT-DEMO',
        loyaltyPoints: 0,
        loyaltyTier: 'BRONZE',
        gender: 'FEMME',
        birthDate: new Date('1990-05-15'),
        city: 'Abidjan',
        passportOrIdNumber: 'CI2024AB123456',
      },
    })
    if (!superAgent.referralCode) {
      await prisma.user.update({
        where: { id: superAgent.id },
        data: { referralCode: 'AR-SUPER-AGENT-DEMO' },
      })
    }
    console.log('✅ Super Agent démo créé:', superAgent.email)
  } else {
    console.log('Skipped creating demo super agent (DEMO_SEED!=true)')
  }

  // Créer un compte logistique (planning chauffeurs) - démo (optionnel)
  if (createDemo) {
    const logisticsPlain = process.env.LOGISTICS_PASSWORD || 'demo123'
    const logisticsPassword = await bcrypt.hash(logisticsPlain, 10)
    const logistics = await prisma.user.upsert({
      where: { email: 'logistics@demo.com' },
      update: {},
      create: {
        email: 'logistics@demo.com',
        password: logisticsPassword,
        firstName: 'Logistique',
        lastName: 'Aigle Royale',
        phone: '+225 05 XX XX XX XX',
        role: 'LOGISTICS',
        referralCode: 'AR-LOGISTICS-DEMO',
        loyaltyPoints: 0,
        loyaltyTier: 'BRONZE',
      },
    })
    if (!logistics.referralCode) {
      await prisma.user.update({
        where: { id: logistics.id },
        data: { referralCode: 'AR-LOGISTICS-DEMO' },
      })
    }
    console.log('✅ Logistique démo créé:', logistics.email)
  } else {
    console.log('Skipped creating demo logistics account (DEMO_SEED!=true)')
  }

  // Nettoyage (SQLite) - évite les erreurs de contraintes FK lors de la régénération des sièges
  // On purge d'abord les tables dépendantes.
  await prisma.payment.deleteMany({})
  await prisma.commission.deleteMany({})
  await prisma.loyaltyTransaction.deleteMany({})
  await prisma.booking.deleteMany({})
  await prisma.freightPayment.deleteMany({})
  await prisma.freightOrder.deleteMany({})

  // Publicités (démo)
  await prisma.advertisement.deleteMany({})
  await prisma.advertisementInquiry.deleteMany({})

  // Repas à bord (démo)
  // @ts-ignore - le client Prisma sera régénéré après la mise à jour du schema
  await prisma.meal?.deleteMany?.({})
  const now = new Date()
  const start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const bannerSvg = (title: string, subtitle: string, bg: string) =>
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="300" viewBox="0 0 1200 300">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="${bg}" stop-opacity="1"/>
            <stop offset="1" stop-color="#111827" stop-opacity="1"/>
          </linearGradient>
        </defs>
        <rect width="1200" height="300" fill="url(#g)"/>
        <circle cx="1050" cy="60" r="110" fill="#ffffff" opacity="0.08"/>
        <circle cx="160" cy="240" r="140" fill="#ffffff" opacity="0.06"/>
        <text x="80" y="140" font-family="Arial, sans-serif" font-size="56" font-weight="800" fill="#ffffff">${title}</text>
        <text x="80" y="200" font-family="Arial, sans-serif" font-size="28" fill="#e5e7eb">${subtitle}</text>
        <text x="80" y="250" font-family="Arial, sans-serif" font-size="18" fill="#d1d5db">Aigle Royale • Espace publicitaire</text>
      </svg>`
    )}`

  if (createDemo) {
    await prisma.advertisement.createMany({
      data: [
        {
          advertiserId: admin.id,
          title: 'Annoncez ici',
          description: 'Votre publicité peut apparaître ici.',
          imageUrl: bannerSvg('Annoncez ici', 'Touchez des milliers de voyageurs', '#2563eb'),
          linkUrl: '/advertise',
          type: 'BANNER_HOMEPAGE',
          status: 'ACTIVE',
          startDate: start,
          endDate: end,
        },
        {
          advertiserId: admin.id,
          title: 'Promo partenaire',
          description: 'Espace disponible — contactez-nous.',
          imageUrl: bannerSvg('Promo partenaire', 'Affichez vos offres sur les résultats', '#16a34a'),
          linkUrl: '/advertise',
          type: 'BANNER_RESULTS',
          status: 'ACTIVE',
          startDate: start,
          endDate: end,
        },
        {
          advertiserId: admin.id,
          title: 'Publicité',
          description: 'Espace disponible — contactez-nous.',
          imageUrl: bannerSvg('Publicité', 'Visible après achat de billet', '#7c3aed'),
          linkUrl: '/advertise',
          type: 'BANNER_CONFIRMATION',
          status: 'ACTIVE',
          startDate: start,
          endDate: end,
        },
      ],
    })
  } else {
    console.log('Skipped creating demo advertisements (DEMO_SEED!=true)')
  }

  // Repas à bord (démo)
  try {
    // @ts-ignore - le client Prisma sera régénéré après la mise à jour du schema
    await prisma.meal.createMany({
      data: [
        { name: 'Poulet braisé + attiéké', description: 'Portion individuelle', price: 2500, isActive: true },
        { name: 'Sandwich', description: 'Poulet / thon (selon disponibilité)', price: 1500, isActive: true },
        { name: 'Eau + jus', description: 'Boisson', price: 700, isActive: true },
      ],
    })
  } catch (e) {
    // ok
  }

  // Créer une compagnie de bus (démo)
  const company = await prisma.busCompany.upsert({
    where: { name: 'Aigle Royale' },
    update: {},
    create: { name: 'Aigle Royale' },
  })

  // Villes (démo)
  const [abidjan, yamoussoukro, bouake] = await Promise.all([
    prisma.city.upsert({ where: { name: 'Abidjan' }, update: {}, create: { name: 'Abidjan' } }),
    prisma.city.upsert({ where: { name: 'Yamoussoukro' }, update: {}, create: { name: 'Yamoussoukro' } }),
    prisma.city.upsert({ where: { name: 'Bouaké' }, update: {}, create: { name: 'Bouaké' } }),
  ])

  // Arrêts (embarquement/débarquement) par ville
  const upsertStop = (cityId: string, name: string, type: string) =>
    prisma.cityStop.upsert({
      where: { cityId_name: { cityId, name } },
      update: { isActive: true, type },
      create: { cityId, name, type },
    })

  await Promise.all([
    upsertStop(abidjan.id, 'Gare Adjamé', 'BOTH'),
    upsertStop(abidjan.id, 'Gare Yopougon', 'EMBARK'),
    upsertStop(yamoussoukro.id, 'Gare principale', 'BOTH'),
    upsertStop(bouake.id, 'Gare routière', 'BOTH'),
  ])

  // Créer des routes
  const route1 = await prisma.route.upsert({
    where: { id: 'route-1' },
    update: {},
    create: {
      id: 'route-1',
      origin: 'Abidjan',
      destination: 'Yamoussoukro',
      distance: 240,
      duration: 3, // heures
    },
  })

  const route2 = await prisma.route.upsert({
    where: { id: 'route-2' },
    update: {},
    create: {
      id: 'route-2',
      origin: 'Abidjan',
      destination: 'Bouaké',
      distance: 350,
      duration: 4, // heures
    },
  })
  console.log('✅ Routes créées')

  // Rattacher les routes aux villes (optionnel)
  await prisma.route.update({
    where: { id: route1.id },
    data: { originCityId: abidjan.id, destinationCityId: yamoussoukro.id },
  })
  await prisma.route.update({
    where: { id: route2.id },
    data: { originCityId: abidjan.id, destinationCityId: bouake.id },
  })

  // Créer des bus
  const bus1 = await prisma.bus.upsert({
    where: { plateNumber: 'AR-001-AB' },
    update: {
      companyId: company.id,
      brand: 'Yutong',
      amenities: 'WiFi, Climatisation, USB',
      seatLayout: JSON.stringify({ rows: 10, seatsPerRow: 5, driverSeat: { present: true, numbered: false } }),
    },
    create: {
      companyId: company.id,
      plateNumber: 'AR-001-AB',
      name: 'Bus Premium 1',
      brand: 'Yutong',
      capacity: 50,
      seatLayout: JSON.stringify({ rows: 10, seatsPerRow: 5, driverSeat: { present: true, numbered: false } }),
      amenities: 'WiFi, Climatisation, USB',
      seatType: 'STANDARD',
    },
  })

  const bus2 = await prisma.bus.upsert({
    where: { plateNumber: 'AR-002-AB' },
    update: {
      companyId: company.id,
      brand: 'Mercedes',
      amenities: 'Climatisation, Sièges inclinables, USB',
      seatLayout: JSON.stringify({ rows: 6, seatsPerRow: 5, driverSeat: { present: true, numbered: false } }),
    },
    create: {
      companyId: company.id,
      plateNumber: 'AR-002-AB',
      name: 'Bus VIP 1',
      brand: 'Mercedes',
      capacity: 30,
      seatLayout: JSON.stringify({ rows: 6, seatsPerRow: 5, driverSeat: { present: true, numbered: false } }),
      amenities: 'Climatisation, Sièges inclinables, USB',
      seatType: 'VIP',
    },
  })
  console.log('✅ Bus créés')

  // Créer des sièges pour bus1
  const seats1 = []
  for (let row = 0; row < 10; row++) {
    for (let seat = 1; seat <= 5; seat++) {
      const seatNumber = `${String.fromCharCode(65 + row)}${seat}`
      seats1.push({
        busId: bus1.id,
        seatNumber,
        seatType: 'STANDARD',
        isAvailable: true,
      })
    }
  }
  // SQLite: `skipDuplicates` n'est pas supporté sur createMany
  await prisma.seat.deleteMany({ where: { busId: bus1.id } })
  await prisma.seat.createMany({
    data: seats1,
  })

  // Créer des sièges pour bus2
  const seats2 = []
  for (let row = 0; row < 6; row++) {
    for (let seat = 1; seat <= 5; seat++) {
      const seatNumber = `${String.fromCharCode(65 + row)}${seat}`
      seats2.push({
        busId: bus2.id,
        seatNumber,
        seatType: 'VIP',
        isAvailable: true,
      })
    }
  }
  await prisma.seat.deleteMany({ where: { busId: bus2.id } })
  await prisma.seat.createMany({
    data: seats2,
  })
  console.log('✅ Sièges créés')

  // Créer des trajets
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(8, 0, 0, 0)

  const trip1 = await prisma.trip.create({
    data: {
      busId: bus1.id,
      routeId: route1.id,
      departureTime: tomorrow,
      arrivalTime: new Date(tomorrow.getTime() + 180 * 60000),
      price: 5000,
      availableSeats: 50,
    },
  })

  const trip2 = await prisma.trip.create({
    data: {
      busId: bus2.id,
      routeId: route2.id,
      departureTime: new Date(tomorrow.getTime() + 2 * 60 * 60000),
      arrivalTime: new Date(tomorrow.getTime() + (2 * 60 + 240) * 60000),
      price: 8000,
      availableSeats: 30,
    },
  })
  console.log('✅ Trajets créés')

  console.log('🎉 Seeding terminé!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
