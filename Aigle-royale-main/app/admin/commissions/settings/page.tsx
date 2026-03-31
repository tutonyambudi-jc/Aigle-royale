import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { CommissionRateForm } from '@/components/admin/CommissionRateForm'

export const dynamic = 'force-dynamic'

export default async function CommissionSettingsPage() {
    const agents = await prisma.user.findMany({
        where: { role: 'AGENT' },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            commissionRate: true,
            isActive: true,
        },
        orderBy: { firstName: 'asc' },
    })

    const activeAgents = agents.filter(a => a.isActive)
    const averageRate = activeAgents.length > 0
        ? activeAgents.reduce((sum, a) => sum + (a.commissionRate || 10), 0) / activeAgents.length
        : 10

    return (
        <>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Paramètres des Commissions</h1>
                    <p className="text-gray-600">Gérez les taux de commission des agents</p>
                </div>
                <Link
                    href="/admin/commissions"
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                    ← Retour
                </Link>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="text-sm text-gray-600 mb-1">Nombre d'agents</div>
                    <div className="text-3xl font-bold text-gray-900">{agents.length}</div>
                    <div className="text-xs text-gray-500 mt-1">{activeAgents.length} actifs</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="text-sm text-gray-600 mb-1">Taux moyen</div>
                    <div className="text-3xl font-bold text-primary-600">{averageRate.toFixed(1)}%</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="text-sm text-gray-600 mb-1">Taux par défaut</div>
                    <div className="text-3xl font-bold text-gray-900">10%</div>
                </div>
            </div>

            {/* Configuration globale */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Configuration Globale</h2>
                <CommissionRateForm type="global" />
            </div>

            {/* Liste des agents */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Taux par Agent</h2>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Agent</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Taux</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {agents.map((agent) => (
                            <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-medium">{agent.firstName} {agent.lastName}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{agent.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${agent.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {agent.isActive ? 'Actif' : 'Inactif'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-bold text-primary-600">{agent.commissionRate || 10}%</td>
                                <td className="px-6 py-4 text-right">
                                    <CommissionRateForm
                                        type="agent"
                                        agentId={agent.id}
                                        currentRate={agent.commissionRate || 10}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    )
}
