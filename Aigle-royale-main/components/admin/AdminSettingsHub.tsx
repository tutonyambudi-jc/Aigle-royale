import Link from 'next/link'

type HubItem = {
  title: string
  description: string
  href: string
}

type HubSection = {
  id: string
  title: string
  description?: string
  items: HubItem[]
}

const SECTIONS: HubSection[] = [
  {
    id: 'tarifs',
    title: 'Tarifs & offres',
    description: 'Grilles tarifaires, promotions et options voyage.',
    items: [
      {
        title: 'Tarification par type de passager',
        description: 'Réductions enfant, senior, etc.',
        href: '/admin/passenger-pricing',
      },
      {
        title: 'Offres & codes promo',
        description: 'Campagnes promotionnelles.',
        href: '/admin/offers',
      },
      {
        title: 'Repas à bord',
        description: 'Prix et disponibilité des repas.',
        href: '/admin/meals',
      },
      {
        title: 'Frais de service (vue dédiée)',
        description: 'Même paramètres que ci-dessous, présentation focalisée.',
        href: '/admin/service-fees',
      },
      {
        title: 'Fret — prix au kg par compagnie',
        description: 'Tarif colis au kilogramme selon la compagnie du bus (section sur cette page).',
        href: '/admin/settings#freight-pricing',
      },
    ],
  },
  {
    id: 'finance',
    title: 'Finance & partenaires',
    items: [
      {
        title: 'Commissions agents',
        description: 'Taux par agent et vue d’ensemble.',
        href: '/admin/commissions/settings',
      },
      {
        title: 'Commissions — suivi',
        description: 'Liste et suivi des commissions.',
        href: '/admin/commissions',
      },
      {
        title: 'Agences',
        description: 'Points de vente et structure.',
        href: '/admin/agencies',
      },
      {
        title: 'Rapports financiers',
        description: 'Chiffre d’affaires et revenus.',
        href: '/admin/reports/revenue',
      },
    ],
  },
  {
    id: 'communication',
    title: 'Communication',
    items: [
      {
        title: 'Brevo (e-mail & SMS)',
        description: 'Clés API, expéditeurs, envoi transactionnel.',
        href: '/admin/notifications/brevo',
      },
      {
        title: 'Campagnes notifications',
        description: 'Envoi SMS, e-mail, WhatsApp, in-app.',
        href: '/admin/notifications',
      },
      {
        title: 'Suivi des envois',
        description: 'Tableau de bord des notifications.',
        href: '/admin/notifications/dashboard',
      },
    ],
  },
  {
    id: 'support',
    title: 'Support client',
    items: [
      {
        title: 'WhatsApp support',
        description: 'Numéro et texte prérempli pour le site public.',
        href: '/admin/support/settings',
      },
      {
        title: 'Plaintes & tickets',
        description: 'File des demandes support.',
        href: '/admin/support',
      },
    ],
  },
  {
    id: 'contenu',
    title: 'Contenu & visibilité',
    items: [
      {
        title: 'Slider accueil',
        description: 'Images du carrousel d’accueil.',
        href: '/admin/slider',
      },
      {
        title: 'Publicités',
        description: 'Annonces et emplacements.',
        href: '/admin/advertisements',
      },
      {
        title: 'Avis compagnies',
        description: 'Modération des avis voyageurs.',
        href: '/admin/companies/reviews',
      },
    ],
  },
  {
    id: 'technique',
    title: 'Technique & environnement',
    description: 'Certaines valeurs sont dans les variables d’environnement du serveur.',
    items: [
      {
        title: 'Variables tarifaires publics (bagages, USD…)',
        description:
          'NEXT_PUBLIC_USD_FC_RATE, NEXT_PUBLIC_EXTRA_BAGGAGE_*, etc. — voir env.example à la racine du projet.',
        href: '/admin/settings#env-doc',
      },
      {
        title: 'Annulation automatique des billets',
        description:
          'Endpoint GET /api/cron/cancel-expired-bookings sécurisé par CRON_SECRET (en-tête Authorization: Bearer).',
        href: '/admin/settings#cron-doc',
      },
    ],
  },
]

function HubCard({ item }: { item: HubItem }) {
  const isDoc = item.href.startsWith('#')
  if (isDoc) {
    return (
      <div
        id={item.href.replace('#', '')}
        className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 p-4 text-sm text-gray-700"
      >
        <p className="font-semibold text-gray-900">{item.title}</p>
        <p className="mt-1 text-gray-600 leading-relaxed">{item.description}</p>
      </div>
    )
  }
  return (
    <Link
      href={item.href}
      className="group block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-primary-300 hover:shadow-md"
    >
      <p className="font-semibold text-gray-900 group-hover:text-primary-700">{item.title}</p>
      <p className="mt-1 text-sm text-gray-600 leading-relaxed">{item.description}</p>
      <span className="mt-2 inline-flex items-center text-xs font-semibold text-primary-600">
        Ouvrir
        <span className="ml-1 transition group-hover:translate-x-0.5">→</span>
      </span>
    </Link>
  )
}

function TechnicalDocsAnchors() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">Rappels techniques</h2>
      <div id="env-doc" className="scroll-mt-24 mb-6">
        <h3 className="font-semibold text-gray-900">Variables d’environnement (tarifs publics, bagages, USD…)</h3>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Les montants exposés côté site (taux USD/FC, options bagages, etc.) sont souvent définis dans les variables{' '}
          <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">NEXT_PUBLIC_*</code> au moment du build. Consultez le
          fichier <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">env.example</code> à la racine du projet pour la
          liste des clés. Après modification, redéployez l’application pour que les valeurs soient prises en compte.
        </p>
      </div>
      <div id="cron-doc" className="scroll-mt-24">
        <h3 className="font-semibold text-gray-900">Tâche planifiée — annulation des billets expirés</h3>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Planifiez un appel HTTP <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">GET</code> vers{' '}
          <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">/api/cron/cancel-expired-bookings</code> avec
          l’en-tête{' '}
          <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">Authorization: Bearer &lt;CRON_SECRET&gt;</code>{' '}
          (valeur <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">CRON_SECRET</code> côté serveur, jamais
          exposée au navigateur).
        </p>
      </div>
    </div>
  )
}

export function AdminSettingsHub() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
        <p className="mt-2 text-gray-600 max-w-3xl">
          Point d’entrée unique pour la configuration métier : tarifs, messagerie, support, contenu et rappels
          techniques. Les écrans existants ne sont pas modifiés — vous accédez aux mêmes outils, organisés par
          domaine.
        </p>
      </div>

      {SECTIONS.map((section) => (
        <section key={section.id} id={section.id} className="scroll-mt-8">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">{section.title}</h2>
          {section.description && <p className="text-sm text-gray-600 mb-4">{section.description}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            {section.items.map((item) => (
              <HubCard key={item.title + item.href} item={item} />
            ))}
          </div>
        </section>
      ))}

      <TechnicalDocsAnchors />
    </div>
  )
}
