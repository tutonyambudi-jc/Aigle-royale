'use client'

import { formatCurrency } from '@/lib/utils'
import { useState } from 'react'

export type AgentPerformance = {
    id: string
    name: string
    email: string
    salesCount: number
    totalRevenue: number
    totalCommission: number
    lastSaleDate: Date | null
}

interface AgentRankingTableProps {
    agents: AgentPerformance[]
    currency: string
}

export function AgentRankingTable({ agents, currency }: AgentRankingTableProps) {
    const [sortField, setSortField] = useState<keyof AgentPerformance>('totalRevenue')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

    const sortedAgents = [...agents].sort((a, b) => {
        const aValue = a[sortField]
        const bValue = b[sortField]

        if (aValue === null) return 1
        if (bValue === null) return -1

        // Pour strings
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
        }

        // Pour dates et nombres
        if (aValue! < bValue!) return sortDirection === 'asc' ? -1 : 1
        if (aValue! > bValue!) return sortDirection === 'asc' ? 1 : -1
        return 0
    })

    const handleSort = (field: keyof AgentPerformance) => {
        if (field === sortField) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('desc')
        }
    }

    const SortIcon = ({ field }: { field: keyof AgentPerformance }) => {
        if (sortField !== field) return <span className="text-gray-300 ml-1">⇅</span>
        return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
    }

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                                Agent <SortIcon field="name" />
                            </th>
                            <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('salesCount')}>
                                Ventes <SortIcon field="salesCount" />
                            </th>
                            <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('totalRevenue')}>
                                Chiffre d'Affaires <SortIcon field="totalRevenue" />
                            </th>
                            <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('totalCommission')}>
                                Commissions <SortIcon field="totalCommission" />
                            </th>
                            <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('lastSaleDate')}>
                                Dernière Vente <SortIcon field="lastSaleDate" />
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedAgents.map((agent) => (
                            <tr key={agent.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-medium text-gray-900">{agent.name}</div>
                                    <div className="text-xs text-gray-500">{agent.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700">
                                    {agent.salesCount}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">
                                    {formatCurrency(agent.totalRevenue, currency as any)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-green-600 font-medium">
                                    {formatCurrency(agent.totalCommission, currency as any)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-500">
                                    {agent.lastSaleDate ? new Date(agent.lastSaleDate).toLocaleDateString() : '-'}
                                </td>
                            </tr>
                        ))}
                        {sortedAgents.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    Aucun agent trouvé ou aucune vente réalisée.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
