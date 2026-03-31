import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdmin() {
  console.log('🔧 Création de l\'administrateur...')

  const adminPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@aigleroyale.com' },
    update: {
      password: adminPassword,
      role: 'ADMINISTRATOR',
    },
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

  console.log('✅ Administrateur créé/mis à jour:')
  console.log('   Email:', admin.email)
  console.log('   Mot de passe: admin123')
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
