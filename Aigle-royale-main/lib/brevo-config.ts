import { prisma } from '@/lib/prisma'

export type BrevoRuntimeConfig = {
  apiKey: string
  senderEmail: string
  senderName: string
  smsSender: string
  emailEnabled: boolean
  smsEnabled: boolean
}

const SETTING_KEYS = [
  'brevoApiKey',
  'brevoSenderEmail',
  'brevoSenderName',
  'brevoSmsSender',
  'brevoEmailEnabled',
  'brevoSmsEnabled',
] as const

/**
 * Fusion base (paramètres admin) + variables d'environnement.
 * Les clés en base priment sur l'env quand elles sont renseignées.
 */
export async function getBrevoConfig(): Promise<BrevoRuntimeConfig> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: [...SETTING_KEYS] } },
    select: { key: true, value: true },
  })
  const map = new Map(rows.map((r) => [r.key, r.value]))

  const apiKey =
    (map.get('brevoApiKey') || '').trim() || process.env.BREVO_API_KEY || ''
  const senderEmail =
    (map.get('brevoSenderEmail') || '').trim() || process.env.BREVO_SENDER_EMAIL || ''
  const senderName =
    (map.get('brevoSenderName') || '').trim() ||
    process.env.BREVO_SENDER_NAME ||
    'Aigle Royale'
  const smsSender =
    (map.get('brevoSmsSender') || '').trim() || process.env.BREVO_SMS_SENDER || ''

  const emailExplicit = map.get('brevoEmailEnabled')
  const smsExplicit = map.get('brevoSmsEnabled')

  const emailEnabled =
    emailExplicit === 'true'
      ? true
      : emailExplicit === 'false'
        ? false
        : Boolean(process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL)

  const smsEnabled =
    smsExplicit === 'true'
      ? true
      : smsExplicit === 'false'
        ? false
        : Boolean(process.env.BREVO_API_KEY && process.env.BREVO_SMS_SENDER)

  return {
    apiKey,
    senderEmail,
    senderName,
    smsSender,
    emailEnabled,
    smsEnabled,
  }
}

export function isBrevoEmailReady(config: BrevoRuntimeConfig) {
  return config.emailEnabled && Boolean(config.apiKey && config.senderEmail)
}

export function isBrevoSmsReady(config: BrevoRuntimeConfig) {
  return config.smsEnabled && Boolean(config.apiKey && config.smsSender)
}
