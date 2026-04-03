import { Navigation } from '@/components/layout/Navigation'
import { prisma } from '@/lib/prisma'
import { OperationalCitiesMap } from '@/components/maps/OperationalCitiesMap'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default async function CarteInteractivePage() {
  await cookies()

  let cityNames: string[] = []
  try {
    const cities = await prisma.city.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { name: true },
    })
    cityNames = cities.map((c) => c.name)
  } catch (e) {
    console.error('[carte] Impossible de charger les villes:', e)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Carte interactive</h1>
          <p className="text-gray-600">Découvrez les villes où nous sommes opérationnels.</p>
        </div>

        <OperationalCitiesMap cities={cityNames} />
      </div>
    </div>
  )
}

