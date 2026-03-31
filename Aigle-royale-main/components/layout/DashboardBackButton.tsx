'use client'

import Link from 'next/link'
import { ChevronLeft, LayoutDashboard } from 'lucide-react'

export function DashboardBackButton() {
    return (
        <div className="mb-6">
            <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:text-primary-600 hover:border-primary-100 hover:shadow-sm transition-all group"
            >
                <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                <LayoutDashboard size={16} />
                <span>Retour au Dashboard</span>
            </Link>
        </div>
    )
}
