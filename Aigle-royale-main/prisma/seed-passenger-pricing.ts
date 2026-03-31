import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🎫 Initialisation des tarifs par type de passager...')

  // Adult pricing (100% - pas de réduction)
  const adult = await prisma.passengerPricing.upsert({
    where: { passengerType: 'ADULT' },
    update: {},
    create: {
      passengerType: 'ADULT',
      discountPercent: 0,
      minAge: 12,
      maxAge: null,
      description: 'Tarif adulte normal - Prix plein',
      isActive: true,
    },
  })
  console.log('✅ Tarif ADULTE créé:', adult)

  // Child pricing (50% discount)
  const child = await prisma.passengerPricing.upsert({
    where: { passengerType: 'CHILD' },
    update: {},
    create: {
      passengerType: 'CHILD',
      discountPercent: 50,
      minAge: 2,
      maxAge: 11,
      description: 'Tarif enfant - 50% de réduction (2-11 ans)',
      isActive: true,
    },
  })
  console.log('✅ Tarif ENFANT créé:', child)

  // Infant pricing (80% discount - presque gratuit)
  const infant = await prisma.passengerPricing.upsert({
    where: { passengerType: 'INFANT' },
    update: {},
    create: {
      passengerType: 'INFANT',
      discountPercent: 80,
      minAge: 0,
      maxAge: 1,
      description: 'Tarif bébé - 80% de réduction (0-1 an, sur les genoux)',
      isActive: true,
    },
  })
  console.log('✅ Tarif BÉBÉ créé:', infant)

  console.log('\n✨ Tarification par type de passager initialisée avec succès!')
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
