import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const RECOMMENDED_MIN_AVG = 4.2
const RECOMMENDED_MIN_REVIEWS = 3

export async function GET() {
  try {
    const companies = await prisma.busCompany.findMany({
      include: {
        _count: { select: { buses: true } },
        reviews: {
          where: { isVisible: true },
          select: { rating: true },
        },
      },
    })

    const ranked = companies
      .map((company) => {
        const reviewsCount = company.reviews.length
        const avgRating =
          reviewsCount > 0
            ? company.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewsCount
            : 0
        const recommended = avgRating >= RECOMMENDED_MIN_AVG && reviewsCount >= RECOMMENDED_MIN_REVIEWS

        return {
          id: company.id,
          name: company.name,
          busesCount: company._count.buses,
          reviewsCount,
          avgRating,
          recommended,
        }
      })
      .sort((a, b) => {
        if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating
        if (b.reviewsCount !== a.reviewsCount) return b.reviewsCount - a.reviewsCount
        return a.name.localeCompare(b.name)
      })
      .map((company, index) => ({
        ...company,
        rank: index + 1,
      }))

    return NextResponse.json({
      ranked,
      rules: {
        recommendedMinAverage: RECOMMENDED_MIN_AVG,
        recommendedMinReviews: RECOMMENDED_MIN_REVIEWS,
      },
    })
  } catch (error) {
    console.error('Company ranking error:', error)
    return NextResponse.json({ error: 'Erreur lors du classement des compagnies' }, { status: 500 })
  }
}
