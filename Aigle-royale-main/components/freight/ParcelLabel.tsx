'use client'

import React from 'react'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'

interface ParcelLabelProps {
    order: {
        trackingCode: string
        senderName: string
        senderPhone: string
        receiverName: string
        receiverPhone: string
        weight: number
        type?: string | null
        qrCode?: string | null
        createdAt: string | Date
        trip: {
            route: {
                origin: string
                destination: string
            }
            bus: {
                name: string
                plateNumber: string
            }
        }
    }
}

export function ParcelLabel({ order }: ParcelLabelProps) {
    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="bg-white p-6 rounded-xl border-2 border-dashed border-gray-300 shadow-sm overflow-hidden bg-white">
            <div id="parcel-label-to-print" className="print:block">
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #parcel-label-to-print, #parcel-label-to-print * {
                            visibility: visible;
                        }
                        #parcel-label-to-print {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100mm;
                            height: 150mm;
                            padding: 8mm;
                            border: 3px solid #000;
                            background: white !important;
                            display: flex;
                            flex-direction: column;
                        }
                        .no-print {
                            display: none !important;
                        }
                    }
                `}} />

                <div className="flex flex-col h-full bg-white text-black font-sans leading-tight">
                    {/* Header */}
                    <div className="text-center border-b-2 border-black pb-3 mb-3">
                        <div className="text-2xl font-black uppercase tracking-tighter italic">
                            AIGLE ROYALE
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-800">
                            Transport & Logistique
                        </div>
                    </div>

                    {/* QR and Code */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <div className="text-[10px] font-black uppercase text-gray-600 mb-1">Code de Suivi</div>
                            <div className="text-3xl font-black font-mono tracking-tighter break-all">
                                {order?.trackingCode}
                            </div>
                        </div>
                        {order?.qrCode && (
                            <img
                                src={order.qrCode}
                                alt="QR Code"
                                className="w-24 h-24 border-2 border-black p-1 bg-white ml-2"
                            />
                        )}
                    </div>

                    {/* Sender / Receiver */}
                    <div className="grid grid-cols-2 gap-4 border-t-2 border-b-2 border-black py-3 mb-3">
                        <div className="border-r-2 border-black pr-2">
                            <div className="text-[8px] font-black uppercase text-gray-500 mb-1">Expéditeur</div>
                            <div className="font-black text-sm uppercase truncate">{order?.senderName}</div>
                            <div className="text-[10px] font-bold">{order?.senderPhone}</div>
                        </div>
                        <div className="pl-2">
                            <div className="text-[8px] font-black uppercase text-gray-500 mb-1">Destinataire</div>
                            <div className="font-black text-sm uppercase truncate">{order?.receiverName}</div>
                            <div className="text-[10px] font-bold">{order?.receiverPhone}</div>
                        </div>
                    </div>

                    {/* Trip Info */}
                    <div className="mb-3">
                        <div className="text-[8px] font-black uppercase text-gray-500 mb-1">Trajet & Transport</div>
                        <div className="text-lg font-black italic leading-none">
                            {order?.trip?.route?.origin || '—'} → {order?.trip?.route?.destination || '—'}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                            <div>
                                <div className="text-[8px] font-black uppercase text-gray-400">Bus</div>
                                <div className="text-sm font-black">{order?.trip?.bus?.name || '—'}</div>
                            </div>
                            <div>
                                <div className="text-[8px] font-black uppercase text-gray-400">Matricule</div>
                                <div className="text-sm font-black">{order?.trip?.bus?.plateNumber || '—'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Parcel Details */}
                    <div className="mt-auto pt-3 border-t-2 border-black flex items-end justify-between">
                        <div>
                            <div className="text-[8px] font-black uppercase text-gray-500">Poids / Type</div>
                            <div className="text-xl font-black">{order?.weight || 0} KG {order?.type && <span className="text-sm border-l-2 border-black ml-2 pl-2 opacity-70">{order.type}</span>}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[8px] font-black uppercase text-gray-500">Date</div>
                            <div className="text-[10px] font-bold">{order?.createdAt ? format(new Date(order.createdAt), 'dd/MM/yy HH:mm') : '—'}</div>
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={handlePrint}
                className="mt-6 w-full py-4 bg-primary-600 text-white rounded-2xl font-black hover:bg-primary-700 shadow-xl shadow-primary-200 transition-all no-print flex items-center justify-center gap-2"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2-2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Imprimer l'étiquette
            </button>
        </div>
    )
}
