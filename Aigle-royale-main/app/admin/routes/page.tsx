import { prisma } from '@/lib/prisma'
import { RoutesTripsManager } from '@/components/admin/RoutesTripsManager'
import Link from 'next/link'

export default async function AdminRoutesPage({
  searchParams,
}: {
  searchParams: { page?: string; limit?: string }
}) {
  const page = Math.max(1, Number(searchParams.page) || 1)
  const limit = Math.max(10, Number(searchParams.limit) || 20)
  const skip = (page - 1) * limit

  const [cities, routes, buses, trips, totalTrips] = await Promise.all([
    prisma.city.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        stops: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
    }),
    prisma.route.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        originCity: true,
        destinationCity: true,
        stops: { include: { stop: { include: { city: true } } }, orderBy: { order: 'asc' } },
      },
    }),
    prisma.bus.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: { company: true },
    }),
    prisma.trip.findMany({
      orderBy: { departureTime: 'desc' },
      include: {
        bus: { include: { company: true } },
        route: { include: { originCity: true, destinationCity: true, stops: { include: { stop: { include: { city: true } } }, orderBy: { order: 'asc' } } } },
        stopovers: { include: { stop: { include: { city: true } } }, orderBy: { order: 'asc' } },
      },
      take: limit,
      skip: skip,
    }),
    prisma.trip.count(),
  ])

  return (
    <>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gérer les trajets</h1>
          <p className="text-gray-600">
            Villes (départ/arrivée), arrêts embarquement/débarquement, horaires et escales.
          </p>
        </div>
        <Link
          href="/admin"
          className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-semibold text-gray-800"
        >
          ← Retour admin
        </Link>
      </div>

      <RoutesTripsManager
        initialCities={cities as any}
        initialRoutes={routes as any}
        initialBuses={buses as any}
        initialTrips={trips as any}
        totalTrips={totalTrips}
        currentPage={page}
        currentLimit={limit}
      />
    </>
  )
}
