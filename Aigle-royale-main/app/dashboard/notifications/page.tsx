'use client'

import { useEffect, useMemo, useState } from 'react'

type AppNotification = {
  id: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export default function DashboardNotificationsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notifications, setNotifications] = useState<AppNotification[]>([])

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  )

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/app-notifications', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'Erreur API')
      setNotifications(data.notifications || [])
    } catch {
      setError('Impossible de charger vos notifications.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const markAsRead = async (notificationId: string) => {
    await fetch('/api/app-notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId }),
    })
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notificationId ? { ...item, isRead: true } : item
      )
    )
  }

  const markAllAsRead = async () => {
    await fetch('/api/app-notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    })
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })))
  }

  return (
    <div className="max-w-4xl mx-auto">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-1">Messages</p>
              <h1 className="text-2xl font-black text-slate-900">Mes notifications</h1>
              <p className="text-sm text-gray-600">
                Vous avez <span className="font-semibold">{unreadCount}</span> notification(s) non lue(s).
              </p>
            </div>
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Tout marquer comme lu
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-gray-600">Chargement...</p>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune notification pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-xl border p-4 ${
                    notification.isRead ? 'border-gray-200 bg-white' : 'border-primary-200 bg-primary-50/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                      <p className="text-sm text-gray-700 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(notification.createdAt).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs px-2 py-1 rounded border border-primary-300 text-primary-700 hover:bg-primary-100"
                      >
                        Marquer lu
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
    </div>
  )
}
