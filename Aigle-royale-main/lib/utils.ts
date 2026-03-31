import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateTicketNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `AR-${timestamp}-${random}`
}

export function generateTrackingCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `FR-${timestamp}-${random}`
}

export type DisplayCurrency = 'FC' | 'USD'

function getUsdXofRate(): number {
  const raw = process.env.NEXT_PUBLIC_USD_FC_RATE
  const n = raw ? Number(raw) : NaN
  return Number.isFinite(n) && n > 0 ? n : 600
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

function getClientPreferredCurrency(): DisplayCurrency {
  if (typeof window === 'undefined') return 'FC'
  try {
    const ls = window.localStorage.getItem('ar_currency')
    if (ls === 'USD' || ls === 'FC') return ls
  } catch { }
  const c = readCookie('ar_currency')
  if (c === 'USD' || c === 'FC') return c
  return 'FC'
}

function getServerPreferredCurrency(): DisplayCurrency {
  // Important: utils.ts est importé côté client aussi. On évite un import statique de `next/headers`.
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const req = (0, eval)('require') as any
    const mod = req('next/headers') as any
    const c = mod?.cookies?.()?.get?.('ar_currency')?.value
    if (c === 'USD' || c === 'FC') return c
  } catch { }
  return 'FC'
}

/**
 * Format un montant stocké en FC (FC) en FC ou USD selon la préférence.
 * - Base: FC (FC)
 * - Conversion: USD = FC / NEXT_PUBLIC_USD_FC_RATE (par défaut 600)
 */
export function formatCurrency(amountXof: number, currency?: DisplayCurrency): string {
  const cur: DisplayCurrency =
    currency || (typeof window === 'undefined' ? getServerPreferredCurrency() : getClientPreferredCurrency())
  const rate = getUsdXofRate()

  if (cur === 'USD') {
    const usd = amountXof / rate
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(usd)
  }

  // Use a valid ISO currency for formatting (display as "FC" afterwards).
  const formatted = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
  }).format(amountXof)

  // Remplacer les variantes possibles générées par Intl (FC, CFA, F CFA, FCFA, etc.)
  // On utilise une approche plus large pour s'assurer que "F\u202fCFA" (avec espace insécable) est aussi capturé
  return formatted
    .replace(/[F\s]*CFA|FC/g, 'FC')
    .trim()
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(date))
}
