import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function getStatusBadgeClass(status: string) {
  if (status === 'ISSUED') return 'bg-blue-100 text-blue-800'
  if (status === 'REDEEMED') return 'bg-green-100 text-green-800'
  if (status === 'CANCELLED') return 'bg-red-100 text-red-800'
  return 'bg-gray-100 text-gray-800'
}

export default async function AdminTravelVouchersPage() {
  const vouchers = await prisma.travelVoucher.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      route: { select: { id: true, origin: true, destination: true } },
      trip: { select: { id: true, departureTime: true } },
      booking: { select: { ticketNumber: true } },
      createdBy: { select: { firstName: true, lastName: true } },
    },
  })

  return (
    <>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bons de voyage</h1>
          <p className="text-gray-600">Suivi des bons émis, utilisés et expirés</p>
        </div>
        <Link
          href="/admin/travel-vouchers/create"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          + Créer un bon
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bénéficiaire</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Montant</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Itinéraire</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Créé le</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {vouchers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  Aucun bon de voyage pour le moment.
                </td>
              </tr>
            ) : (
              vouchers.map((voucher) => (
                <tr key={voucher.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-mono text-sm text-primary-700 bg-primary-50 inline-block px-2 py-1 rounded border border-primary-100">
                      {voucher.code}
                    </div>
                    {voucher.booking?.ticketNumber ? (
                      <div className="text-xs text-gray-500 mt-1">Billet: {voucher.booking.ticketNumber}</div>
                    ) : null}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{voucher.beneficiaryName}</div>
                    {voucher.beneficiaryPhone ? (
                      <div className="text-sm text-gray-600">{voucher.beneficiaryPhone}</div>
                    ) : null}
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {formatCurrency(voucher.valueAmount, 'FC')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {voucher.route ? (
                      <>
                        <div>
                          {voucher.route.origin} - {voucher.route.destination}
                        </div>
                        {voucher.trip?.departureTime ? (
                          <div className="text-xs text-gray-500">
                            Départ: {format(voucher.trip.departureTime, 'dd/MM/yyyy HH:mm', { locale: fr })}
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <span className="text-gray-400">Non limité à une ligne</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(voucher.status)}`}>
                      {voucher.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>{format(voucher.createdAt, 'dd/MM/yyyy HH:mm', { locale: fr })}</div>
                    {voucher.createdBy ? (
                      <div className="text-xs text-gray-500">
                        Par {voucher.createdBy.firstName} {voucher.createdBy.lastName}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/travel-vouchers/create?${new URLSearchParams({
                        title: voucher.title || '',
                        beneficiaryName: voucher.beneficiaryName || '',
                        beneficiaryPhone: voucher.beneficiaryPhone || '',
                        beneficiaryEmail: voucher.beneficiaryEmail || '',
                        valueAmount: String(voucher.valueAmount),
                        passengerCount: String(voucher.passengerCount || 1),
                        validUntil: voucher.validUntil ? voucher.validUntil.toISOString().slice(0, 10) : '',
                        routeId: voucher.route?.id || '',
                        tripId: voucher.trip?.id || '',
                        notes: voucher.notes || '',
                      }).toString()}`}
                      className="text-primary-600 hover:text-primary-800 font-medium text-sm"
                    >
                      Dupliquer
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
