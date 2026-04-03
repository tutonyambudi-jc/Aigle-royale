import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/**
 * Réinitialise le mot de passe admin (prod ou local).
 * Par défaut : admin@aigleroyale.com / admin123
 *
 * Exemple prod :
 *   ADMIN_EMAIL="vous@domaine.com" ADMIN_PASSWORD="NouveauMotDePasseSecurise" npx tsx scripts/create-admin.ts
 */
async function createAdmin() {
  const email = (process.env.ADMIN_EMAIL || 'admin@aigleroyale.com').trim().toLowerCase()
  const plain = process.env.ADMIN_PASSWORD || 'admin123'

  if (!email) {
    console.error('ADMIN_EMAIL vide')
    process.exit(1)
  }

  console.log('🔧 Mise à jour du compte administrateur (mot de passe haché bcrypt)...')

  const adminPassword = await bcrypt.hash(plain, 10)

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      password: adminPassword,
      role: 'ADMINISTRATOR',
    },
    create: {
      email,
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'Aigle Royale',
      role: 'ADMINISTRATOR',
      referralCode: 'AR-ADMIN-0001',
      loyaltyPoints: 0,
      loyaltyTier: 'BRONZE',
    },
  })

  console.log('✅ Administrateur créé/mis à jour:')
  console.log('   Email:', admin.email)
  console.log('   Mot de passe: (celui défini dans ADMIN_PASSWORD ou admin123 par défaut)')
  console.log('   Rôle:', admin.role)
}

createAdmin()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
