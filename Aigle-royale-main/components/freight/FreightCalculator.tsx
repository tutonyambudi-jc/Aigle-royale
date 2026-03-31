'use client'

import { useState } from 'react'
import { Package, Calculator, ArrowRight, Info, Building2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export function FreightCalculator() {
    const [weight, setWeight] = useState<string>('')
    const pricePerKg = 10000

    const numericWeight = parseFloat(weight)
    const totalPrice = !isNaN(numericWeight) && numericWeight > 0 ? numericWeight * pricePerKg : 0

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Policy Card */}
            <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-8 flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
                    <Info className="text-amber-600" size={32} />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl font-bold text-amber-900 mb-2">Service d'expédition en agence</h3>
                    <p className="text-amber-800 leading-relaxed font-medium">
                        Pour garantir la sécurité de vos envois, les expéditions de colis se font exclusivement en **agence physique**.
                        Utilisez ce simulateur pour estimer le coût de votre transport.
                    </p>
                </div>
            </div>

            {/* Main Calculator */}
            <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200 border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full translate-x-32 -translate-y-32"></div>

                <div className="relative grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100/50 rounded-full text-primary-700 font-bold text-xs uppercase tracking-widest">
                            <Calculator size={14} />
                            Simulateur de Tarif
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
                            Combien coûte <br /><span className="text-primary-600">votre expédition ?</span>
                        </h2>

                        <div className="space-y-2">
                            <label htmlFor="weight-input" className="block text-sm font-black text-slate-400 uppercase tracking-widest ml-1">
                                Poids du colis (kg)
                            </label>
                            <div className="relative group">
                                <input
                                    id="weight-input"
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    placeholder="Ex: 5.5"
                                    className="w-full bg-slate-50 border-4 border-slate-100 rounded-3xl px-8 py-6 text-2xl font-black text-slate-900 focus:bg-white focus:border-primary-500 transition-all outline-none"
                                />
                                <div className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xl group-focus-within:text-primary-500 transition-colors uppercase tracking-widest">
                                    kg
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                            <Package className="text-slate-400" size={20} />
                            <span className="text-sm font-bold text-slate-600">Tarif premium : {formatCurrency(pricePerKg)} / kg</span>
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-[2rem] p-10 text-white shadow-xl flex flex-col justify-center min-h-[300px] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-transparent"></div>

                        <p className="relative text-slate-400 font-bold text-xs uppercase tracking-[0.3em] mb-4">Prix Estimé</p>
                        <div className="relative flex items-baseline gap-2 mb-8">
                            <div className="text-6xl font-black tracking-tighter">
                                {totalPrice.toLocaleString()}
                            </div>
                            <div className="text-2xl font-bold opacity-50 uppercase tracking-tighter">FC</div>
                        </div>

                        <div className="relative mt-auto space-y-4">
                            <div className="h-px bg-white/10 w-full"></div>
                            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                                <span>Poids Total</span>
                                <span className="text-white">{weight || '0'} kg</span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                                <span>Destination</span>
                                <span className="text-white italic">En Agence</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Agence Link Card */}
            <div className="bg-slate-50 rounded-[2rem] p-8 border-2 border-dashed border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <Building2 className="text-primary-600" size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900">Où se trouve l'agence ?</h4>
                        <p className="text-sm text-slate-500">Trouvez le point Aigle Royale le plus proche pour déposer votre colis.</p>
                    </div>
                </div>
                <button className="px-8 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 hover:bg-slate-100 transition-all flex items-center gap-2 group shadow-sm">
                    Voir les agences
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
                </button>
            </div>
        </div>
    )
}
