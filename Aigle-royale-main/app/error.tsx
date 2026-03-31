'use client'

import { useEffect } from 'react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Une erreur est survenue</h2>
                <div className="bg-red-50 p-4 rounded-lg mb-6 text-left">
                    <p className="text-red-800 font-mono text-xs break-all">{error.message}</p>
                    {error.digest && <p className="text-red-600 font-mono text-[10px] mt-2">Digest: {error.digest}</p>}
                </div>
                <p className="text-gray-600 mb-6 font-medium">Nous nous excusons pour ce désagrément.</p>
                <button
                    onClick={reset}
                    className="w-full px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors"
                >
                    Réessayer
                </button>
            </div>
        </div>
    )
}
