'use client'

import { useState } from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

export type RevenueData = {
    date: string
    amount: number
}

interface RevenueChartsProps {
    dailyData: RevenueData[]
    monthlyData: RevenueData[]
    currency: string
}

export function RevenueCharts({ dailyData, monthlyData, currency }: RevenueChartsProps) {
    const [view, setView] = useState<'daily' | 'monthly'>('daily')

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Évolution du Chiffre d'Affaires</h3>
                <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => setView('daily')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === 'daily'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        30 derniers jours
                    </button>
                    <button
                        onClick={() => setView('monthly')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === 'monthly'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        Par mois
                    </button>
                </div>
            </div>

            <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    {view === 'daily' ? (
                        <LineChart data={dailyData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 12 }}
                                tickMargin={10}
                            />
                            <YAxis
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => formatCurrency(value, currency as any).replace(/\D00$/, '')}
                            />
                            <Tooltip
                                formatter={(value: number) => [formatCurrency(value, currency as any), 'Revenu']}
                                labelStyle={{ color: '#111827' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="amount"
                                stroke="#0d9488"
                                strokeWidth={3}
                                dot={false}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    ) : (
                        <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 12 }}
                                tickMargin={10}
                            />
                            <YAxis
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => formatCurrency(value, currency as any).replace(/\D00$/, '')}
                            />
                            <Tooltip
                                formatter={(value: number) => [formatCurrency(value, currency as any), 'Revenu']}
                                labelStyle={{ color: '#111827' }}
                                cursor={{ fill: '#f3f4f6' }}
                            />
                            <Bar
                                dataKey="amount"
                                fill="#0d9488"
                                radius={[4, 4, 0, 0]}
                                maxBarSize={50}
                            />
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    )
}
