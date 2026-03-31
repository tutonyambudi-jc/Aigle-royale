'use client'

import React, { useEffect } from 'react'
import { format, isValid } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Luggage, ShieldCheck, Zap } from 'lucide-react'
import * as QRCode from 'qrcode'
import { buildBookingQrPayload, bookingQrPayloadString } from '@/lib/booking-qr-payload'

interface VIPBoardingPassProps {
    passenger: {
        bookingId: string
        tripId: string
        bookingGroupId: string | null
        passengerName: string
        ticketNumber: string
        bookingStatus: string
        paymentStatus: string
        seatNumber: string
        departureTime: string
        origin: string
        destination: string
        /** Image data URL du QR (même contenu JSON que le billet) */
        qrCode: string | null
        busName: string
        plateNumber: string
        baggageCount: number
        baggageWeight: number
    }
}

export const VIPBoardingPass: React.FC<VIPBoardingPassProps> = ({ passenger }) => {
    useEffect(() => {
        if (!passenger?.ticketNumber) return
        if (passenger.qrCode?.startsWith('data:image')) return

        const generateQR = async () => {
            const canvas = document.getElementById(`ticket-qr-${passenger.ticketNumber}`) as HTMLCanvasElement
            if (!canvas) return
            try {
                const payload = buildBookingQrPayload({
                    bookingId: passenger.bookingId,
                    bookingGroupId: passenger.bookingGroupId,
                    ticketNumber: passenger.ticketNumber,
                    tripId: passenger.tripId,
                    passengerName: passenger.passengerName,
                    bookingStatus: passenger.bookingStatus,
                    paymentStatus: passenger.paymentStatus,
                })
                await QRCode.toCanvas(canvas, bookingQrPayloadString(payload), {
                    width: 128,
                    margin: 0,
                    color: { dark: '#000000', light: '#ffffff' },
                })
            } catch (err) {
                console.error('Failed to generate QR code:', err)
            }
        }
        void generateQR()
    }, [passenger])

    if (!passenger) return null

    let depDate = new Date(passenger.departureTime)
    if (!isValid(depDate)) {
        depDate = new Date()
    }

    // Safety check for origin/destination strings
    const originCode = (passenger.origin || 'AR').substring(0, 3).toUpperCase()
    const destCode = (passenger.destination || 'AR').substring(0, 3).toUpperCase()

    return (
        <div className="boarding-pass-print-container">
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    /* Hide EVERYTHING on the page */
                    html, body, #__next, div {
                        visibility: hidden !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    /* ONLY show the boarding pass and its content */
                    .boarding-pass-print-container, 
                    .boarding-pass-print-container * {
                        visibility: visible !important;
                        opacity: 1 !important;
                    }
                    .boarding-pass-print-container {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        background: white !important;
                        z-index: 99999 !important;
                        display: block !important;
                    }
                    @page {
                        size: landscape;
                        margin: 0;
                    }
                }

                .bg-vip-gold {
                    background: linear-gradient(135deg, #b45309 0%, #78350f 100%);
                }
                .text-vip-gold {
                    color: #b45309;
                }
                .border-vip-gold {
                    border-color: #b45309;
                }
            ` }} />

            <div className="max-w-4xl mx-auto bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-row min-h-[300px] font-sans">
                {/* Main Body */}
                <div className="flex-[3] p-0 flex flex-col">
                    {/* Header */}
                    <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-vip-gold rounded-xl flex items-center justify-center shadow-lg">
                                <span className="text-white font-black text-xl">AR</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tighter leading-none">AIGLE ROYALE</h1>
                                <p className="text-[10px] text-amber-500 font-bold tracking-[0.3em] uppercase mt-1">L'Excellence du Voyage</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="bg-vip-gold px-4 py-1.5 rounded-full flex items-center gap-2 shadow-inner">
                                <Zap className="w-4 h-4 fill-white" />
                                <span className="text-sm font-black uppercase tracking-widest">VIP CLASS</span>
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 tracking-widest">Boarding Pass • Carte d'Accès</p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 flex-1 grid grid-cols-2 gap-8 relative overflow-hidden">
                        {/* Background Decoration */}
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gray-50 rounded-full blur-3xl opacity-50"></div>
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-50 rounded-full blur-3xl opacity-30"></div>

                        {/* Column 1: Passenger & ID */}
                        <div className="space-y-6 relative z-10">
                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 block">Passenger / Passager</label>
                                <div className="text-xl font-black text-slate-900 uppercase">{passenger.passengerName}</div>
                            </div>
                            <div className="flex gap-8">
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 block">Ticket No.</label>
                                    <div className="text-sm font-mono font-bold text-gray-700">{passenger.ticketNumber}</div>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 block">Seat / Siège</label>
                                    <div className="text-2xl font-black text-vip-gold bg-amber-50 px-3 py-1 rounded-lg inline-block">{passenger.seatNumber}</div>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-gray-100 flex gap-6">
                                <div className="flex items-center gap-2">
                                    <Luggage className="w-4 h-4 text-gray-400" />
                                    <span className="text-xs font-bold text-gray-600">{passenger.baggageCount} pcs • {passenger.baggageWeight}kg</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-green-500" />
                                    <span className="text-[10px] font-black text-green-600 uppercase">Documents Verified</span>
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Route & Time */}
                        <div className="bg-slate-50 rounded-[2rem] p-6 space-y-4 shadow-inner relative z-10 border border-gray-100/50">
                            <div className="flex justify-between items-center px-2">
                                <div className="text-center">
                                    <div className="text-[32px] font-black text-slate-900 leading-none">{originCode}</div>
                                    <div className="text-[9px] font-bold text-gray-400 uppercase mt-1">{passenger.origin}</div>
                                </div>
                                <div className="flex-1 flex flex-col items-center px-4">
                                    <div className="w-full h-[2px] bg-amber-200 relative mb-1">
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-vip-gold"></div>
                                    </div>
                                    <Zap className="w-4 h-4 text-amber-500" />
                                </div>
                                <div className="text-center">
                                    <div className="text-[32px] font-black text-slate-900 leading-none">{destCode}</div>
                                    <div className="text-[9px] font-bold text-gray-400 uppercase mt-1">{passenger.destination}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 block">Date</label>
                                    <div className="text-sm font-bold text-slate-900">{format(depDate, 'dd MMM yyyy', { locale: fr })}</div>
                                </div>
                                <div>
                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 block">Departure / Départ</label>
                                    <div className="text-lg font-black text-slate-900">{format(depDate, 'HH:mm')}</div>
                                </div>
                                <div>
                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 block">Bus / Car</label>
                                    <div className="text-xs font-bold text-gray-700">{passenger.busName}</div>
                                </div>
                                <div>
                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 block">Boarding / Accès</label>
                                    <div className="text-sm font-extrabold text-amber-600">{format(new Date(depDate.getTime() - 20 * 60000), 'HH:mm')}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stub (Detachable Part) */}
                <div className="flex-1 bg-slate-100 border-l-2 border-dashed border-gray-300 p-8 flex flex-col items-center justify-between text-center relative">
                    {/* Decorative notches */}
                    <div className="absolute -top-3 left-0 -translate-x-1/2 w-6 h-6 bg-white rounded-full"></div>
                    <div className="absolute -bottom-3 left-0 -translate-x-1/2 w-6 h-6 bg-white rounded-full"></div>

                    <div className="space-y-4">
                        <div className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Boarding Stub</div>
                        <div>
                            <div className="text-xs font-bold text-gray-500 uppercase">Seat</div>
                            <div className="text-4xl font-black text-slate-900 leading-none mt-1">{passenger.seatNumber}</div>
                        </div>
                    </div>

                    <div className="my-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                        {passenger.qrCode?.startsWith('data:image') ? (
                            <img src={passenger.qrCode} alt="" className="w-32 h-32 mx-auto object-contain" />
                        ) : (
                            <canvas id={`ticket-qr-${passenger.ticketNumber}`} className="w-32 h-32 mx-auto" />
                        )}
                        <div className="text-[8px] font-mono mt-2 text-gray-500">{passenger.ticketNumber}</div>
                    </div>

                    <div className="space-y-1">
                        <div className="text-[10px] font-black text-slate-900 uppercase tracking-tighter truncate w-full max-w-[140px]">{passenger.passengerName}</div>
                        <div className="text-[8px] font-bold text-gray-500 uppercase">{passenger.origin} → {passenger.destination}</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
