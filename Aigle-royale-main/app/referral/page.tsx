import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

import { ReferralShareCard } from '@/components/referral/ReferralShareCard'

function makeReferralCode(): string {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4)
  return `AR-${timestamp}-${random}`
}

export default async function ReferralPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      referralCode: true,
      referralCredits: true,
      referralCount: true,
      referrals: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!me) redirect('/auth/login')

  let referralCode = me.referralCode
  if (!referralCode) {
    // Génération lazy (utile pour les comptes déjà créés avant le module parrainage)
    for (let i = 0; i < 10; i++) {
      const candidate = makeReferralCode()
      const exists = await prisma.user.findFirst({
        where: { referralCode: candidate },
        select: { id: true },
      })
      if (!exists) {
        const updated = await prisma.user.update({
          where: { id: me.id },
          data: { referralCode: candidate },
          select: { referralCode: true },
        })
        referralCode = updated.referralCode
        break
      }
    }
  }

  if (!referralCode) {
    referralCode = `AR-${crypto.randomUUID().split('-')[0].toUpperCase()}`
  }

  return (
    <div className="space-y-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-1">Parrainage</p>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Invitez vos proches</h1>
          <p className="text-slate-600 mt-2">
            Bonjour {me.firstName} {me.lastName} — partagez votre lien et gagnez des bonus.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ReferralShareCard referralCode={referralCode} />
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Vos gains</h2>
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Filleuls</span>
                <span className="font-bold text-gray-900">{me.referralCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Crédits</span>
                <span className="font-bold text-gray-900">{me.referralCredits} FC</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-500">
              Bonus actuel: 500 FC pour vous + 500 FC pour le nouveau compte (à l’inscription avec code).
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Mes filleuls</h2>
          {me.referrals.length === 0 ? (
            <p className="text-gray-600">Aucun filleul pour le moment.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2 pr-4">Nom</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {me.referrals.map((u) => (
                    <tr key={u.id} className="border-t border-gray-200/70">
                      <td className="py-3 pr-4 font-medium text-gray-900">
                        {u.firstName} {u.lastName}
                      </td>
                      <td className="py-3 pr-4 text-gray-700">{u.email}</td>
                      <td className="py-3 pr-4 text-gray-700">
                        {new Date(u.createdAt).toLocaleString('fr-FR')}
                      </td>
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

