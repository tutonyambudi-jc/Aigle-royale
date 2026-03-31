import { prisma } from '@/lib/prisma'
import { BusRegistrationForm } from '@/components/admin/BusRegistrationForm'
import { BusSeatConfigurator } from '@/components/admin/BusSeatConfigurator'
import Link from 'next/link'

export default async function AdminBusesPage() {
  const buses = await prisma.bus.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      company: true,
      seats: {
        select: {
          id: true,
          seatNumber: true,
          isAvailable: true,
        },
        orderBy: { seatNumber: 'asc' },
      },
      _count: { select: { seats: true, trips: true } },
    },
  })

  return (
    <>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gérer les bus</h1>
          <p className="text-gray-600">Enregistrer des compagnies, ajouter des bus, et configurer la flotte.</p>
        </div>
        <Link
          href="/admin"
          className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-semibold text-gray-800"
        >
          ← Retour admin
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <BusRegistrationForm />
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Liste des bus</h2>
            <span className="text-sm text-gray-500">{buses.length} bus</span>
          </div>

          {buses.length === 0 ? (
            <p className="text-gray-600">Aucun bus pour le moment.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2 pr-4">Image</th>
                    <th className="py-2 pr-4">Compagnie</th>
                    <th className="py-2 pr-4">Bus</th>
                    <th className="py-2 pr-4">Marque</th>
                    <th className="py-2 pr-4">Immat.</th>
                    <th className="py-2 pr-4">Sièges</th>
                    <th className="py-2 pr-4">Amenities</th>
                    <th className="py-2 pr-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {buses.map((b) => (
                    <tr key={b.id} className="border-b last:border-0 hover:bg-gray-50 group">
                      <td className="py-3 pr-4">
                        {b.imageUrl ? (
                          <img src={b.imageUrl} alt={b.name} className="w-12 h-8 object-cover rounded border border-gray-200" />
                        ) : (
                          <div className="w-12 h-8 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-[10px] text-gray-400">
                            IMG
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-4 font-medium text-gray-900">{b.company?.name ?? '-'}</td>
                      <td className="py-3 pr-4 text-gray-900">{b.name}</td>
                      <td className="py-3 pr-4 text-gray-700">{b.brand ?? '-'}</td>
                      <td className="py-3 pr-4 text-gray-700">{b.plateNumber}</td>
                      <td className="py-3 pr-4 text-gray-700">
                        {b.capacity} <span className="text-xs text-gray-400">({b._count.seats} créés)</span>
                      </td>
                      <td className="py-3 pr-4 text-gray-700">{b.amenities ?? '-'}</td>
                      <td className="py-3 pr-4">
                        <div className="flex gap-2">
                          <Link href={`/admin/buses/${b.id}`} className="text-primary-600 hover:text-primary-800 font-medium text-sm">
                            Modifier
                          </Link>
                          {b._count.seats > 0 && (
                            <>
                              <span className="text-gray-300">|</span>
                              <Link href={`/admin/buses/${b.id}/seats`} className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                                Sièges
                              </Link>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-4 text-xs text-gray-500">
            Remarque: la numérotation fine des sièges (avec exclusion du siège chauffeur) se fait via l’outil
            ci-dessous.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <BusSeatConfigurator buses={buses} />
      </div>
    </>
  )
}
