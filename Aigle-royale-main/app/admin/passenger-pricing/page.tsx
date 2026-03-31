import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PassengerPricingForm } from '@/components/admin/PassengerPricingForm'

export default async function PassengerPricingPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMINISTRATOR') {
    redirect('/auth/login')
  }

  const pricingRules = await prisma.passengerPricing.findMany({
    orderBy: { passengerType: 'asc' },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Tarification par type de passager</h1>
              <p className="text-gray-600">
                Gérez les réductions appliquées selon le type de passager (Adulte, Enfant, Bébé, Senior, Handicapé)
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pricingRules.map((rule: any) => (
                <div
                  key={rule.id}
                  className="border-2 border-gray-200 rounded-xl p-6 hover:border-primary-500 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">
                      {rule.passengerType === 'ADULT' && '👨‍💼 Adulte'}
                      {rule.passengerType === 'CHILD' && '👶 Enfant'}
                      {rule.passengerType === 'INFANT' && '🍼 Bébé'}
                      {rule.passengerType === 'SENIOR' && '👴 Senior'}
                      {rule.passengerType === 'DISABLED' && '♿ Handicapé'}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        rule.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {rule.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div>
                      <span className="text-sm text-gray-500">Réduction</span>
                      <div className="text-2xl font-black text-primary-600">
                        -{rule.discountPercent}%
                      </div>
                    </div>

                    <div>
                      <span className="text-sm text-gray-500">Tranche d'âge</span>
                      <div className="text-sm font-semibold text-gray-900">
                        {rule.minAge !== null && rule.maxAge !== null
                          ? `${rule.minAge} - ${rule.maxAge} ans`
                          : rule.minAge !== null
                          ? `${rule.minAge}+ ans`
                          : 'Tous âges'}
                      </div>
                    </div>

                    {rule.description && (
                      <div>
                        <span className="text-sm text-gray-500">Description</span>
                        <p className="text-sm text-gray-700 mt-1">{rule.description}</p>
                      </div>
                    )}

                    {rule.requiresDisabilityProof && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                          📄 Justificatif requis
                        </span>
                      </div>
                    )}
                  </div>

                  <PassengerPricingForm rule={rule} />
                </div>
              ))}
            </div>

            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h4 className="text-sm font-bold text-blue-900 mb-2">💡 Comment ça fonctionne ?</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Le <strong>tarif adulte</strong> est le prix de base du billet (0% de réduction)</li>
                <li>• Le <strong>tarif enfant</strong> applique automatiquement une réduction de 50% pour les 2-11 ans</li>
                <li>• Le <strong>tarif bébé</strong> applique une réduction de 80% pour les 0-1 an</li>
                <li>• Le <strong>tarif senior</strong> offre 30% de réduction pour les personnes de 60 ans et plus</li>
                <li>• Le <strong>tarif handicapé</strong> offre 40% de réduction avec justificatif obligatoire</li>
                <li>• L'âge du passager est vérifié automatiquement lors de la réservation</li>
                <li>• Les réductions sont calculées automatiquement en fonction du type de passager sélectionné</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
