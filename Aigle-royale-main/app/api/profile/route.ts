import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Connexion requise' }, { status: 401 })
    }

    const body = await request.json()
    const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : ''
    const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
    const city = typeof body.city === 'string' ? body.city.trim() : ''
    const genderRaw = typeof body.gender === 'string' ? body.gender.trim() : ''
    const passportOrIdNumber =
      typeof body.passportOrIdNumber === 'string' ? body.passportOrIdNumber.trim() : ''
    const birthDateRaw = body.birthDate

    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'Prénom et nom sont requis' }, { status: 400 })
    }

    if (genderRaw !== '' && !['M', 'F', 'OTHER'].includes(genderRaw)) {
      return NextResponse.json({ error: 'Genre invalide' }, { status: 400 })
    }
    const gender = genderRaw === '' ? null : genderRaw

    let birthDate: Date | null = null
    if (birthDateRaw === null || birthDateRaw === '') {
      birthDate = null
    } else if (typeof birthDateRaw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(birthDateRaw)) {
      const d = new Date(birthDateRaw + 'T12:00:00.000Z')
      if (!Number.isNaN(d.getTime())) birthDate = d
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName,
        lastName,
        phone: phone || null,
        city: city || null,
        gender,
        passportOrIdNumber: passportOrIdNumber || null,
        birthDate,
      },
    })

    return NextResponse.json({
      ok: true,
      name: `${firstName} ${lastName}`.trim(),
    })
  } catch (error) {
    console.error('PATCH /api/profile:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
