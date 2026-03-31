import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const RECOMMENDED_MIN_AVG = 4.2
const RECOMMENDED_MIN_REVIEWS = 3

async function computeStats(companyId: string) {
  const reviews = await prisma.companyReview.findMany({
    where: { companyId, isVisible: true },
    select: { rating: true },
  })
  const count = reviews.length
  const avg = count > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0
  const recommended = avg >= RECOMMENDED_MIN_AVG && count >= RECOMMENDED_MIN_REVIEWS
  return { count, avg, recommended }
}

async function main() {
  const company = await prisma.busCompany.findFirst({
    where: { name: 'Aigle Royale' },
    select: { id: true, name: true },
  })
  if (!company) throw new Error('Compagnie Aigle Royale introuvable')

  const lowReviewUser = await prisma.user.findFirst({
    where: { email: 'logistics@demo.com' },
    select: { id: true },
  })
  if (!lowReviewUser) throw new Error('Utilisateur logistics@demo.com introuvable')

  const before = await computeStats(company.id)
  console.log('--- AVANT RE-AFFICHAGE ---')
  console.log(`Compagnie: ${company.name}`)
  console.log(`Avis visibles: ${before.count}`)
  console.log(`Moyenne: ${before.avg.toFixed(2)}/5`)
  console.log(`Badge recommande: ${before.recommended ? 'OUI' : 'NON'}`)

  await prisma.companyReview.update({
    where: {
      userId_companyId: { userId: lowReviewUser.id, companyId: company.id },
    },
    data: { isVisible: true },
  })

  const after = await computeStats(company.id)
  console.log('--- APRES RE-AFFICHAGE (avis 2/5 visible) ---')
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
