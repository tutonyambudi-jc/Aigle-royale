'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Image from 'next/image'

interface SuperAgent {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
    city: string | null
    gender: string | null
    birthDate: Date | null
    passportOrIdNumber: string | null
    passportPhotoUrl: string | null
    fingerprintUrl: string | null
    createdAt: Date
}

export function AgencyDirectory() {
    const [agents, setAgents] = useState<SuperAgent[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchAgents()
    }, [])

    const fetchAgents = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/super-agents')
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des agences')
            }
            const data = await response.json()
            setAgents(data)
        } catch (err) {
            setError('Impossible de charger les agences de voyage')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-semibold">Chargement des agences...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-red-900 mb-2">Erreur</h3>
                <p className="text-red-700">{error}</p>
            </div>
        )
    }

    if (agents.length === 0) {
        return (
            <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucune agence disponible</h3>
                <p className="text-gray-600">Il n'y a actuellement aucune agence de voyage enregistrée.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Nos Agences de Voyage</h2>
                    <p className="text-gray-600 mt-1">Découvrez nos {agents.length} agence{agents.length > 1 ? 's' : ''} partenaire{agents.length > 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-xl font-bold">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {agents.length} Agence{agents.length > 1 ? 's' : ''}
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.map((agent) => (
                    <div
                        key={agent.id}
                        className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-gray-100 hover:border-primary-300"
                    >
                        {/* Header avec gradient */}
                        <div className="bg-gradient-to-r from-primary-600 to-indigo-600 p-6 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-16 -translate-y-16"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    {agent.gender && (
                                        <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold">
                                            {agent.gender}
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-xl font-bold mb-1">
                                    {agent.firstName} {agent.lastName}
                                </h3>
                                {agent.city && (
                                    <div className="flex items-center gap-1.5 text-sm opacity-90">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {agent.city}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Contenu */}
                        <div className="p-6 space-y-4">
                            {/* Coordonnées */}
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Téléphone</div>
                                        <div className="text-sm font-bold text-gray-900 truncate">{agent.phone || 'Non renseigné'}</div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Email</div>
                                        <div className="text-sm font-bold text-gray-900 truncate">{agent.email}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Informations personnelles */}
                            <div className="pt-4 border-t border-gray-100 space-y-3">
                                {agent.birthDate && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Date de naissance</span>
                                        <span className="text-sm font-bold text-gray-900">
                                            {format(new Date(agent.birthDate), 'dd MMMM yyyy', { locale: fr })}
                                        </span>
                                    </div>
                                )}

                                {agent.passportOrIdNumber && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">N° Passeport/ID</span>
                                        <span className="text-sm font-bold text-gray-900 font-mono">{agent.passportOrIdNumber}</span>
                                    </div>
                                )}
                            </div>

                            {/* Documents */}
                            {(agent.passportPhotoUrl || agent.fingerprintUrl) && (
                                <div className="pt-4 border-t border-gray-100">
                                    <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">Documents</div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {agent.passportPhotoUrl && (
                                            <div className="space-y-1.5">
                                                <div className="text-xs text-gray-600 font-medium">Photo Passeport</div>
                                                <div className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 group-hover:border-primary-300 transition-colors">
                                                    <Image
                                                        src={agent.passportPhotoUrl}
                                                        alt="Photo passeport"
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {agent.fingerprintUrl && (
                                            <div className="space-y-1.5">
                                                <div className="text-xs text-gray-600 font-medium">Empreinte</div>
                                                <div className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 group-hover:border-primary-300 transition-colors">
                                                    <Image
                                                        src={agent.fingerprintUrl}
                                                        alt="Empreinte digitale"
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Footer */}
                            <div className="pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Membre depuis {format(new Date(agent.createdAt), 'MMMM yyyy', { locale: fr })}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
