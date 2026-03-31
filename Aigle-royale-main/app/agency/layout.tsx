import { AgencySidebar } from '@/components/agency/AgencySidebar'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function AgencyLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect('/auth/login')
    }

    if (session.user.role !== 'AGENCY_STAFF' && session.user.role !== 'ADMINISTRATOR' && session.user.role !== 'SUPERVISOR') {
        redirect('/dashboard')
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <AgencySidebar />
            <main className="flex-1 lg:ml-0 min-w-0 overflow-y-auto pt-16 lg:pt-0">
                <div className="container mx-auto px-4 py-8 max-w-7xl">
                    {children}
                </div>
            </main>
        </div>
    )
}
