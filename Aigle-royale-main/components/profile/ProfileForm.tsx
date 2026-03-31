'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { User, Lock, Save, Shield, Sparkles } from 'lucide-react'
import { tierLabel } from '@/lib/loyalty'

export type ProfileInitial = {
  firstName: string
  lastName: string
  email: string
  phone: string | null
  city: string | null
  gender: string | null
  birthDate: string
  passportOrIdNumber: string | null
  loyaltyPoints: number
  loyaltyTier: string
  referralCode: string | null
}

type Props = { initial: ProfileInitial }

export function ProfileForm({ initial }: Props) {
  const { update } = useSession()
  const [firstName, setFirstName] = useState(initial.firstName)
  const [lastName, setLastName] = useState(initial.lastName)
  const [phone, setPhone] = useState(initial.phone ?? '')
  const [city, setCity] = useState(initial.city ?? '')
  const [gender, setGender] = useState(initial.gender ?? '')
  const [birthDate, setBirthDate] = useState(initial.birthDate)
  const [passportOrIdNumber, setPassportOrIdNumber] = useState(initial.passportOrIdNumber ?? '')
  const [saving, setSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdMsg, setPwdMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setProfileMsg(null)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          city,
          gender,
          birthDate: birthDate || null,
          passportOrIdNumber,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setProfileMsg({ type: 'err', text: data.error || 'Enregistrement impossible' })
        return
      }
      setProfileMsg({ type: 'ok', text: 'Profil mis à jour.' })
      if (data.name) {
        await update({ name: data.name })
      }
    } catch {
      setProfileMsg({ type: 'err', text: 'Erreur réseau' })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwdMsg(null)
    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: 'err', text: 'Les mots de passe ne correspondent pas.' })
      return
    }
    setPwdSaving(true)
    try {
      const res = await fetch('/api/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setPwdMsg({ type: 'err', text: data.error || 'Modification impossible' })
        return
      }
      setPwdMsg({ type: 'ok', text: 'Mot de passe modifié.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      setPwdMsg({ type: 'err', text: 'Erreur réseau' })
    } finally {
      setPwdSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center gap-6 rounded-3xl border border-white/80 bg-white/90 p-6 md:p-8 shadow-[0_8px_40px_rgba(15,23,42,0.07)] backdrop-blur-sm">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center text-3xl font-bold shadow-lg shrink-0">
          {(firstName.charAt(0) || initial.firstName.charAt(0) || '?').toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
            Mon profil
          </h1>
          <p className="text-gray-600 mt-1">
            Gérez vos informations personnelles et la sécurité de votre compte.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-100">
              <Sparkles className="w-3.5 h-3.5" />
              {tierLabel(initial.loyaltyTier)} · {initial.loyaltyPoints} pts
            </span>
            {initial.referralCode ? (
              <Link
                href="/referral"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-900 border border-purple-100 hover:bg-purple-100 transition-colors"
              >
                Parrainage : {initial.referralCode}
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <User className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-bold text-gray-900">Informations personnelles</h2>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                <input
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                value={initial.email}
                disabled
                className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">L’adresse e-mail ne peut pas être modifiée ici.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+243 …"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">— Non renseigné —</option>
                  <option value="M">Homme</option>
                  <option value="F">Femme</option>
                  <option value="OTHER">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de naissance
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                N° passeport ou pièce d’identité <span className="text-gray-400 font-normal">(optionnel)</span>
              </label>
              <input
                value={passportOrIdNumber}
                onChange={(e) => setPassportOrIdNumber(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {profileMsg ? (
              <p
                className={`text-sm ${
                  profileMsg.type === 'ok' ? 'text-green-700' : 'text-red-600'
                }`}
              >
                {profileMsg.text}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 md:p-8 h-fit shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-bold text-gray-900">Sécurité</h2>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe actuel
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">Au moins 8 caractères.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le nouveau mot de passe
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {pwdMsg ? (
              <p className={`text-sm ${pwdMsg.type === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
                {pwdMsg.text}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={pwdSaving}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-900 text-gray-900 font-semibold hover:bg-gray-900 hover:text-white transition-colors disabled:opacity-60"
            >
              <Lock className="w-4 h-4" />
              {pwdSaving ? 'Mise à jour…' : 'Changer le mot de passe'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
