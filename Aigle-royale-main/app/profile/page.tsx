import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { format } from 'date-fns'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProfileForm } from '@/components/profile/ProfileForm'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/auth/login?callbackUrl=' + encodeURIComponent('/profile'))
  }

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      city: true,
      gender: true,
      birthDate: true,
      passportOrIdNumber: true,
      loyaltyPoints: true,
      loyaltyTier: true,
      referralCode: true,
    },
  })

  if (!me) {
    redirect('/auth/login')
  }

  const birthDateStr = me.birthDate ? format(me.birthDate, 'yyyy-MM-dd') : ''

  return (
    <ProfileForm
      initial={{
        firstName: me.firstName,
        lastName: me.lastName,
        email: me.email,
        phone: me.phone,
        city: me.city,
        gender: me.gender,
        birthDate: birthDateStr,
        passportOrIdNumber: me.passportOrIdNumber,
        loyaltyPoints: me.loyaltyPoints,
        loyaltyTier: me.loyaltyTier,
        referralCode: me.referralCode,
      }}
    />
  )
}
