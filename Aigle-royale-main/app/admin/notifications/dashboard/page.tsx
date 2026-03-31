import { prisma } from '@/lib/prisma'

async function getNotificationStats() {
  const [campaigns, logsByChannel, totalAppNotifications, unreadAppNotifications] = await Promise.all([
    prisma.notificationCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: {
        id: true,
        title: true,
        channels: true,
        totalTargets: true,
        totalSent: true,
        totalFailed: true,
        createdAt: true,
      },
    }),
    prisma.notificationLog.groupBy({
      by: ['channel', 'status'],
      _count: { _all: true },
    }),
    prisma.appNotification.count(),
    prisma.appNotification.count({ where: { isRead: false } }),
  ])

  return { campaigns, logsByChannel, totalAppNotifications, unreadAppNotifications }
}

export default async function NotificationsDashboardPage() {
  const stats = await getNotificationStats()
  const totalSent = stats.logsByChannel
    .filter((entry) => entry.status === 'SENT')
    .reduce((acc, entry) => acc + entry._count._all, 0)
  const totalFailed = stats.logsByChannel
    .filter((entry) => entry.status === 'FAILED')
    .reduce((acc, entry) => acc + entry._count._all, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Notifications</h1>
        <p className="text-sm text-gray-600 mt-1">
          Vue globale des campagnes, performances par canal et notifications in-app.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">Campagnes recentes</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{stats.campaigns.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">Messages envoyes</div>
          <div className="text-3xl font-bold text-green-700 mt-1">{totalSent}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">Echecs</div>
          <div className="text-3xl font-bold text-red-700 mt-1">{totalFailed}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">In-app non lues</div>
          <div className="text-3xl font-bold text-primary-700 mt-1">{stats.unreadAppNotifications}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance par canal</h2>
          <div className="space-y-3">
            {stats.logsByChannel.map((entry) => (
              <div key={`${entry.channel}-${entry.status}`} className="flex items-center justify-between border rounded-lg px-3 py-2">
                <div className="text-sm font-medium text-gray-800">
                  {entry.channel} - {entry.status}
                </div>
                <div className="text-sm font-bold text-gray-900">{entry._count._all}</div>
              </div>
            ))}
            {stats.logsByChannel.length === 0 && (
              <p className="text-sm text-gray-500">Aucune donnee disponible pour le moment.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dernieres campagnes</h2>
          <div className="space-y-3">
            {stats.campaigns.map((campaign) => (
              <div key={campaign.id} className="border rounded-lg p-3">
                <div className="font-semibold text-gray-900">{campaign.title}</div>
                <div className="text-xs text-gray-500 mt-1">{campaign.channels}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Cibles: {campaign.totalTargets} | Sent: {campaign.totalSent} | Failed: {campaign.totalFailed}
                </div>
              </div>
            ))}
            {stats.campaigns.length === 0 && (
              <p className="text-sm text-gray-500">Aucune campagne envoyee.</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Notifications app</h2>
        <p className="text-sm text-gray-600">
          Total en base: <span className="font-semibold text-gray-900">{stats.totalAppNotifications}</span>
        </p>
      </div>
    </div>
  )
}
