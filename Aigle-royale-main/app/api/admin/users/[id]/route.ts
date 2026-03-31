import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

function isAdminRole(role?: string) {
  return role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
}

function normalizeRole(input: unknown): string | undefined {
  if (typeof input !== 'string') return undefined
  const r = input.trim().toUpperCase()
  const allowed = new Set([
    'CLIENT',
    'AGENT',
    'AGENCY_STAFF',
    'SUPER_AGENT',
    'PARTNER_ADMIN',
    'ADMINISTRATOR',
    'ACCOUNTANT',
    'SUPERVISOR',
    'LOGISTICS',
  ])
  return allowed.has(r) ? r : undefined
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const { id: userId } = await params
    const body = await request.json()

    const data: any = {}

    if (typeof body?.firstName === 'string') data.firstName = body.firstName.trim()
    if (typeof body?.lastName === 'string') data.lastName = body.lastName.trim()
    if (typeof body?.phone === 'string') data.phone = body.phone.trim() || null
    if (typeof body?.gender === 'string') data.gender = body.gender || null
    if (typeof body?.birthDate === 'string') data.birthDate = body.birthDate ? new Date(body.birthDate) : null
    if (typeof body?.passportOrIdNumber === 'string') data.passportOrIdNumber = body.passportOrIdNumber || null
    if (typeof body?.passportPhotoUrl === 'string') data.passportPhotoUrl = body.passportPhotoUrl || null
    if (typeof body?.city === 'string') data.city = body.city || null
    if (typeof body?.partnerCompanyId === 'string') data.partnerCompanyId = body.partnerCompanyId.trim() || null

    if (typeof body?.email === 'string') {
      const email = body.email.trim().toLowerCase()
      if (!email) return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
      data.email = email
    }

    if (typeof body?.isActive === 'boolean') {
      if (session.user.id === userId && body.isActive === false) {
        return NextResponse.json({ error: 'Vous ne pouvez pas désactiver votre propre compte.' }, { status: 400 })
      }
      data.isActive = body.isActive
    }

    const role = normalizeRole(body?.role)
    if (role) {
      if (session.user.id === userId && role !== session.user.role) {
        return NextResponse.json({ error: 'Vous ne pouvez pas modifier votre propre rôle.' }, { status: 400 })
      }
      data.role = role
    }

    if (typeof body?.newPassword === 'string' && body.newPassword) {
      if (body.newPassword.length < 6) {
        return NextResponse.json({ error: 'Mot de passe trop court (min 6)' }, { status: 400 })
      }
      data.password = await hash(body.newPassword, 10)
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Aucune modification' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ success: true, user: updated })
  } catch (error: any) {
    console.error('Admin user update error:', error)
    // Prisma unique violation for email etc.
    if (typeof error?.code === 'string' && error.code === 'P2002') {
      return NextResponse.json({ error: 'Valeur unique déjà utilisée' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const { id: userId } = await params
    if (session.user.id === userId) {
      return NextResponse.json({ error: 'Vous ne pouvez pas supprimer votre propre compte.' }, { status: 400 })
    }

    // Suppression douce: désactivation
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
      select: { id: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin user delete error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

