import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ClientAccountShell } from '@/components/account/ClientAccountShell'

export default async function ClientAccountLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/auth/login')
  }

  return (
    <ClientAccountShell
      userName={session.user.name ?? 'Client'}
      userEmail={session.user.email ?? ''}
    >
      {children}
    </ClientAccountShell>
  )
}
