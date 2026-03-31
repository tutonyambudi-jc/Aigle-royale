import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

import { getLoyaltyProgress, tierLabel } from '@/lib/loyalty'

export default async function LoyaltyPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      firstName: true,
      lastName: true,
      loyaltyPoints: true,
      loyaltyTier: true,
      loyaltyTransactions: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })

  if (!me) redirect('/auth/login')

  const progress = getLoyaltyProgress(me.loyaltyPoints || 0)
  const pct = Math.round(progress.progress01 * 100)

  return (
    <div className="space-y-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-1">Fidélité</p>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Vos points & avantages</h1>
          <p className="text-slate-600 mt-2">
            Bonjour {me.firstName} {me.lastName} — cumulez des points à chaque réservation payée.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Votre solde</h2>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mt-4">
              <div>
                <div className="text-sm text-gray-500">Points</div>
                <div className="text-4xl font-extrabold text-gray-900">{me.loyaltyPoints}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Niveau</div>
                <div className="text-2xl font-bold text-gray-900">{tierLabel(me.loyaltyTier)}</div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between text-sm text-gray-700 mb-2">
                <span className="font-semibold">
                  {progress.nextTier ? `Progression vers ${tierLabel(progress.nextTier)}` : 'Niveau maximum atteint'}
                </span>
                <span className="text-gray-600">{pct}%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-primary-600"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>{progress.currentMin} pts</span>
                {progress.nextAt ? (
                  <span>
                    {progress.nextAt} pts{progress.pointsToNext !== null ? ` • encore ${progress.pointsToNext} pts` : ''}
                  </span>
                ) : (
                  <span>Platinum</span>
                )}
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-500">
              Règle actuelle: 1 point par tranche de 1000 FC payés. Niveaux: Bronze &lt; 100, Argent ≥ 100, Or ≥ 250, Platinum ≥ 500.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Avantages</h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 rounded-full bg-primary-600"></span>
                <span>Suivi transparent de vos points</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 rounded-full bg-primary-600"></span>
                <span>Niveaux avec avantages à venir (remises, priorités)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-2 h-2 rounded-full bg-primary-600"></span>
                <span>Historique de toutes les opérations</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Historique</h2>
          {me.loyaltyTransactions.length === 0 ? (
            <p className="text-gray-600">Aucune transaction de fidélité pour le moment.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Points</th>
                    <th className="py-2 pr-4">Motif</th>
                  </tr>
                </thead>
                <tbody>
                  {me.loyaltyTransactions.map((t) => (
                    <tr key={t.id} className="border-t border-gray-200/70">
                      <td className="py-3 pr-4 text-gray-700">
                        {new Date(t.createdAt).toLocaleString('fr-FR')}
                      </td>
                      <td className="py-3 pr-4 font-medium text-gray-900">{t.type}</td>
                      <td className="py-3 pr-4 font-bold text-gray-900">
                        {t.points > 0 ? `+${t.points}` : t.points}
                      </td>
                      <td className="py-3 pr-4 text-gray-700">{t.reason || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </div>
  )
}

