# Documentation pedagogique des modules du systeme

Ce document explique le systeme Aigle Royale comme un parcours d'apprentissage: **ce que fait chaque module**, **ou il vit dans le code**, **comment les modules collaborent**, et **par ou commencer pour evoluer sans casser l'existant**.

## 1) Vue d'ensemble

Le projet est une plateforme de transport avec plusieurs metiers dans une seule application:

- reservation de billets (client, agent, agence, super-agent)
- gestion de fret
- administration operationnelle (bus, routes, trajets, utilisateurs, statistiques)
- support client
- notifications multi-canales
- modules annexes (publicite, classement des compagnies, fidelite, vouchers)

Architecture technique:

- **Frontend + Backend applicatif**: Next.js (App Router) dans `app/`
- **Composants UI metier**: React dans `components/`
- **Regles metier et services**: utilitaires dans `lib/`
- **Persistance des donnees**: Prisma dans `prisma/schema.prisma`
- **Authentification et roles**: NextAuth (`lib/auth.ts`) + garde d'acces (`proxy.ts`)

## 2) Anatomie du code (reperes rapides)

- `app/`: pages (UI) + API (`app/api/**/route.ts`)
- `components/`: composants reutilisables par domaine (`admin`, `freight`, `partner`, etc.)
- `lib/`: logique metier transversale (auth, notifications, frais de service, bagages, QR, etc.)
- `prisma/schema.prisma`: modele de donnees central (Users, Booking, Trip, FreightOrder, etc.)
- `scripts/`: scripts utilitaires/tests operationnels

## 3) Module Authentification et roles

### Objectif
Controler qui peut faire quoi dans le systeme.

### Pieces principales
- `lib/auth.ts`: configuration NextAuth (provider credentials, JWT/session)
- `proxy.ts`: redirections et protections par role sur les routes sensibles

### Logique cle
- login via email/mot de passe avec verification `bcryptjs`
- enrichissement du token avec `id` et `role`
- blocage d'acces si role non autorise (`/admin`, `/agent`, `/agency`, etc.)

### Modeles concernes
- `User` (role, isActive, infos profil)

## 4) Module Reservation de billets

### Objectif
Permettre de rechercher un trajet, selectionner des sieges, creer des billets et payer.

### Parcours metier (simplifie)
1. l'utilisateur recherche un trajet (`/trips/search`)
2. le systeme renvoie les trajets actifs du jour avec disponibilite
3. l'utilisateur reserve un ou plusieurs passagers
4. le systeme cree un `BookingGroup` + des `Booking`
5. generation du ticket + QR
6. paiement/confirmation

### Pieces principales
- UI: `app/trips/**`, `app/bookings/**`, `components/reservations/**`, `components/client/**`
- API recherche: `app/api/trips/search/route.ts`
- API creation reservation: `app/api/bookings/route.ts`
- API paiement: `app/api/bookings/[id]/payment/route.ts`, `app/api/booking-groups/[id]/payment/route.ts`

### Regles metier importantes
- validation des donnees passager
- interdiction des sieges dupliques dans une meme commande
- verif capacite bus + disponibilite siege par trajet
- fenetres temporelles differentes selon role (client/agent/super-agent)
- calcul prix: base -> reduction passager -> extras bagages -> frais de service
- ticket QR genere pour chaque billet

### Modeles concernes
- `Trip`, `Route`, `Seat`, `BookingGroup`, `Booking`, `PassengerPricing`

## 5) Module Tarification et frais

### Objectif
Calculer un prix fiable et explicable.

### Pieces principales
- `lib/passenger-pricing.ts`: reductions selon type passager
- `lib/baggage.ts`: extras bagages
- `lib/service-fee.ts`: frais administratifs (`NONE` / `FIXED` / `PERCENT`)

### Regles metier
- configuration des frais stockee dans `Setting`
- calcul applique cote serveur (integrite des montants)

## 6) Module Administration (Back-office)

### Objectif
Piloter l'exploitation transport et la supervision metier.

### Pieces principales
- pages `app/admin/**`
- APIs `app/api/admin/**`
- composants `components/admin/**`

### Sous-modules admin
- flotte bus et sieges (`/admin/buses`, gestion visibilite sieges)
- routes, arrets de ville et arrets intermediaires (`/admin/routes`, `/admin/city-stops`)
- trajets, conducteurs, manifests
- reservations, commissions, utilisateurs
- frais de service, notifications, support, vouchers, publicites, avis compagnies

