import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { formatCurrency, type DisplayCurrency } from '@/lib/utils'
import { Navigation } from '@/components/layout/Navigation'
import Link from 'next/link'
import { PrintButton } from '@/components/PrintButton'
import { cookies } from 'next/headers'

async function getFreightOrder(id: string) {
  const order = await prisma.freightOrder.findUnique({
    where: { id },
    include: {
      trip: {
        include: {
          route: true,
          bus: true,
        },
      },
      payment: true,
    },
  })

  return order
}

export default async function FreightOrderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const p = await params
  const session = await getServerSession(authOptions)
  const order = await getFreightOrder(p.id)
  const cookieStore = await cookies()
  const currency: DisplayCurrency = cookieStore.get('ar_currency')?.value === 'USD' ? 'USD' : 'FC'

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Commande introuvable</h1>
          <Link href="/freight" className="text-primary-600 hover:underline">
            Retour au transport de colis
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Commande créée avec succès !</h1>
            <p className="text-gray-600">Votre colis a été enregistré et sera transporté avec le bus sélectionné.</p>
          </div>

          {/* Order Details */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="border-2 border-dashed border-primary-300 rounded-lg p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Aigle Royale</h2>
                  <p className="text-sm text-gray-600">Reçu de transport de colis</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Code de suivi</div>
                  <div className="text-lg font-bold text-primary-600">{order.trackingCode}</div>
                </div>
              </div>

              {/* Trip Details */}
              <div className="space-y-4 mb-6">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Trajet</div>
                  <div className="text-lg font-semibold">
                    {order.trip.route.origin} → {order.trip.route.destination}
                  </div>
                  <div className="text-sm text-gray-600">
                    Départ: {format(new Date(order.trip.departureTime), 'dd MMMM yyyy à HH:mm')}
                  </div>
                </div>
              </div>

              {/* Sender & Receiver */}
              <div className="grid md:grid-cols-2 gap-4 mb-6 pt-4 border-t">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Expéditeur</div>
                  <div className="font-semibold">{order.senderName}</div>
                  <div className="text-sm text-gray-600">{order.senderPhone}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Destinataire</div>
                  <div className="font-semibold">{order.receiverName}</div>
                  <div className="text-sm text-gray-600">{order.receiverPhone}</div>
                </div>
              </div>

              {/* Package Info */}
              <div className="grid md:grid-cols-2 gap-4 mb-6 pt-4 border-t">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Poids</div>
                  <div className="font-semibold">{order.weight} kg</div>
                </div>
                {order.type && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Type</div>
                    <div className="font-semibold">{order.type}</div>
                  </div>
                )}
                {order.value && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Valeur déclarée</div>
                    <div className="font-semibold">{formatCurrency(order.value, currency)}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-600 mb-1">Statut</div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                    order.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                    {order.status === 'DELIVERED' ? 'Livré' :
                      order.status === 'IN_TRANSIT' ? 'En transit' :
                        order.status === 'RECEIVED' ? 'Reçu' : 'Annulé'}
                  </span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Montant total</span>
                  <span className="text-xl font-bold text-primary-600">
                    {formatCurrency(order.price, currency)}
                  </span>
                </div>
                {order.payment && (
                  <div className="text-sm text-gray-600 mt-2">
                    Paiement: {order.payment.status === 'PAID' ? 'Payé' : 'En attente'}
                  </div>
                )}
              </div>

              {order.notes && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600 mb-1">Notes</div>
                  <div className="text-sm">{order.notes}</div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <PrintButton label="Imprimer le reçu" />
            <Link
              href="/freight"
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-center"
            >
              Nouvelle commande
            </Link>
          </div>

          {/* Tracking Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Suivre votre colis</h3>
            <p className="text-blue-800 text-sm mb-4">
              Utilisez le code de suivi <strong>{order.trackingCode}</strong> pour suivre l'état de votre colis en temps réel.
            </p>
            <Link
              href={`/freight/track?code=${order.trackingCode}`}
              className="text-blue-600 hover:underline font-semibold"
            >
              Suivre maintenant →
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
