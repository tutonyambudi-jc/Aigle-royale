import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🎯 Ajout des tarifications pour seniors et personnes handicapées...');

  // Senior citizen pricing (60+ ans, -30%)
  const seniorPricing = await prisma.passengerPricing.upsert({
    where: { passengerType: 'SENIOR' },
    update: {
      discountPercent: 30,
      minAge: 60,
      maxAge: null,
      isActive: true,
      requiresDisabilityProof: false,
      description: 'Tarif senior - 30% de réduction pour les personnes âgées de 60 ans et plus',
    },
    create: {
      passengerType: 'SENIOR',
      discountPercent: 30,
      minAge: 60,
      maxAge: null,
      isActive: true,
      requiresDisabilityProof: false,
      description: 'Tarif senior - 30% de réduction pour les personnes âgées de 60 ans et plus',
    },
  });

  console.log('✅ Tarif senior créé:', seniorPricing);

  // Disabled person pricing (-40%, requires proof)
  const disabledPricing = await prisma.passengerPricing.upsert({
    where: { passengerType: 'DISABLED' },
    update: {
      discountPercent: 40,
      minAge: null,
      maxAge: null,
      isActive: true,
      requiresDisabilityProof: true,
      description: 'Tarif handicapé - 40% de réduction pour les personnes en situation de handicap (justificatif requis)',
    },
    create: {
      passengerType: 'DISABLED',
      discountPercent: 40,
      minAge: null,
      maxAge: null,
      isActive: true,
      requiresDisabilityProof: true,
      description: 'Tarif handicapé - 40% de réduction pour les personnes en situation de handicap (justificatif requis)',
    },
  });

  console.log('✅ Tarif handicapé créé:', disabledPricing);

  console.log('\n🎉 Tarifications seniors et handicapés ajoutées avec succès!');
  console.log('📊 Résumé des tarifs:');
  console.log('  - ADULT: 0% (Prix plein)');
  console.log('  - CHILD: 50% (2-11 ans)');
  console.log('  - INFANT: 80% (0-1 an)');
  console.log('  - SENIOR: 30% (60+ ans)');
  console.log('  - DISABLED: 40% (Justificatif requis)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
