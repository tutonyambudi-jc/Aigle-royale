'use client'

import { useMemo, useState } from 'react'

type Props = {
  referralCode: string
}

export function ReferralShareCard({ referralCode }: Props) {
  const [copied, setCopied] = useState(false)

  const referralLink = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const origin = window.location.origin
    return `${origin}/auth/register?ref=${encodeURIComponent(referralCode)}`
  }, [referralCode])

  const copy = async () => {
    try {
      const text = referralLink || referralCode
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  return (
    <div className="glass rounded-2xl p-6 border border-white/20">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Partager mon code</h2>
      <p className="text-gray-600 mb-4">
        Invitez vos proches: vous gagnez un bonus, et eux aussi.
      </p>

      <div className="grid gap-3">
        <div>
          <div className="text-xs text-gray-500 mb-1">Votre code</div>
          <div className="flex items-center gap-2">
            <input
              value={referralCode}
              readOnly
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/60 font-mono"
            />
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(referralCode)
                  setCopied(true)
                  window.setTimeout(() => setCopied(false), 1500)
                } catch {
                  // ignore
                }
              }}
              className="px-4 py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-colors"
            >
              Copier
            </button>
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-500 mb-1">Lien d’inscription</div>
          <div className="flex items-center gap-2">
            <input
              value={referralLink}
              readOnly
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/60"
            />
            <button
              type="button"
              onClick={copy}
              className="px-4 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
            >
              {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

