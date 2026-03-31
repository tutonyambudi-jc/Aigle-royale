import { prisma } from '@/lib/prisma'

const KEYS = ['supportWhatsAppNumber', 'supportWhatsAppPrefill'] as const

export type SupportPublicConfig = {
  whatsappNumber: string
  whatsappPrefill: string
}

export async function getSupportPublicConfig(): Promise<SupportPublicConfig> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: [...KEYS] } },
    select: { key: true, value: true },
  })
  const map = new Map(rows.map((r) => [r.key, r.value]))
  const fromDb = (map.get('supportWhatsAppNumber') || '').replace(/\D/g, '')
  const fromEnv = (process.env.SUPPORT_WHATSAPP_NUMBER || '').replace(/\D/g, '')
  return {
    whatsappNumber: fromDb || fromEnv,
    whatsappPrefill:
      map.get('supportWhatsAppPrefill') ||
      process.env.SUPPORT_WHATSAPP_PREFILL ||
      'Bonjour, j’ai besoin d’assistance concernant Aigle Royale.',
  }
}

export function buildWhatsAppUrl(phoneDigits: string, message: string) {
  const digits = phoneDigits.replace(/\D/g, '')
  if (!digits) return null
  const params = new URLSearchParams()
  if (message.trim()) params.set('text', message.trim())
  const q = params.toString()
  return `https://wa.me/${digits}${q ? `?${q}` : ''}`
}