### Modeles concernes (exemples)
- `Bus`, `Seat`, `Route`, `RouteStop`, `CityStop`, `Trip`, `Driver`, `Setting`

## 7) Module Fret (colis)

### Objectif
Gerer la creation et le suivi des colis.

### Pieces principales
- UI: `app/freight/**`, `components/freight/**`
- API: `app/api/freight/**`, `app/api/admin/freight/route.ts`

### Capacites
- creation d'un envoi
- suivi du statut
- gestion operationnelle et reporting

### Modeles concernes
- `FreightOrder`, `Trip`, `Bus`, `User`

## 8) Module Notifications

### Objectif
Envoyer des messages transactionnels et des campagnes.

### Pieces principales
- service canal: `lib/notifications.ts`
- orchestration campagne: `lib/notification-module.ts`
- APIs: `app/api/admin/notifications/route.ts`, `app/api/app-notifications/route.ts`
- ecrans: `app/admin/notifications/**`, `app/dashboard/notifications/page.tsx`

### Canaux
- `EMAIL`, `SMS`, `WHATSAPP`, `APP`
- Brevo active pour email/SMS si configuration presente; sinon mode mock
- WhatsApp actuellement en mock (fournisseur a connecter)

### Modeles concernes
- `NotificationCampaign`, `NotificationLog`, `AppNotification`

## 9) Module Support client

### Objectif
Centraliser assistance publique + traitement interne des reclamations.

### Pieces principales
- UI publique: `app/support/**`
- UI admin: `app/admin/support/**`
- config WhatsApp: `lib/support-config.ts`
- API: `app/api/support/**`, `app/api/admin/support/**`

### Capacites
- FAQ / assistance
- creation de plainte/reclamation
- suivi interne (statut, priorite, notes)
- lien WhatsApp configurable via DB/env

### Modeles concernes
- `SupportComplaint`, `Setting`

## 10) Modules complementaires

- **Publicite**: `app/advertise`, `app/api/advertisements/**`, modeles `Advertisement`, `AdvertisementInquiry`
- **Classement compagnies**: `app/companies/ranking`, `app/api/companies/ranking/route.ts`, modele `CompanyReview`
- **Fidelite / referral**: `app/loyalty`, `app/referral`, modeles `LoyaltyTransaction` + champs `User` (points, referral)
- **Bons de voyage**: `app/admin/travel-vouchers/**`, API admin associee, modele `TravelVoucher`
- **Logistique**: `app/logistics/**`, APIs `app/api/logistics/**`
- **Partenaires**: `app/partner`, `app/partners`, `components/partner/**`

## 11) Donnees: lecture rapide du schema Prisma

Le schema `prisma/schema.prisma` contient le coeur du metier.

Tables pivot a connaitre en priorite:

- `User`: identite + role + etat compte
- `Trip`: trajet date/heure/prix/capacite
- `BookingGroup` + `Booking`: reservation mono ou multi-passagers
- `Bus` + `Seat`: flotte et inventaire de places
- `Route` + `RouteStop` + `CityStop`: reseau transport
- `FreightOrder`: colis/fret
- `Setting`: parametres dynamiques
- `NotificationCampaign` + `NotificationLog`: traçabilite communication

## 12) Flux transverses a maitriser

### A. Flux reservation (critique business)
- recherche trajet -> creation booking(s) -> paiement -> confirmation
- depend fortement de `Trip`, `Seat`, `Booking`, `PassengerPricing`, `Setting`

### B. Flux securite
- login -> token/session -> garde de routes -> autorisations API

### C. Flux communication client
- evenement metier (reservation/paiement/campagne) -> envoi multi-canal -> journalisation

## 13) Par ou commencer pour maintenir/evoluer

Pour un nouveau developpeur, ordre recommande:

1. lire `README.md` puis `prisma/schema.prisma`
2. comprendre `lib/auth.ts`, `proxy.ts`, `lib/prisma.ts`
3. suivre un flux complet: `app/trips/search` + `app/api/bookings/route.ts`
4. explorer ensuite les modules annexes (fret, support, notifications)
5. finir par l'admin (`app/admin/**`) qui assemble la plupart des cas metier

## 14) Carte mentale courte (en une phrase)

Le systeme est un **noyau de reservation transport** enrichi de **modules operationnels (fret/logistique/admin)** et de **services transverses (auth, notifications, support, parametres dynamiques)**, tous connectes autour du schema Prisma.
