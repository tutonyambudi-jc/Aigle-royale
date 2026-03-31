'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
    Calendar,
    Users,
    MapPin,
    Clock,
    Mail,
    Phone,
    User,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    Bus,
    Star,
    MessageSquare
} from 'lucide-react'

type RentalType = 'FULL_DAY' | 'HALF_DAY'
type BusType = 'STANDARD' | 'VIP'

export function BusRentalForm() {
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        rentalType: 'FULL_DAY' as RentalType,
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        startTime: '08:00',
        endTime: '18:00',
        departureLocation: '',
        destination: '',
        passengerCount: 1,
        preferredBusType: 'STANDARD' as BusType,
        specialRequests: '',
        contactName: '',
        contactPhone: '',
        contactEmail: '',
    })

    const nextStep = () => setStep(s => Math.min(s + 1, 3))
    const prevStep = () => setStep(s => Math.max(s - 1, 1))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (step < 3) {
            nextStep()
            return
        }

        setLoading(true)
        setError('')

        try {
            const response = await fetch('/api/rentals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Erreur lors de la soumission')
            }

            setSuccess(true)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="text-center py-12 px-6 bg-white rounded-3xl animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary-200">
                    <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Demande Envoyée !</h3>
                <p className="text-gray-500 mb-8 max-w-sm mx-auto font-medium">
                    Nous avons bien reçu votre demande. Un conseiller vous contactera très bientôt.
                </p>
                <button
                    onClick={() => setSuccess(false)}
                    className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all"
                >
                    Fermer
                </button>
            </div>
        )
    }

    const StepIndicator = () => (
        <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
                <div
                    key={s}
                    className={`h-1.5 rounded-full transition-all duration-500 ${step === s ? 'w-8 bg-primary-600' : 'w-2 bg-gray-200'
                        }`}
                />
            ))}
        </div>
    )

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <StepIndicator />

            <div className="min-h-[320px]">
                {step === 1 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-400">
                        <div className="flex gap-3">
                            {(['FULL_DAY', 'HALF_DAY'] as RentalType[]).map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, rentalType: type })}
                                    className={`flex-1 p-4 rounded-2xl border-2 transition-all text-left group ${formData.rentalType === type
                                        ? 'border-primary-500 bg-primary-50/30'
                                        : 'border-gray-100 bg-white hover:border-gray-200'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${formData.rentalType === type ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-400'
                                        }`}>
                                        {type === 'FULL_DAY' ? <Calendar className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                    </div>
                                    <h4 className="font-bold text-sm text-gray-900">
                                        {type === 'FULL_DAY' ? 'Journée' : 'Demi-journée'}
                                    </h4>
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Date</label>
                                <input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border-2 border-white/20 rounded-xl focus:border-primary-500 outline-none font-semibold text-sm"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Passagers</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.passengerCount}
                                    onChange={(e) => setFormData({ ...formData, passengerCount: parseInt(e.target.value) || 1 })}
                                    className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border-2 border-white/20 rounded-xl focus:border-primary-500 outline-none font-semibold text-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Catégorie de Car</label>
                            <div className="flex gap-2 p-1.5 bg-gray-50 rounded-xl">
                                {(['STANDARD', 'VIP'] as BusType[]).map((bType) => (
                                    <button
                                        key={bType}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, preferredBusType: bType })}
                                        className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${formData.preferredBusType === bType
                                            ? 'bg-white text-primary-600 shadow-sm'
                                            : 'text-gray-400 hover:text-gray-600'
                                            }`}
                                    >
                                        {bType === 'VIP' ? 'PREMIUM / VIP' : 'STANDARD'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-5 animate-in slide-in-from-right-4 duration-400">
                        <div className="grid gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Départ</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Lieu de prise en charge"
                                        value={formData.departureLocation}
                                        onChange={(e) => setFormData({ ...formData, departureLocation: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 bg-white/50 backdrop-blur-sm border-2 border-white/20 rounded-xl focus:border-primary-500 outline-none font-semibold text-sm"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Destination</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Destination finale"
                                        value={formData.destination}
                                        onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 bg-white/50 backdrop-blur-sm border-2 border-white/20 rounded-xl focus:border-primary-500 outline-none font-semibold text-sm"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Heure Début</label>
                                <input
                                    type="time"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border-2 border-white/20 rounded-xl focus:border-primary-500 outline-none font-semibold text-sm"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Heure Fin</label>
                                <input
                                    type="time"
                                    value={formData.endTime}
                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border-2 border-white/20 rounded-xl focus:border-primary-500 outline-none font-semibold text-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Besoins Particuliers</label>
                            <textarea
                                placeholder="Optionnel..."
                                value={formData.specialRequests}
                                onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                                className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border-2 border-white/20 rounded-xl focus:border-primary-500 outline-none font-medium text-sm min-h-[80px] resize-none"
                            />
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-400">
                        <div className="bg-white/40 backdrop-blur-sm p-4 rounded-2xl space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500 font-bold uppercase tracking-wider">Service</span>
                                <span className="font-black text-gray-900">{formData.rentalType === 'FULL_DAY' ? 'Journée' : 'Demi-journée'} • {formData.preferredBusType}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500 font-bold uppercase tracking-wider">Date</span>
                                <span className="font-black text-gray-900">{format(new Date(formData.startDate), 'dd MMMM yyyy', { locale: fr })}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500 font-bold uppercase tracking-wider">Trajet</span>
                                <span className="font-black text-gray-900 truncate max-w-[150px]">{formData.departureLocation} → {formData.destination}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Nom complet"
                                    value={formData.contactName}
                                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3 bg-white/50 backdrop-blur-sm border-2 border-white/20 rounded-xl focus:border-primary-500 outline-none font-semibold text-sm"
                                    required
                                />
                            </div>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="tel"
                                    placeholder="Téléphone"
                                    value={formData.contactPhone}
                                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3 bg-white/50 backdrop-blur-sm border-2 border-white/20 rounded-xl focus:border-primary-500 outline-none font-semibold text-sm"
                                    required
                                />
                            </div>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="email"
                                    placeholder="E-mail"
                                    value={formData.contactEmail}
                                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3 bg-white/50 backdrop-blur-sm border-2 border-white/20 rounded-xl focus:border-primary-500 outline-none font-semibold text-sm"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold">⚠️ {error}</div>}

            <div className="flex gap-3 pt-4 border-t border-gray-50">
                {step > 1 && (
                    <button
                        type="button"
                        onClick={prevStep}
                        className="p-3 bg-white/50 backdrop-blur-sm border-2 border-white/20 rounded-xl text-gray-500 hover:text-gray-700 transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-4 bg-primary-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-all flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <>
                            {step === 3 ? 'Confirmer la demande' : 'Continuer'}
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </div>
        </form>
    )
}
