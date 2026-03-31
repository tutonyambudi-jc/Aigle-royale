import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdminRole(role?: string) {
  return role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !isAdminRole(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const keys = ['supportWhatsAppNumber', 'supportWhatsAppPrefill'] as const
    const rows = await prisma.setting.findMany({ where: { key: { in: [...keys] } } })
    const map = new Map(rows.map((r) => [r.key, r.value]))

    return NextResponse.json({
      whatsappNumber: map.get('supportWhatsAppNumber') || '',
      whatsappPrefill:
        map.get('supportWhatsAppPrefill') ||
        'Bonjour, j’ai besoin d’assistance concernant Aigle Royale.',
    })
  } catch (error) {
    console.error('Admin support settings GET:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !isAdminRole(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const whatsappNumber = typeof body?.whatsappNumber === 'string' ? body.whatsappNumber.trim() : ''
    const whatsappPrefill = typeof body?.whatsappPrefill === 'string' ? body.whatsappPrefill.trim() : ''

    await prisma.$transaction([
      prisma.setting.upsert({
        where: { key: 'supportWhatsAppNumber' },
        create: { key: 'supportWhatsAppNumber', value: whatsappNumber.replace(/\D/g, '') },
        update: { value: whatsappNumber.replace(/\D/g, '') },
      }),
      prisma.setting.upsert({
        where: { key: 'supportWhatsAppPrefill' },
        create: { key: 'supportWhatsAppPrefill', value: whatsappPrefill },
        update: { value: whatsappPrefill },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin support settings POST:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
