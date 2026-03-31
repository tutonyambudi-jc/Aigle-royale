import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { compare, hash } from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Connexion requise' }, { status: 401 })
    }

    const body = await request.json()
    const currentPassword =
      typeof body.currentPassword === 'string' ? body.currentPassword : ''
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Mot de passe actuel et nouveau requis' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Le nouveau mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    }

    const ok = await compare(currentPassword, user.password)
    if (!ok) {
      return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 400 })
    }

    const hashed = await hash(newPassword, 12)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashed },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('POST /api/profile/password:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
