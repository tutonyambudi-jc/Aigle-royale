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
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    if (!isAdminRole(session.user.role)) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

    const companies = await prisma.busCompany.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    })

    return NextResponse.json({ companies })
  } catch (error) {
    console.error('Admin companies list error:', error)
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 })
  }
}
