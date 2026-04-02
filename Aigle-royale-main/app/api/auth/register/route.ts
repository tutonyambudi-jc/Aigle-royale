import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { checkRateLimit, getRequestIp } from '@/lib/rate-limit'

const REGISTER_WINDOW_MS = 15 * 60 * 1000
const REGISTER_MAX_PER_WINDOW = 5

function makeReferralCode(): string {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4)
  return `AR-${timestamp}-${random}`
}

export async function POST(request: Request) {
  try {
    const ip = getRequestIp(request)
    const limited = checkRateLimit(`register:${ip}`, REGISTER_MAX_PER_WINDOW, REGISTER_WINDOW_MS)
    if (!limited.ok) {
      return NextResponse.json(
        {
          error: `Trop de tentatives d’inscription. Réessayez dans ${limited.retryAfterSec} s.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(limited.retryAfterSec) },
        }
      )
    }

    const body = await request.json()
    const { firstName, lastName, email, phone, password, referralCode } = body

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'Tous les champs requis doivent être remplis' },
        { status: 400 }
      )
    }

    const referralCodeInput =
      typeof referralCode === 'string' ? referralCode.trim().toUpperCase() : ''

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 400 }
      )
    }

    // Hasher le mot de passe
    const hashedPassword = await hash(password, 10)

    // Parrainage (optionnel)
    const REFERRER_BONUS_FC = 500
    const NEW_USER_BONUS_FC = 500

    const created = await prisma.$transaction(async (tx) => {
      let referrerId: string | undefined

      if (referralCodeInput) {
        const referrer = await tx.user.findFirst({
          where: { referralCode: referralCodeInput },
          select: { id: true },
        })
        if (!referrer) {
          return { error: 'Code de parrainage invalide' as const }
        }
        referrerId = referrer.id
      }

      const newUserReferralCode = await (async () => {
        for (let i = 0; i < 10; i++) {
          const code = makeReferralCode()
          const exists = await tx.user.findFirst({
            where: { referralCode: code },
            select: { id: true },
          })
          if (!exists) return code
        }
        return `AR-${crypto.randomUUID().split('-')[0].toUpperCase()}`
      })()

      const user = await tx.user.create({
        data: {
          firstName,
          lastName,
          email,
          phone: phone || null,
          password: hashedPassword,
          role: 'CLIENT',
          referralCode: newUserReferralCode,
          referredById: referrerId ?? null,
          referralCredits: referralCodeInput ? NEW_USER_BONUS_FC : 0,
        },
        select: { id: true },
      })

      if (referrerId) {
        await tx.user.update({
          where: { id: referrerId },
          data: {
            referralCredits: { increment: REFERRER_BONUS_FC },
            referralCount: { increment: 1 },
          },
        })
      }

      return { userId: user.id }
    })

    if ('error' in created) {
      return NextResponse.json({ error: created.error }, { status: 400 })
    }

    return NextResponse.json(
      { message: 'Compte créé avec succès', userId: created.userId },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la création du compte' },
      { status: 500 }
    )
  }
}
