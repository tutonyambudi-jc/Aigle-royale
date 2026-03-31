'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
    return (
        <button
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-xl transition-all border border-gray-200 text-sm font-bold shadow-sm"
            title="Déconnexion"
        >
            <LogOut size={16} />
            <span>Déconnexion</span>
        </button>
    )
}
