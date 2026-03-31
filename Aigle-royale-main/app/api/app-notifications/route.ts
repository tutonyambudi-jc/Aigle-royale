import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })

    const notifications = await prisma.appNotification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('App notifications GET error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })

    const body = await request.json()
    const notificationId = typeof body?.notificationId === 'string' ? body.notificationId : ''
    const markAll = body?.markAll === true

    if (markAll) {
      await prisma.appNotification.updateMany({
        where: { userId: session.user.id, isRead: false },
        data: { isRead: true, readAt: new Date() },
      })
      return NextResponse.json({ success: true })
    }

    if (!notificationId) {
      return NextResponse.json({ error: 'notificationId requis' }, { status: 400 })
    }

    await prisma.appNotification.updateMany({
      where: { id: notificationId, userId: session.user.id },
      data: { isRead: true, readAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('App notifications PATCH error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
