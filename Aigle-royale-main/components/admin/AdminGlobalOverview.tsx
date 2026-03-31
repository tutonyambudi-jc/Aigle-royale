import Link from 'next/link'
import type { AdminGlobalModuleOverview } from '@/lib/admin-global-overview'

type Props = {
  overview: AdminGlobalModuleOverview
}

const linkClass = 'text-primary-700 hover:text-primary-900 hover:underline font-medium'

export function AdminGlobalOverview({ overview }: Props) {
  const groups: {
    title: string
    accent: string
    items: { label: string; value: string | number; href?: string; hint?: string }[]
  }[] = [
    {
      title: 'Exploitation & transport',
      accent: 'border-l-blue-500 bg-gradient-to-br from-blue-50/80 to-white',
      items: [
        { label: 'Réservations en attente', value: overview.bookingsPending, href: '/admin/bookings' },
        { label: 'Réservations confirmées', value: overview.bookingsConfirmed, href: '/admin/bookings' },
        { label: 'Routes actives', value: overview.routesActive, href: '/admin/routes' },
        { label: 'Trajets actifs', value: overview.tripsActive, href: '/admin/routes' },
        { label: 'Bus en service', value: overview.busesActive, href: '/admin/buses' },
        { label: 'Compagnies', value: overview.busCompanies, href: '/admin/companies/reviews' },
        { label: 'Colis / fret', value: overview.freightOrders, href: '/admin/freight' },
        { label: 'Manifestes (liens valides)', value: overview.manifestSharesActive, href: '/admin/manifests' },
      ],
    },
    {
      title: 'Réseau & offre commerciale',
      accent: 'border-l-amber-500 bg-gradient-to-br from-amber-50/80 to-white',
      items: [
        { label: 'Agences', value: overview.agencies, href: '/admin/agencies' },
        { label: 'Chauffeurs actifs', value: overview.driversActive, href: '/admin/drivers' },
        { label: 'Repas proposés', value: overview.mealsActive, href: '/admin/meals' },
        { label: 'Règles tarifs passagers', value: overview.passengerPricingRules, href: '/admin/passenger-pricing' },
        { label: 'Arrêts de ville', value: overview.cityStops, href: '/admin/city-stops' },
        { label: 'Offres / promos en cours', value: overview.offersActive, href: '/admin/offers' },
        { label: 'Bons de voyage', value: overview.travelVouchersTotal, href: '/admin/travel-vouchers' },
      ],
    },
    {
      title: 'Commercial & finance',
      accent: 'border-l-emerald-500 bg-gradient-to-br from-emerald-50/80 to-white',
      items: [
        { label: 'Commissions à traiter', value: overview.commissionsPending, href: '/admin/commissions' },
        { label: 'Locations en attente', value: overview.rentalsPending, href: '/admin/rentals' },
        { label: 'Frais de service', value: overview.serviceFeeEnabled ? 'Activés' : 'Désactivés', href: '/admin/service-fees' },
        { label: 'Rapport financier', value: 'Ouvrir', href: '/admin/reports/revenue' },
        { label: 'Performance agents', value: 'Ouvrir', href: '/admin/reports/agents' },
      ],
    },
    {
      title: 'Clients & réputation',
      accent: 'border-l-rose-500 bg-gradient-to-br from-rose-50/80 to-white',
      items: [
        { label: 'Utilisateurs (total)', value: overview.usersTotal, href: '/admin/users' },
        { label: 'Comptes clients', value: overview.usersClients, href: '/admin/users' },
        { label: 'Avis compagnies', value: overview.companyReviewsTotal, href: '/admin/companies/reviews' },
        { label: 'Avis à modérer (masqués)', value: overview.companyReviewsHidden, href: '/admin/companies/reviews' },
        { label: 'Transactions fidélité', value: overview.loyaltyTransactions, href: '/admin/users' },
      ],
    },
    {
      title: 'Communication & support',
      accent: 'border-l-violet-500 bg-gradient-to-br from-violet-50/80 to-white',
      items: [
        { label: 'Campagnes notifications', value: overview.notificationCampaigns, href: '/admin/notifications' },
        { label: 'Envois réussis (30 j.)', value: overview.notificationLogsSent30d, href: '/admin/notifications/dashboard' },
        { label: 'Notifs app non lues', value: overview.appNotificationsUnread, href: '/admin/notifications/dashboard' },
        { label: 'Config. Brevo', value: '—', href: '/admin/notifications/brevo', hint: 'Email / SMS' },
        { label: 'Plaintes ouvertes', value: overview.supportComplaintsOpen, href: '/admin/support' },
        { label: 'Plaintes (total)', value: overview.supportComplaintsTotal, href: '/admin/support' },
      ],
    },
    {
      title: 'Publicité & leads',
      accent: 'border-l-cyan-500 bg-gradient-to-br from-cyan-50/80 to-white',
      items: [
        { label: 'Publicités actives', value: overview.adsActive, href: '/admin/advertisements' },
        { label: 'Demandes annonceurs (en attente)', value: overview.adInquiriesPending, href: '/admin/advertisements' },
      ],
    },
  ]

  return (
    <section className="mb-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Vue globale des modules</h2>
          <p className="text-sm text-gray-600 mt-1">
            Synthèse des volumes et statuts par domaine — accès rapide vers chaque espace.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {groups.map((group) => (
          <div
            key={group.title}
            className={`rounded-2xl border border-gray-200 shadow-sm overflow-hidden border-l-4 ${group.accent}`}
          >
            <div className="px-5 py-3 border-b border-gray-100 bg-white/70">
              <h3 className="font-bold text-gray-900 text-sm">{group.title}</h3>
            </div>
            <ul className="divide-y divide-gray-100 bg-white/90">
              {group.items.map((item) => (
                <li key={item.label} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
                  <span className="text-gray-700">
                    {item.href ? (
                      <Link href={item.href} className={linkClass}>
                        {item.label}
                      </Link>
                    ) : (
                      item.label
                    )}
                    {item.hint && <span className="text-gray-400 text-xs ml-1">({item.hint})</span>}
                  </span>
                  <span className="font-bold text-gray-900 tabular-nums shrink-0">{item.value}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
