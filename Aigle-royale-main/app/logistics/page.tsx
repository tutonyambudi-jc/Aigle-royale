import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { LogisticsDashboard } from '@/components/logistics/LogisticsDashboard'

export default async function LogisticsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login?role=logistics')
  if (session.user.role !== 'LOGISTICS' && session.user.role !== 'ADMINISTRATOR' && session.user.role !== 'SUPERVISOR') {
    redirect('/dashboard')
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Espace Logistique</h1>
        <p className="text-gray-600 text-lg">Suivi des trajets et gestion des colis</p>
      </div>

      <LogisticsDashboard />
    </>
  )
}
