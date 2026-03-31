import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdminRole(role?: string) {
  return role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const meal = await prisma.meal.findUnique({ where: { id: p.id } })
    if (!meal) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

    return NextResponse.json({ meal })
  } catch (error) {
    console.error('Admin meal fetch error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const body = await request.json()
    const data: any = {}
    if (typeof body?.name === 'string') data.name = body.name.trim()
    if (typeof body?.description === 'string') data.description = body.description.trim() || null
    if (typeof body?.isActive === 'boolean') data.isActive = body.isActive
    if (body?.price !== undefined) {
      const price = Number(body.price)
      if (!Number.isFinite(price) || price < 0) return NextResponse.json({ error: 'Prix invalide' }, { status: 400 })
      data.price = price
    }

    const meal = await prisma.meal.update({ where: { id: p.id }, data })
    return NextResponse.json({ meal })
  } catch (error) {
    console.error('Admin meal update error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    await prisma.meal.delete({ where: { id: p.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin meal delete error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

