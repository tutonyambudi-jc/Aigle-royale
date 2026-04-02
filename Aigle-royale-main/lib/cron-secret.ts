/**
 * Secret cron : en production, refuse un secret absent ou trivial pour éviter l'exécution non autorisée.
 */

const WEAK = new Set(['', 'dev-secret', 'changeme', 'secret'])

export function resolveCronSecret(): { ok: true; secret: string } | { ok: false; status: number; message: string } {
  const raw = process.env.CRON_SECRET
  const isProd = process.env.NODE_ENV === 'production'

  if (isProd) {
    if (!raw || raw.length < 16 || WEAK.has(raw.trim().toLowerCase())) {
      return {
        ok: false,
        status: 503,
        message:
          'CRON_SECRET doit être défini avec une valeur forte (≥ 16 caractères) en production.',
      }
    }
    return { ok: true, secret: raw }
  }

  return { ok: true, secret: raw?.trim() || 'dev-secret' }
}
