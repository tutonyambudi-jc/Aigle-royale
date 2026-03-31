'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface PaginationControlsProps {
    totalItems: number
    currentLimit: number
    currentPage: number
}

export function PaginationControls({ totalItems, currentLimit, currentPage }: PaginationControlsProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const totalPages = Math.ceil(totalItems / currentLimit)
    const limits = [20, 50, 60, 100]

    const updateQuery = (params: { page?: number; limit?: number }) => {
        const newParams = new URLSearchParams(searchParams.toString())
        if (params.page !== undefined) newParams.set('page', params.page.toString())
        if (params.limit !== undefined) {
            newParams.set('limit', params.limit.toString())
            newParams.set('page', '1') // Reset to page 1 when limit changes
        }
        router.push(`?${newParams.toString()}`)
    }

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Afficher</span>
                <select
                    value={currentLimit}
                    onChange={(e) => updateQuery({ limit: Number(e.target.value) })}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-primary-500 outline-none"
                >
                    {limits.map(l => (
                        <option key={l} value={l}>{l}</option>
                    ))}
                </select>
                <span className="text-sm text-gray-500">par page</span>
            </div>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => updateQuery({ page: currentPage - 1 })}
                    disabled={currentPage <= 1}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <div className="flex items-center gap-1 px-4 text-sm font-bold text-gray-700">
                    Page {currentPage} sur {totalPages || 1}
                </div>

                <button
                    onClick={() => updateQuery({ page: currentPage + 1 })}
                    disabled={currentPage >= totalPages}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            <div className="text-sm text-gray-500 font-medium">
                Total : <span className="text-gray-900 font-bold">{totalItems}</span> réservations
            </div>
        </div>
    )
}
