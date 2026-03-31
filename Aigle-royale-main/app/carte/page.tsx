import { Navigation } from '@/components/layout/Navigation'
import { prisma } from '@/lib/prisma'
import { OperationalCitiesMap } from '@/components/maps/OperationalCitiesMap'

export default async function CarteInteractivePage() {
  const cities = await prisma.city.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { name: true },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Carte interactive</h1>
          <p className="text-gray-600">Découvrez les villes où nous sommes opérationnels.</p>
        </div>

        <OperationalCitiesMap cities={cities.map((c) => c.name)} />
      </div>
    </div>
  )
}

