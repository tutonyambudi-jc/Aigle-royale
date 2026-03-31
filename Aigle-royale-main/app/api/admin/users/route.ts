import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

function isAdminRole(role?: string) {
  return role === 'ADMINISTRATOR' || role === 'SUPERVISOR'
}

function normalizeRole(input: unknown): string {
  const r = typeof input === 'string' ? input.trim().toUpperCase() : ''
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
  return allowed.has(r) ? r : 'CLIENT'
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()
    const role = (searchParams.get('role') || '').trim().toUpperCase()
    const active = (searchParams.get('active') || '').trim().toLowerCase()
    const limit = Math.min(500, Math.max(1, Number(searchParams.get('limit') || 200)))

    const where: any = {}
    if (role && role !== 'ALL') where.role = role
    if (active === 'true') where.isActive = true
    if (active === 'false') where.isActive = false

    // SQLite: pas de "mode: insensitive" => on filtre en JS après.
    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        referralCount: true,
        referralCredits: true,
        loyaltyPoints: true,
        loyaltyTier: true,
        gender: true,
        birthDate: true,
        passportOrIdNumber: true,
        passportPhotoUrl: true,
        city: true,
        partnerCompanyId: true,
        createdAt: true,
        updatedAt: true,
        partnerCompany: { select: { id: true, name: true } },
        _count: { select: { bookings: true, freightOrders: true } },
      },
    })

    const filtered =
      q.length === 0
        ? users
        : users.filter((u) => {
          const hay = `${u.firstName} ${u.lastName} ${u.email} ${u.phone || ''}`.toLowerCase()
          return hay.includes(q.toLowerCase())
        })

    return NextResponse.json({ users: filtered })
  } catch (error) {
    console.error('Admin users list error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const body = await request.json()
    const firstName = typeof body?.firstName === 'string' ? body.firstName.trim() : ''
    const lastName = typeof body?.lastName === 'string' ? body.lastName.trim() : ''
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : ''
    const password = typeof body?.password === 'string' ? body.password : ''
    const role = normalizeRole(body?.role)
    const gender = typeof body?.gender === 'string' ? body.gender : null
    const birthDate = typeof body?.birthDate === 'string' && body.birthDate ? new Date(body.birthDate) : null
    const passportOrIdNumber = typeof body?.passportOrIdNumber === 'string' ? body.passportOrIdNumber : null
    const passportPhotoUrl = typeof body?.passportPhotoUrl === 'string' ? body.passportPhotoUrl : null
    const city = typeof body?.city === 'string' ? body.city : null
    const partnerCompanyId = typeof body?.partnerCompanyId === 'string' && body.partnerCompanyId.trim() ? body.partnerCompanyId.trim() : null

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Mot de passe trop court (min 6)' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (existing) return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 400 })

    const hashedPassword = await hash(password, 10)
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        password: hashedPassword,
        role,
        isActive: true,
        gender,
        birthDate,
        passportOrIdNumber,
        passportPhotoUrl,
        city,
        partnerCompanyId,
      },
      select: { id: true },
    })

    return NextResponse.json({ success: true, userId: user.id }, { status: 201 })
  } catch (error) {
    console.error('Admin user create error:', error)
    return NextResponse.json({ error: `Erreur technique (${error instanceof Error ? error.message : 'Inconnue'})` }, { status: 500 })
  }
}

