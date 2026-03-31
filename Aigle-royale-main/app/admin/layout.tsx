import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect('/auth/login')
    }

    if (session.user.role !== 'ADMINISTRATOR' && session.user.role !== 'SUPERVISOR') {
        redirect('/dashboard')
    }

    return (
        <div className="flex min-h-screen bg-gray-50 overflow-hidden">
            <AdminSidebar />
            <main className="flex-1 h-screen overflow-y-auto relative custom-scrollbar">
                <div className="container mx-auto px-4 py-8 max-w-7xl">
                    {children}
                </div>
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}} />
        </div>
    )
}
