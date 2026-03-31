import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendNotificationCampaign, type NotificationChannel } from '@/lib/notification-module'

function isAdminRole(role?: string) {
  return role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Acces non autorise' }, { status: 403 })

    const [campaigns, recentLogs, totals] = await Promise.all([
      prisma.notificationCampaign.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.notificationLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.notificationLog.groupBy({
        by: ['channel', 'status'],
        _count: { _all: true },
      }),
    ])

    return NextResponse.json({ campaigns, recentLogs, totals })
  } catch (error) {
    console.error('Admin notifications GET error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Acces non autorise' }, { status: 403 })

    const body = await request.json()
    const title = typeof body?.title === 'string' ? body.title.trim() : ''
    const message = typeof body?.message === 'string' ? body.message.trim() : ''
    const audience = body?.audience === 'ACTIVE_USERS' ? 'ACTIVE_USERS' : 'ALL_USERS'
    const channels = Array.isArray(body?.channels) ? body.channels : []
    const allowed: NotificationChannel[] = ['SMS', 'WHATSAPP', 'EMAIL', 'APP']
    const validChannels = channels.filter((channel: string): channel is NotificationChannel => allowed.includes(channel))

    if (!title || !message || validChannels.length === 0) {
      return NextResponse.json(
        { error: 'Titre, message et au moins un canal sont requis' },
        { status: 400 }
      )
    }

    const result = await sendNotificationCampaign({
      title,
      message,
      channels: validChannels,
      audience,
      createdById: session.user.id,
    })

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('Admin notifications POST error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
