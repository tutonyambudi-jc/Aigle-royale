import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ClientAccountShell } from '@/components/account/ClientAccountShell'

export default async function DashboardClientLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/auth/login')
  }

  const r = session.user.role
  if (r === 'ADMINISTRATOR' || r === 'SUPERVISOR') redirect('/admin')
  if (r === 'AGENT') redirect('/agent')
  if (r === 'AGENCY_STAFF') redirect('/agency')
  if (r === 'SUPER_AGENT') redirect('/super-agent')
  if (r === 'PARTNER_ADMIN') redirect('/partner')
  if (r === 'LOGISTICS') redirect('/logistics')

  return (
    <ClientAccountShell
      userName={session.user.name ?? 'Client'}
      userEmail={session.user.email ?? ''}
    >
      {children}
    </ClientAccountShell>
  )
}
