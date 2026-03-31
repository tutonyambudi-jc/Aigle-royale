import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdmin(role?: string) {
  return role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !isAdmin(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const keys = [
      'brevoApiKey',
      'brevoSenderEmail',
      'brevoSenderName',
      'brevoSmsSender',
      'brevoEmailEnabled',
      'brevoSmsEnabled',
    ] as const
    const rows = await prisma.setting.findMany({
      where: { key: { in: [...keys] } },
    })
    const map = new Map(rows.map((r) => [r.key, r.value]))

    const apiKeyStored = (map.get('brevoApiKey') || '').trim()
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

    return NextResponse.json({
      senderEmail: map.get('brevoSenderEmail') || process.env.BREVO_SENDER_EMAIL || '',
      senderName: map.get('brevoSenderName') || process.env.BREVO_SENDER_NAME || '',
      smsSender: map.get('brevoSmsSender') || process.env.BREVO_SMS_SENDER || '',
      emailEnabled,
      smsEnabled,
      hasApiKey: apiKeyStored.length > 0 || Boolean(process.env.BREVO_API_KEY),
    })
  } catch (error) {
    console.error('Brevo settings GET:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !isAdmin(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const senderEmail = typeof body?.senderEmail === 'string' ? body.senderEmail.trim() : ''
    const senderName = typeof body?.senderName === 'string' ? body.senderName.trim() : ''
    const smsSender = typeof body?.smsSender === 'string' ? body.smsSender.trim() : ''
    const emailEnabled = body?.emailEnabled === true
    const smsEnabled = body?.smsEnabled === true
    const apiKeyRaw = typeof body?.apiKey === 'string' ? body.apiKey.trim() : ''

    if (body?.clearApiKey === true) {
      await prisma.setting.deleteMany({ where: { key: 'brevoApiKey' } })
    }

    const payloads: { key: string; value: string }[] = [
      { key: 'brevoSenderEmail', value: senderEmail },
      { key: 'brevoSenderName', value: senderName || 'Aigle Royale' },
      { key: 'brevoSmsSender', value: smsSender },
      { key: 'brevoEmailEnabled', value: String(emailEnabled) },
      { key: 'brevoSmsEnabled', value: String(smsEnabled) },
    ]

    if (apiKeyRaw && apiKeyRaw !== '••••••••') {
      payloads.push({ key: 'brevoApiKey', value: apiKeyRaw })
    }

    await prisma.$transaction(
      payloads.map((p) =>
        prisma.setting.upsert({
          where: { key: p.key },
          create: { key: p.key, value: p.value },
          update: { value: p.value },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Brevo settings POST:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
