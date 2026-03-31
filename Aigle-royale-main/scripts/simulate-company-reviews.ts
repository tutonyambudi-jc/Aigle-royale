import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const RECOMMENDED_MIN_AVG = 4.2
const RECOMMENDED_MIN_REVIEWS = 3

async function computeStats(companyId: string) {
  const reviews = await prisma.companyReview.findMany({
    where: { companyId, isVisible: true },
    select: { rating: true, user: { select: { email: true } } },
  })
  const count = reviews.length
  const avg = count > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0
  const recommended = avg >= RECOMMENDED_MIN_AVG && count >= RECOMMENDED_MIN_REVIEWS
  return { count, avg, recommended, reviews }
}

async function main() {
  const company = await prisma.busCompany.findFirst({
    where: { name: 'Aigle Royale' },
    select: { id: true, name: true },
  })
  if (!company) throw new Error('Compagnie Aigle Royale introuvable')

  const users = await prisma.user.findMany({
    where: {
      email: {
        in: [
          'admin@aigleroyale.com',
          'agent@demo.com',
          'superagent@demo.com',
          'logistics@demo.com',
        ],
      },
    },
    select: { id: true, email: true },
  })

  if (users.length < 4) {
    throw new Error('Utilisateurs démo insuffisants. Lancez npm run db:seed.')
  }

  const ratingByEmail: Record<string, number> = {
    'admin@aigleroyale.com': 5,
    'agent@demo.com': 4,
    'superagent@demo.com': 5,
    'logistics@demo.com': 2,
  }

  for (const u of users) {
    await prisma.companyReview.upsert({
      where: { userId_companyId: { userId: u.id, companyId: company.id } },
      create: {
        userId: u.id,
        companyId: company.id,
        rating: ratingByEmail[u.email] ?? 4,
        comment: `Avis simulation ${u.email}`,
        isVerified: true,
        isVisible: true,
      },
      update: {
        rating: ratingByEmail[u.email] ?? 4,
        comment: `Avis simulation ${u.email}`,
        isVerified: true,
        isVisible: true,
      },
    })
  }

  const before = await computeStats(company.id)
  console.log('--- AVANT MODERATION ---')
  console.log(`Compagnie: ${company.name}`)
  console.log(`Avis visibles: ${before.count}`)
  console.log(`Moyenne: ${before.avg.toFixed(2)}/5`)
  console.log(`Badge recommande: ${before.recommended ? 'OUI' : 'NON'}`)

  const lowReviewUser = users.find((u) => u.email === 'logistics@demo.com')
  if (!lowReviewUser) throw new Error('Utilisateur cible introuvable')

  await prisma.companyReview.update({
    where: { userId_companyId: { userId: lowReviewUser.id, companyId: company.id } },
    data: { isVisible: false },
  })

  const after = await computeStats(company.id)
  console.log('--- APRES MODERATION (avis 2/5 masque) ---')
  console.log(`Avis visibles: ${after.count}`)
  console.log(`Moyenne: ${after.avg.toFixed(2)}/5`)
  console.log(`Badge recommande: ${after.recommended ? 'OUI' : 'NON'}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
