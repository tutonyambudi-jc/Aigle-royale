# Changelog

Toutes les évolutions notables du projet sont documentées ici.

## [2026-03-30] - Module Bons de voyage & report de billet

### Ajouté
- Module admin **Bons de voyage** :
  - page liste : `/admin/travel-vouchers`
  - page création : `/admin/travel-vouchers/create`
  - API admin : `GET/POST /api/admin/travel-vouchers`
- Menu admin : entrée **Bons de voyage** dans la sidebar.
- Action **Dupliquer** sur la liste des bons pour préremplir le formulaire de création.
- Action **Reporter** dans `/admin/bookings` :
  - génère un bon de voyage lié au billet,
  - annule automatiquement le billet initial avec motif.
- Colonne **Bon de voyage** dans la liste des réservations admin (`/admin/bookings`) :
  - affiche le code et le statut du bon lié, sinon `—`.
- Script utilitaire de test : `scripts/create-test-bookings.ts`.
- Module de **frais de service / frais administratif** configurable :
  - configuration dans `/admin/settings`,
  - clés de paramètres: `serviceFeeEnabled`, `serviceFeeMode`, `serviceFeeValue`,
  - calcul appliqué automatiquement lors de la création de réservation (`POST /api/bookings`).
- Module **classement des compagnies** :
  - endpoint classement: `GET /api/companies/ranking`,
  - endpoint notation: `POST /api/companies/reviews`,
  - page publique: `/companies/ranking` (lecture seule),
  - notation déplacée dans l'espace client: `/dashboard/reviews`,
  - badge automatique **Recommandée** selon règles métier (moyenne + nombre d’avis).
  - modération admin des avis: `/admin/companies/reviews` + API `GET/PATCH /api/admin/companies/reviews`.
- Module **notifications multi-canal** :
  - API admin: `GET/POST /api/admin/notifications`,
  - API client in-app: `GET/PATCH /api/app-notifications`,
  - pages admin: `/admin/notifications` et `/admin/notifications/dashboard`,
  - page client: `/dashboard/notifications`,
  - canaux supportés: SMS, WhatsApp, Email, Notification app,
  - journalisation des envois par campagne (`notification_campaigns`, `notification_logs`).
- Intégration **Brevo** (optionnelle) pour email et SMS transactionnels (`BREVO_*` dans `.env` ou page `/admin/notifications/brevo`).
- Module **Support client** : hub `/support`, assistance FAQ, lien WhatsApp configurable, plaintes (`SupportComplaint`) avec API `POST/GET /api/support/complaints`, admin `/admin/support` et paramètres `/admin/support/settings`.

### Modifié
- Tableau de bord admin : indicateurs **ventes** (7j / 30j), **revenus** encaissés (7j / 30j), **taux de remplissage** (trajets partis sur 30j), **performance partenaires** (compagnies, top CA sur 30j).
- **Vue globale des modules** sur `/admin` : compteurs et liens rapides par domaine (exploitation, réseau, commercial, clients, communication, publicité).
- Script `dev` dans `package.json` :
  - passe de `next dev` à `next dev --webpack` pour contourner le crash Turbopack observé localement.

### Documentation
- `README.md` mis à jour avec :
  - description du flux de report de billet,
  - vérification rapide du workflow,
  - commande de génération des réservations de test.
