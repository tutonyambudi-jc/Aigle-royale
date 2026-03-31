# Documentation unifiee - Version publication

Ce document consolide la documentation du projet en une version lisible et structuree, avec reduction des redondances. La compilation brute reste disponible dans `COMPILATION_DOCUMENTATION.md`.

Genere le 2026-03-31 00:04:18.

## Sommaire thematique

- [1. Vue d'ensemble](#1-vue-densemble)
- [2. Demarrage et installation](#2-demarrage-et-installation)
- [3. Architecture fonctionnelle des modules](#3-architecture-fonctionnelle-des-modules)
- [4. API et flux metier](#4-api-et-flux-metier)
- [5. Tarification et sieges](#5-tarification-et-sieges)
- [6. Tests et qualite](#6-tests-et-qualite)
- [7. Deploiement et operations](#7-deploiement-et-operations)
- [8. Audit et securite](#8-audit-et-securite)
- [9. Historique des changements](#9-historique-des-changements)
- [10. Annexes source](#10-annexes-source)

## 1. Vue d'ensemble

# 🚌 Plateforme Aigle Royale - Réservation de Billets de Bus & Gestion de Fret

Plateforme web complète pour la réservation et la vente de billets de bus avec gestion de fret et module publicitaire.

## 🚀 Fonctionnalités

### Module Client
- Recherche de trajets (ville départ/arrivée, date)
- **Recherche incluant les arrêts intermédiaires**
- **Sélection multiple de passagers** (adultes, enfants, bébés, seniors)
- Choix de siège interactif sur plan du bus
- **Sélection du type de passager** (Adulte, Enfant, Bébé, Senior, Handicapé)
- **Tarification automatique selon l'âge et le statut**
- **Paiement groupé pour plusieurs billets** (économie sur les frais de commission)
- Réservation et paiement (Mobile Money, Carte bancaire, Paiement en agence)
- Génération de billets électroniques avec QR code
- Historique des voyages
- Annulation/modification de réservations

### Module Agents Agréés
- Vente de billets pour clients
- Vente de fret (colis)
- Impression ou envoi de billets
- Commission automatique par vente
- Historique des transactions
- Rapports journaliers

### Module Agence Mère
- Vente directe au guichet
- Réservation pour paiement ultérieur
- Gestion des clients sans compte
- Impression de billets officiels
- Suivi caisse journalière

### Module Gestion du Fret
- Enregistrement de colis (poids, type, valeur)
- Association colis ↔ voyage
- Code de suivi unique
- Statuts : reçu / en transit / livré
- Tarification automatique

### Module Publicité
- Vente d'espaces publicitaires (bannières homepage, résultats, confirmation)
- Gestion des annonceurs
- Statistiques d'impressions & clics
- Facturation annonceurs

### Module Classement des compagnies
- Notation client (1 à 5 étoiles + commentaire) depuis l'espace client
- Classement automatique des compagnies (moyenne + volume d'avis)
- Badge **Recommandée** selon seuil métier

### Module Notifications
- Campagnes multi-canal : **SMS**, **WhatsApp**, **Email**, **notification app**
- Module admin d'envoi : `/admin/notifications`
- Dashboard de suivi des envois : `/admin/notifications/dashboard`
- Centre client des notifications in-app : `/dashboard/notifications`
- Journalisation des envois (sent/failed) par canal
- **Brevo (optionnel)** : interface admin `/admin/notifications/brevo` (clé API, expéditeurs, activation email/SMS) ou variables `BREVO_*` dans `.env`. Sans clé ni activation, l’envoi reste simulé (console). Le canal **WhatsApp** n’est pas branché sur Brevo dans ce code (mock ou autre fournisseur à prévoir).

### Module Support
- Hub public : `/support` — **Assistance** (FAQ), **WhatsApp** (lien `wa.me` si numéro configuré), **Plainte / réclamation** (formulaire avec référence `P-…`).
- Administration : `/admin/support` (liste, statut, priorité, notes internes), `/admin/support/settings` (numéro WhatsApp + message prérempli). Variables optionnelles : `SUPPORT_WHATSAPP_NUMBER`, `SUPPORT_WHATSAPP_PREFILL`.

### Back-Office
- Gestion des bus & flotte
- Gestion des trajets & horaires
- **Report de billet avec émission automatique d’un bon de voyage**
- **Gestion des frais de service / frais administratif (configurable)**
- **Gestion des arrêts intermédiaires sur les routes**
- **Gestion des arrêts de ville (gares et points d'embarquement)**
- **Gestion de la visibilité des sièges** (cacher/afficher par siège ou par rangée)
- **Numérotation alphanumérique des sièges** (A1, B1, C1, etc.)
- **Tarification par type de passager avec réductions automatiques**
- **Validation automatique de l'âge selon le type de passager**
- Gestion des agences & agents
- Utilisateurs & rôles
- Tableau de bord avec KPI
- Rapports exportables (Excel / PDF)
- **Paramètres système configurables** (méthode de sélection des sièges)

## 🛠️ Technologies

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Base de données**: PostgreSQL avec Prisma ORM
- **Authentification**: NextAuth.js
- **Validation**: Zod, React Hook Form

## 📦 Installation

1. Cloner le projet
```bash
git clone <repository-url>
cd "Aigle royale"
```

2. Installer les dépendances
```bash
npm install
```

3. Configurer la base de données
```bash
# Créer un fichier .env à partir de env.example
# Windows PowerShell :
Copy-Item env.example .env

# Modifier DATABASE_URL dans .env avec vos credentials PostgreSQL

# Générer le client Prisma
npm run db:generate

# Créer la base de données et appliquer les migrations
npm run db:push
```

4. Lancer le serveur de développement
```bash
npm run dev
```

5. Ouvrir [http://localhost:3000](http://localhost:3000)

## 📁 Structure du Projet

```
├── app/                    # App Router Next.js
│   ├── (auth)/            # Routes d'authentification
│   ├── (client)/          # Interface client
│   ├── (agent)/           # Interface agent agréé
│   ├── (agency)/          # Interface agence mère
│   ├── (admin)/           # Back-office
│   │   ├── settings/      # Configuration système
│   │   ├── buses/         # Gestion des bus
│   │   ├── routes/        # Gestion des trajets
│   │   │   └── [id]/stops/  # Gestion des arrêts de route
│   │   ├── city-stops/    # Gestion des arrêts de ville
│   │   └── ...
│   └── api/               # API Routes
│       ├── auth/          # Authentification
│       ├── bookings/      # Réservations
│       ├── admin/         # API admin
│       │   ├── settings/  # Gestion des paramètres
│       │   ├── routes/    # API routes admin
│       │   │   └── [id]/
│       │   │       └── stops/  # API arrêts de route
│       │   └── city-stops/  # API arrêts de ville
│       ├── settings/      # API publique des paramètres
│       └── ...
├── components/            # Composants React réutilisables
│   ├── client/           # Composants client (SeatMap, BookingForm...)
│   ├── admin/            # Composants admin
│   └── ...
├── lib/                   # Utilitaires et configurations
├── prisma/                # Schéma Prisma
│   ├── schema.prisma     # Définition des modèles
│   ├── seed.ts           # Script de peuplement
│   └── migrations/       # Migrations de base de données
└── public/                # Assets statiques
```

## 🔐 Rôles Utilisateurs

- **CLIENT**: Achat de billets et envoi de colis
- **AGENT**: Vente de billets & fret via le système
- **AGENCY_STAFF**: Vente physique centralisée
- **ADMINISTRATOR**: Supervision globale
- **ACCOUNTANT**: Suivi financier
- **SUPERVISOR**: Contrôle des agences et agents

## 🎫 Report de billet (Admin)

Le back-office admin permet maintenant de **reporter un billet** en un clic depuis la liste des réservations (`/admin/bookings`) :

- Action **Reporter** sur une réservation `PENDING` ou `CONFIRMED`
- Génération d’un **bon de voyage** (code `BV-XXXX...`) avec le montant du billet
- Annulation automatique du billet initial avec motif de report
- Traçabilité dans le module **Bons de voyage** (`/admin/travel-vouchers`)
- Colonne **Bon de voyage** dans `/admin/bookings` (code + statut du bon lié)
- Action **Dupliquer** dans `/admin/travel-vouchers` pour préremplir la création d’un nouveau bon

Ce mécanisme évite la perte de valeur pour le client tout en gardant un historique clair côté exploitation.

## 🏆 Classement des compagnies

Le module de classement est disponible via `/companies/ranking` et propose :

- **Consultation publique** : classement des compagnies et badge recommandée.
- **Note client** : un client peut noter une compagnie (1 à 5) et laisser un commentaire depuis `/dashboard/reviews`.
- **Contrôle métier** : la note est autorisée uniquement si le client a un billet `CONFIRMED` ou `COMPLETED` avec la compagnie.
- **Classement** : tri par moyenne décroissante, puis nombre d’avis.
- **Badge Recommandée** : attribué automatiquement selon les règles suivantes :
  - moyenne >= 4.2
  - au moins 3 avis
- **Modération admin** : les avis peuvent être masqués/affichés dans `/admin/companies/reviews` (seuls les avis visibles sont pris en compte dans le classement public).

## 💼 Frais de service (Admin)

Le back-office permet de configurer des frais administratifs dans `/admin/settings` :

- Activation / désactivation du module
- Mode de calcul :
  - `FIXED` : montant fixe en FC par billet
  - `PERCENT` : pourcentage appliqué au sous-total du billet
- Valeur des frais

Règle métier appliquée à la création de réservation :

- `sous-total billet = (prix après réduction passager) + extras bagages`
- `frais de service = fixe ou pourcentage selon le paramètre`
- `total billet = sous-total billet + frais de service`

Le calcul est appliqué côté serveur au moment de `POST /api/bookings` pour préserver l’intégrité métier.

### Vérification rapide du flux

1. Aller sur `/admin/bookings`
2. Cliquer **Reporter** sur une réservation `PENDING` ou `CONFIRMED`
3. Vérifier :
   - réservation initiale en `CANCELLED`
   - code `BV-...` visible dans la colonne **Bon de voyage**
   - bon présent dans `/admin/travel-vouchers`

## 📝 Scripts Disponibles

- `npm run dev` - Lancer le serveur de développement
- `npm run build` - Construire pour la production
- `npm run start` - Lancer le serveur de production
- `npm run db:generate` - Générer le client Prisma
- `npm run db:push` - Pousser les changements vers la DB
- `npm run db:migrate` - Créer une migration
- `npm run db:seed` - Peupler la base de données avec des données de test
- `npm run db:studio` - Ouvrir Prisma Studio
- `npx tsx scripts/create-test-bookings.ts` - Créer des réservations futures de test pour valider le flux de report

## ⚙️ Paramètres Système Configurables

### Méthode de Sélection des Sièges

L'application permet de configurer la méthode utilisée pour identifier les sièges lors de la réservation :

- **Par ID unique** (par défaut) : Utilise l'identifiant unique de chaque siège dans la base de données
- **Par numéro de siège** : Utilise le numéro visible du siège (ex: A1, B2, C3...)

**Configuration** : Accessible depuis `/admin/settings` (réservé aux administrateurs)

**API Endpoints** :
- `GET /api/settings?key=seatSelectionKey` - Récupérer le paramètre (public)
- `GET /api/admin/settings?key=seatSelectionKey` - Récupérer le paramètre (admin)
- `POST /api/admin/settings` - Modifier le paramètre (admin uniquement)

**Modèle de données** :
```typescript
model Setting {
  id        String   @id @default(uuid())
  key       String   @unique
  value     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Arrêts Intermédiaires sur les Routes

Le système permet de configurer des arrêts intermédiaires sur les routes pour permettre aux passagers d'embarquer ou de descendre dans des villes spécifiques sans affecter la route principale.

**Fonctionnalités** :
- **Arrêts de ville (CityStop)** : Gares et points d'embarquement dans chaque ville
- **Arrêts de route (RouteStop)** : Association d'arrêts à des routes spécifiques
- **Rôles d'arrêts** : BOARDING (embarquement), ALIGHTING (débarquement), STOP (les deux)
- **Ordre des arrêts** : Organisation séquentielle des arrêts sur la route
- **Disponibilité par segment** : Gestion des places disponibles entre chaque arrêt

**Configuration** :

1. **Gestion des arrêts de ville** : `/admin/city-stops`
   - Créer/modifier/supprimer des arrêts de ville
   - Associer à une ville spécifique
   - Définir nom et adresse

2. **Gestion des arrêts de route** : `/admin/routes/[id]/stops`
   - Ajouter des arrêts à une route
   - Définir le rôle (BOARDING/ALIGHTING/STOP)
   - Réorganiser l'ordre des arrêts
   - Ajouter des notes pour chaque arrêt

3. **Activation par bus** :
   - Propriété `allowsIntermediateStops` dans la configuration du bus
   - Seuls les bus autorisés peuvent être affectés aux routes avec arrêts

**API Endpoints** :
- `GET /api/admin/city-stops` - Liste des arrêts de ville
- `POST /api/admin/city-stops` - Créer un arrêt de ville
- `PUT /api/admin/city-stops/[id]` - Modifier un arrêt
- `DELETE /api/admin/city-stops/[id]` - Désactiver un arrêt
- `GET /api/admin/routes/[id]` - Détails d'une route
- `GET /api/admin/routes/[id]/stops` - Liste des arrêts d'une route
- `POST /api/admin/routes/[id]/stops` - Ajouter un arrêt à une route
- `DELETE /api/admin/routes/[id]/stops/[routeStopId]` - Supprimer un arrêt de route
- `PATCH /api/admin/routes/[id]/stops/[routeStopId]/reorder` - Réorganiser les arrêts

**Modèles de données** :
```typescript
model CityStop {
  id                String        @id @default(uuid())
  cityId            String
  name              String
  address           String?
  isActive          Boolean       @default(true)
  city              City          @relation(fields: [cityId], references: [id])
  routeStops        RouteStop[]
  boardingBookings  Booking[]     @relation("BoardingStop")
  alightingBookings Booking[]     @relation("AlightingStop")
}

model RouteStop {
  id        String   @id @default(uuid())
  routeId   String
  stopId    String
  order     Int
  role      String   // "BOARDING" | "ALIGHTING" | "STOP"
  notes     String?
  route     Route    @relation(fields: [routeId], references: [id])
  stop      CityStop @relation(fields: [stopId], references: [id])
}

model Bus {
  // ... autres champs
  allowsIntermediateStops Boolean  @default(false)
}

model Seat {
  id          String   @id @default(uuid())
  busId       String
  seatNumber  String   // Format alphanumérique: A1, A2, B1, B2, etc.
  seatType    String   @default("Standard")
  isAvailable Boolean  @default(true)
  isHidden    Boolean  @default(false) // Pour cacher/afficher le siège
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  bus      Bus        @relation(fields: [busId], references: [id], onDelete: Cascade)
  bookings Booking[]
  
  @@unique([busId, seatNumber])
}

model Booking {
  // ... autres champs
  passengerType        String    @default("ADULT") // ADULT, CHILD, INFANT, SENIOR, DISABLED
  passengerAge         Int?      // Âge du passager au moment de la réservation
  hasDisability        Boolean   @default(false)
  disabilityProofUrl   String?   // URL du justificatif de handicap
  basePrice            Float     @default(0) // Prix de base avant réductions
  discountAmount       Float     @default(0) // Montant de la réduction appliquée
  totalPrice           Float     @default(0) // Prix final après réduction
  boardingStopId       String?
  alightingStopId      String?
  boardingStop         CityStop? @relation("BoardingStop", fields: [boardingStopId], references: [id])
  alightingStop        CityStop? @relation("AlightingStop", fields: [alightingStopId], references: [id])
}

model PassengerPricing {
  id                    String   @id @default(uuid())
  passengerType         String   @unique // ADULT, CHILD, INFANT, SENIOR, DISABLED
  discountPercent       Float    @default(0)
  minAge                Int?
  maxAge                Int?
  isActive              Boolean  @default(true)
  description           String?
  requiresDisabilityProof Boolean @default(false)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

model SeatSegmentAvailability {
  id                String   @id @default(uuid())
  tripId            String
  seatId            String
  fromStopId        String
  toStopId          String
  isAvailable       Boolean
  trip              Trip     @relation(fields: [tripId], references: [id])
  seat              Seat     @relation(fields: [seatId], references: [id])
}
```

## 🎨 Composants Clés

### SeatMap Component

Composant de sélection de sièges avec design 3D premium :

**Props** :
- `seats` : Liste des sièges avec leur disponibilité
- `selectedSeat` / `selectedSeatIds` : Siège(s) sélectionné(s)
- `onSeatSelect` : Callback lors de la sélection
- `premiumMode` : Mode d'affichage premium (optionnel)
- `selectionKey` : `'id'` ou `'seatNumber'` - Méthode de sélection
- `maxSelection` : Nombre maximum de sièges sélectionnables

**Caractéristiques** :
- Design 3D avec effet de profondeur et glassmorphisme
- Cockpit et volant intégrés pour le réalisme
- Légende intégrée (VIP, Standard, Sélectionné, Occupé)
- Animation pulse pour les sièges sélectionnés
- Icônes Lucide React pour le rendu professionnel

**Utilisation** :
```tsx
<SeatMap
  seats={availableSeats}
  selectedSeat={selectedSeat}
  onSeatSelect={setSelectedSeat}
  selectionKey={seatSelectionKey}
/>
```

## 🔒 Sécurité

- Authentification sécurisée avec NextAuth.js
- Hashage des mots de passe avec bcryptjs
- Validation des données avec Zod
- Protection CSRF intégrée
- Gestion des rôles et permissions

## 🪑 Gestion de la Visibilité des Sièges

### Numérotation Alphanumérique

Tous les sièges utilisent une numérotation alphanumérique standardisée :
- **Format**: Lettre de rangée + Numéro de siège (ex: A1, A2, B1, B2)
- **Génération automatique** via `buildSeatNumbers(rows, seatsPerRow)`
- **Exclusion du siège conducteur** lors de la configuration

### Interface de Gestion

Accès: `/admin/buses/[busId]/seats`

**Fonctionnalités** :
- ✅ Visualisation du plan complet des sièges
- ✅ Cacher/afficher les sièges individuellement
- ✅ Cacher/afficher une rangée entière
- ✅ Statistiques en temps réel (total, visibles, cachés)
- ✅ Feedback visuel instantané
- ✅ Sauvegarde automatique des changements

**Utilisation** :
1. Accéder à la page "Gestion des sièges" depuis la liste des bus
2. Cliquer sur un siège pour le cacher (gris) ou l'afficher (vert/doré)
3. Utiliser "Cacher/Afficher toute la rangée" pour gérer des rangées complètes
4. Les sièges cachés n'apparaîtront plus dans les formulaires de réservation

**Codes couleur** :
- 🟢 Vert : Siège standard visible
- 🟡 Doré : Siège VIP visible
- ⚪ Gris : Siège caché (non réservable)

**API Endpoint** :
```typescript
PUT /api/admin/buses/[busId]/seats/[seatId]
Body: { isHidden: boolean }
```

## 📄 Licence

Propriétaire - Aigle Royale
# eticketbbs
# -Aigleroyale.

## 2. Demarrage et installation

### QUICK_START.md

# 🚀 Guide de Démarrage Rapide

## Installation en 5 minutes

### 1. Prérequis
- Node.js 18+ installé
- PostgreSQL installé et en cours d'exécution

### 2. Configuration rapide

```bash
# Cloner/ouvrir le projet
cd "Aigle royale"

# Installer les dépendances
npm install

# Créer le fichier .env (copiez depuis env.example)
# Windows PowerShell (à la racine du projet) :
Copy-Item env.example .env
# Puis éditez .env et configurez DATABASE_URL avec vos credentials PostgreSQL

# Configurer la base de données
npm run db:generate
npm run db:push
npm run db:seed

# Lancer le serveur
npm 
```

### 3. Accéder à l'application

Ouvrez [http://localhost:3000](http://localhost:3000)

### 4. Comptes de test

Après avoir exécuté `npm run db:seed`, vous pouvez vous connecter avec :

**Administrateur:**
- Email: `admin@aigleroyale.com`
- Mot de passe: `admin123`

**Agent Démo:**
- Email: `agent@demo.com`
- Mot de passe: `demo123`

**Super Agent (Agence) Démo:**
- Email: `superagent@demo.com`
- Mot de passe: `demo123`

### 5. Tests rapides

#### Test 1 : Créer un compte client
1. Aller sur `/auth/register`
2. Créer un compte
3. Se connecter
4. ✅ Vérifier : Redirection vers `/dashboard`

#### Test 2 : Rechercher et réserver un trajet
1. Sur la page d'accueil, rechercher un trajet :
   - Départ: `Abidjan`
   - Arrivée: `Yamoussoukro`
   - Date: Demain
   - **Passagers: 2 Adultes, 1 Enfant** (teste le paiement groupé)
2. Cliquer sur "Réserver" pour un trajet
3. **Sélectionner 3 sièges** (un pour chaque passager)
4. Remplir les informations pour chaque passager
5. Choisir "Paiement en agence"
6. ✅ Vérifier : **Page de paiement groupé** affiche le récapitulatif des 3 billets
7. ✅ Vérifier : **Un seul montant total** pour tous les billets
8. ✅ Vérifier : Billets générés avec QR codes individuels

#### Test 3 : Tester le back-office admin
1. Se connecter en tant qu'admin
2. Aller sur `/admin`
3. ✅ Vérifier : Affichage des statistiques

### 6. Scripts de test automatisés

```bash
# Test de configuration complète
npm run test:setup

# Test des API endpoints (serveur doit être lancé)
npm run test:api
```

### 7. Inspecter la base de données

```bash
# Ouvrir Prisma Studio
npm run db:studio
```

Cela ouvrira une interface graphique pour voir et modifier les données.

---

## 🐛 Dépannage

### Erreur : "Cannot connect to database"
- Vérifiez que PostgreSQL est en cours d'exécution
- Vérifiez que `DATABASE_URL` dans `.env` est correct

### Erreur : "Module not found"
- Exécutez `npm install` à nouveau
- Vérifiez que `node_modules` existe

### Erreur : "Port 3000 already in use"
- Arrêtez l'autre processus utilisant le port 3000
- Ou changez le port dans `package.json` : `"dev": "next dev -p 3001"`

### Les trajets ne s'affichent pas
- Vérifiez que `npm run db:seed` a été exécuté
- Les trajets sont créés pour "demain", ajustez la date de recherche

---

## 📚 Documentation complète

- **Installation détaillée** : Voir `SETUP.md`
- **Guide de test complet** : Voir `TESTING.md`
- **Documentation API** : Voir `API.md`

---

## ✅ Checklist de vérification

- [ ] PostgreSQL est installé et en cours d'exécution
- [ ] Le fichier `.env` est configuré
- [ ] `npm install` s'est exécuté sans erreur
- [ ] `npm run db:push` a créé les tables
- [ ] `npm run db:seed` a peuplé la base de données
- [ ] `npm run dev` démarre sans erreur
- [ ] Le site est accessible sur http://localhost:3000
- [ ] Je peux me connecter avec les comptes de test

---

## 🎯 Prochaines étapes

1. **Personnaliser** : Modifiez les couleurs dans `tailwind.config.ts`
2. **Ajouter des données** : Utilisez Prisma Studio ou créez vos propres routes/bus
3. **Configurer les paiements** : Ajoutez les clés API dans `.env`
4. **Déployer** : Préparez le projet pour la production

Bon développement ! 🚀

### SETUP.md

# Guide d'Installation et de Configuration

## Prérequis

- Node.js 18+ 
- PostgreSQL 14+
- npm ou yarn

## Installation

1. **Installer les dépendances**
```bash
npm install
```

2. **Configurer la base de données**

Créez un fichier `.env` à la racine du projet avec le contenu suivant :

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/aigle_royale?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre-secret-key-tres-longue-et-aleatoire-changez-en-production"

# Payment Providers (optionnel pour le moment)
MOBILE_MONEY_API_KEY=""
CARD_PAYMENT_API_KEY=""
```

3. **Créer la base de données**

Assurez-vous que PostgreSQL est en cours d'exécution, puis :

```bash
# Générer le client Prisma
npm run db:generate

# Créer les tables dans la base de données
npm run db:push

# (Optionnel) Peupler la base de données avec des données de test
npm run db:seed
```

4. **Lancer le serveur de développement**

```bash
npm run dev
```

Le site sera accessible sur [http://localhost:3000](http://localhost:3000)

## Comptes de test (après seed)

- **Administrateur**: 
  - Email: `admin@aigleroyale.com`
  - Mot de passe: `admin123`

- **Agent**: 
  - Email: `agent@aigleroyale.com`
  - Mot de passe: `agent123`

## Structure du Projet

```
├── app/                    # Pages Next.js (App Router)
│   ├── (auth)/            # Authentification
│   ├── (client)/          # Interface client
│   ├── (agent)/           # Interface agent agréé
│   ├── (agency)/          # Interface agence mère
│   ├── (admin)/           # Back-office administrateur
│   └── api/               # API Routes
├── components/            # Composants React réutilisables
│   ├── client/           # Composants pour clients
│   ├── freight/          # Composants pour fret
│   └── advertisements/   # Composants publicitaires
├── lib/                   # Utilitaires et configurations
│   ├── auth.ts           # Configuration NextAuth
│   ├── prisma.ts         # Client Prisma
│   └── utils.ts          # Fonctions utilitaires
├── prisma/                # Schéma Prisma et migrations
│   ├── schema.prisma     # Modèles de données
│   └── seed.ts           # Script de seed
└── types/                 # Définitions TypeScript
```

## Fonctionnalités Implémentées

### ✅ Module Client
- Recherche de trajets
- Réservation avec choix de siège interactif
- Paiement (Mobile Money, Carte, Espèces)
- Génération de billets électroniques avec QR code
- Historique des réservations
- Dashboard client

### ✅ Module Agents Agréés
- Vente de billets pour clients
- Vente de fret (colis)
- Suivi des commissions
- Historique des ventes
- Dashboard agent

### ✅ Module Agence Mère
- Vente directe au guichet
- Réservation pour paiement ultérieur
- Gestion des clients sans compte
- Suivi caisse journalière
- Dashboard agence

### ✅ Module Gestion du Fret
- Enregistrement de colis
- Association colis ↔ voyage
- Code de suivi unique
- Statuts : reçu / en transit / livré
- Tarification automatique

### ✅ Module Publicité
- Gestion des espaces publicitaires
- Bannières homepage, résultats, confirmation
- Statistiques d'impressions & clics
- Gestion des annonceurs

### ✅ Back-Office
- Tableau de bord avec KPI
- Gestion des bus & flotte
- Gestion des trajets & horaires
- Gestion des utilisateurs & rôles
- Rapports exportables

## Prochaines Étapes

### Intégrations à prévoir :
1. **Paiement Mobile Money** : Intégrer les APIs Orange Money, MTN Mobile Money
2. **Paiement Carte** : Intégrer Stripe ou un processeur de paiement local
3. **Envoi d'emails/SMS** : Pour les confirmations et notifications
4. **Génération PDF** : Pour les billets imprimables
5. **Export Excel/PDF** : Pour les rapports

### Améliorations possibles :
1. Application mobile native
2. Intelligence artificielle pour pricing dynamique
3. Intégration ERP externe
4. Système de notifications push
5. Chat en direct pour support client

## Support

Pour toute question ou problème, consultez la documentation ou contactez l'équipe de développement.

## 3. Architecture fonctionnelle des modules

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

## 4. API et flux metier

# Documentation des API Routes

## Authentification

### POST `/api/auth/register`
Créer un nouveau compte utilisateur

**Body:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string (optionnel)",
  "password": "string"
}
```

### POST `/api/auth/[...nextauth]`
Authentification NextAuth (login/logout)

## Réservations

### POST `/api/bookings`
Créer une ou plusieurs réservations (avec regroupement automatique)

**Body pour un seul passager:**
```json
{
  "tripId": "string",
  "seatId": "string",
  "passengerName": "string",
  "passengerPhone": "string (optionnel)",
  "passengerEmail": "string (optionnel)",
  "passengerType": "ADULT" | "CHILD" | "INFANT" | "SENIOR" | "DISABLED",
  "passengerAge": "number (obligatoire)",
  "hasDisability": "boolean (optionnel, défaut: false)",
  "boardingStopId": "string (optionnel, pour arrêts intermédiaires)",
  "alightingStopId": "string (optionnel, pour arrêts intermédiaires)"
}
```

**Body pour plusieurs passagers:**
```json
{
  "tripId": "string",
  "passengers": [
    {
      "seatId": "string",
      "passengerName": "string",
      "passengerPhone": "string (optionnel)",
      "passengerEmail": "string (optionnel)",
      "passengerType": "ADULT" | "CHILD" | "INFANT" | "SENIOR" | "DISABLED",
      "passengerAge": "number",
      "hasDisability": "boolean (optionnel)",
      "boardingStopId": "string (optionnel)",
      "alightingStopId": "string (optionnel)"
    }
  ]
}
```

**Calcul automatique des prix:**
- Le système récupère la règle de tarification selon `passengerType`
- `basePrice` = prix du trajet
- `discountAmount` = `basePrice * (discountPercent / 100)`
- `totalPrice` = `basePrice - discountAmount + extrasTotal`

**Response:**
```json
{
  "bookingGroupId": "string (nouveau - ID du groupe de réservations)",
  "bookingId": "string (ID de la première réservation)",
  "ticketNumber": "string (Numéro du premier billet)",
  "bookingIds": ["string", "string", ...],
  "ticketNumbers": ["string", "string", ...]
}
```

**Note importante:** Lors de réservations multiples, toutes les réservations sont regroupées dans un `BookingGroup` unique. Cela permet un **paiement unique** pour tous les billets, réduisant ainsi les frais de commission.

### POST `/api/bookings/[id]/payment`
Effectuer le paiement d'une réservation individuelle (ancien système)

**Body:**
```json
{
  "method": "MOBILE_MONEY" | "CARD" | "CASH"
}
```

## Groupes de Réservations (Nouveau)

### POST `/api/booking-groups/[id]/payment`
Effectuer le paiement groupé pour plusieurs billets

**Body:**
```json
{
  "method": "MOBILE_MONEY" | "CARD" | "CASH"
}
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": "string",
    "amount": "number (montant total)",
    "method": "string",
    "status": "PAID" | "PENDING",
    "paidAt": "datetime | null"
  }
}
```

**Avantages du paiement groupé:**
- ✅ Un seul paiement pour tous les billets
- ✅ Une seule commission prélevée
- ✅ Récapitulatif complet de tous les passagers
- ✅ Gestion simplifiée pour les familles/groupes

## Trajets

### GET `/api/trips/search`
Rechercher des trajets

**Query Parameters:**
- `origin`: Ville de départ
- `destination`: Ville d'arrivée
- `date`: Date au format YYYY-MM-DD

**Response:**
```json
[
  {
    "id": "string",
    "departureTime": "datetime",
    "arrivalTime": "datetime",
    "price": "number",
    "availableSeats": "number",
    "bus": { ... },
    "route": { ... }
  }
]
```

## Fret

### POST `/api/freight`
Créer une commande de fret

**Body:**
```json
{
  "tripId": "string",
  "senderName": "string",
  "senderPhone": "string",
  "receiverName": "string",
  "receiverPhone": "string",
  "weight": "number",
  "type": "string (optionnel)",
  "value": "number (optionnel)",
  "notes": "string (optionnel)",
  "agentId": "string (optionnel)"
}
```

**Response:**
```json
{
  "freightOrderId": "string",
  "trackingCode": "string",
  "price": "number"
}
```

### GET `/api/freight`
Lister les commandes de fret

**Query Parameters:**
- `trackingCode`: Code de suivi (optionnel)

## Tarification des Passagers

### GET `/api/admin/passenger-pricing`
Lister toutes les règles de tarification (Admin uniquement)

**Response:**
```json
[
  {
    "id": "string",
    "passengerType": "ADULT" | "CHILD" | "INFANT" | "SENIOR" | "DISABLED",
    "discountPercent": "number",
    "minAge": "number | null",
    "maxAge": "number | null",
    "isActive": "boolean",
    "description": "string",
    "requiresDisabilityProof": "boolean"
  }
]
```

### PUT `/api/admin/passenger-pricing/[id]`
Mettre à jour une règle de tarification (Admin uniquement)

**Body:**
```json
{
  "discountPercent": "number (0-100)",
  "minAge": "number | null",
  "maxAge": "number | null",
  "description": "string",
  "isActive": "boolean"
}
```

**Exemples de règles:**
- **ADULT**: 0% de réduction, 12-59 ans
- **CHILD**: 50% de réduction, 2-11 ans
- **INFANT**: 80% de réduction, 0-1 an
- **SENIOR**: 30% de réduction, 60+ ans
- **DISABLED**: 40% de réduction, tous âges (justificatif requis)

## Publicités

### GET `/api/advertisements`
Lister les publicités

**Query Parameters:**
- `type`: Type de bannière (BANNER_HOMEPAGE, BANNER_RESULTS, BANNER_CONFIRMATION)
- `status`: Statut (ACTIVE, INACTIVE, EXPIRED)

### POST `/api/advertisements`
Créer une publicité (Admin uniquement)

**Body:**
```json
{
  "advertiserId": "string",
  "title": "string",
  "description": "string (optionnel)",
  "imageUrl": "string",
  "linkUrl": "string (optionnel)",
  "type": "BANNER_HOMEPAGE" | "BANNER_RESULTS" | "BANNER_CONFIRMATION",
  "startDate": "datetime",
  "endDate": "datetime"
}
```

### GET `/api/advertisements/[id]`
Obtenir une publicité spécifique (incrémente les impressions)

### PUT `/api/advertisements/[id]`
Mettre à jour une publicité (Admin uniquement)

### DELETE `/api/advertisements/[id]`
Supprimer une publicité (Admin uniquement)

### POST `/api/advertisements/[id]/click`
Enregistrer un clic sur une publicité

## Paramètres Système

### GET `/api/settings`
Récupérer un paramètre système (public)

**Query Parameters:**
- `key`: Clé du paramètre (ex: `seatSelectionKey`)

**Response:**
```json
{
  "id": "string",
  "key": "string",
  "value": "string",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### GET `/api/admin/settings`
Récupérer les paramètres système (Admin uniquement)

**Query Parameters:**
- `key`: Clé du paramètre (optionnel)

### POST `/api/admin/settings`
Créer ou mettre à jour un paramètre système (Admin uniquement)

**Body:**
```json
{
  "key": "string",
  "value": "string"
}
```

## Arrêts de Ville

### GET `/api/admin/city-stops`
Lister les arrêts de ville actifs (Admin uniquement)

**Response:**
```json
[
  {
    "id": "string",
    "name": "string",
    "address": "string",
    "city": {
      "name": "string"
    },
    "cityId": "string",
    "isActive": true
  }
]
```

### POST `/api/admin/city-stops`
Créer un nouvel arrêt de ville (Admin uniquement)

**Body:**
```json
{
  "cityId": "string",
  "name": "string",
  "address": "string (optionnel)"
}
```

### PUT `/api/admin/city-stops/[id]`
Modifier un arrêt de ville (Admin uniquement)

**Body:**
```json
{
  "name": "string",
  "address": "string (optionnel)"
}
```

### DELETE `/api/admin/city-stops/[id]`
Désactiver un arrêt de ville (Admin uniquement)

## Arrêts de Route

### GET `/api/admin/routes/[id]`
Récupérer les détails d'une route (Admin uniquement)

**Response:**
```json
{
  "id": "string",
  "originCity": { "name": "string" },
  "destinationCity": { "name": "string" },
  "distance": "number",
  "duration": "number"
}
```

### GET `/api/admin/routes/[id]/stops`
Lister les arrêts d'une route (Admin uniquement)

**Response:**
```json
[
  {
    "id": "string",
    "order": "number",
    "role": "BOARDING | ALIGHTING | STOP",
    "notes": "string",
    "stop": {
      "id": "string",
      "name": "string",
      "address": "string",
      "city": {
        "name": "string"
      }
    }
  }
]
```

### POST `/api/admin/routes/[id]/stops`
Ajouter un arrêt à une route (Admin uniquement)

**Body:**
```json
{
  "stopId": "string",
  "order": "number",
  "role": "BOARDING | ALIGHTING | STOP",
  "notes": "string (optionnel)"
}
```

### DELETE `/api/admin/routes/[id]/stops/[routeStopId]`
Supprimer un arrêt d'une route (Admin uniquement)

### PATCH `/api/admin/routes/[id]/stops/[routeStopId]/reorder`
Réorganiser l'ordre des arrêts (Admin uniquement)

**Body:**
```json
{
  "direction": "up | down"
}
```

## Gestion de la Visibilité des Sièges

### PUT `/api/admin/buses/[busId]/seats/[seatId]`
Mettre à jour la visibilité d'un siège (Admin uniquement)

**Authentification:** Requise (Admin uniquement)

**Body:**
```json
{
  "isHidden": "boolean"
}
```

**Response:**
```json
{
  "success": true,
  "seat": {
    "id": "string",
    "busId": "string",
    "seatNumber": "string", // Format alphanumérique: A1, B1, etc.
    "seatType": "string",
    "isAvailable": "boolean",
    "isHidden": "boolean",
    "createdAt": "datetime",
    "updatedAt": "datetime"
  }
}
```

**Erreurs possibles:**
- `401`: Non authentifié
- `403`: Accès non autorisé (admin requis)
- `404`: Siège introuvable
- `400`: Le siège n'appartient pas à ce bus ou données invalides

**Notes:**
- Les sièges cachés (`isHidden: true`) ne sont pas affichés dans les formulaires de réservation
- Le filtrage automatique est appliqué dans toutes les requêtes de réservation
- Utile pour gérer des sièges en maintenance ou réservés pour des usages spécifiques

### PATCH `/api/admin/buses/[busId]/seats/[seatId]`
Basculer la disponibilité d'un siège (Admin uniquement)

**Body:**
```json
{
  "isAvailable": "boolean"
}
```

## Notes

- Toutes les routes nécessitent une authentification sauf `/api/auth/*` et certaines routes publiques
- Les rôles sont vérifiés pour les routes administratives
- Les erreurs retournent un format JSON avec un champ `error`
- **Numérotation des sièges**: Format alphanumérique standardisé (A1, A2, B1, B2, etc.)

## 5. Tarification et sieges

### PRICING_SYSTEM.md

# 💰 Système de Tarification Intelligente - Documentation Technique

## Vue d'ensemble

Le système de tarification intelligente d'Aigle Royale applique automatiquement des réductions tarifaires basées sur l'âge et le statut des passagers. Il garantit une tarification équitable et transparente tout en offrant des avantages aux personnes âgées et aux personnes en situation de handicap.

## 📊 Types de Passagers et Réductions

| Type | Emoji | Âge | Réduction | Justificatif | Code |
|------|-------|-----|-----------|--------------|------|
| Adulte | 👨‍💼 | 12-59 ans | 0% | Non | `ADULT` |
| Enfant | 👶 | 2-11 ans | 50% | Non | `CHILD` |
| Bébé | 🍼 | 0-1 an | 80% | Non | `INFANT` |
| Senior | 👴 | 60+ ans | 30% | Non | `SENIOR` |
| Handicapé | ♿ | Tous âges | 40% | **Oui** | `DISABLED` |

### Règles de Validation

1. **ADULT** : Âge entre 12 et 59 ans
2. **CHILD** : Âge entre 2 et 11 ans
3. **INFANT** : Âge entre 0 et 1 an
4. **SENIOR** : Âge ≥ 60 ans
5. **DISABLED** : Tous âges, justificatif médical requis

## 🗄️ Architecture de Base de Données

### Table `PassengerPricing`

```sql
CREATE TABLE passenger_pricing (
  id TEXT PRIMARY KEY,
  passengerType TEXT UNIQUE NOT NULL,  -- ADULT, CHILD, INFANT, SENIOR, DISABLED
  discountPercent REAL DEFAULT 0,      -- Pourcentage de réduction (0-100)
  minAge INTEGER,                       -- Âge minimum (nullable)
  maxAge INTEGER,                       -- Âge maximum (nullable)
  isActive BOOLEAN DEFAULT 1,           -- Tarif actif ou non
  description TEXT,                     -- Description du tarif
  requiresDisabilityProof BOOLEAN DEFAULT 0,  -- Justificatif requis
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Champs ajoutés au modèle `Booking`

```sql
ALTER TABLE bookings ADD COLUMN passengerType TEXT DEFAULT 'ADULT';
ALTER TABLE bookings ADD COLUMN passengerAge INTEGER;
ALTER TABLE bookings ADD COLUMN hasDisability BOOLEAN DEFAULT 0;
ALTER TABLE bookings ADD COLUMN disabilityProofUrl TEXT;
ALTER TABLE bookings ADD COLUMN basePrice REAL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN discountAmount REAL DEFAULT 0;
-- totalPrice existe déjà et contient : basePrice - discountAmount + extrasTotal
```

## 🔧 Fonctions Utilitaires (`lib/passenger-pricing.ts`)

### 1. `getPassengerTypeByAge(age: number)`

Détermine automatiquement le type de passager selon l'âge.

```typescript
getPassengerTypeByAge(5)   // → 'CHILD'
getPassengerTypeByAge(65)  // → 'SENIOR'
getPassengerTypeByAge(0)   // → 'INFANT'
getPassengerTypeByAge(30)  // → 'ADULT'
```

### 2. `validateAgeForPassengerType(age, type, rule)`

Vérifie la cohérence entre l'âge et le type de passager sélectionné.

```typescript
validateAgeForPassengerType(5, 'ADULT', adultRule)
// → { isValid: false, error: "L'âge minimum pour le tarif ADULT est 12 ans" }

validateAgeForPassengerType(65, 'SENIOR', seniorRule)
// → { isValid: true }
```

### 3. `calculatePassengerPrice(basePrice, passengerPricing)`

Calcule le prix final avec réduction.

```typescript
calculatePassengerPrice(10000, childPricing)
// → { basePrice: 10000, discountAmount: 5000, finalPrice: 5000 }
```

### 4. `getSuggestedPassengerType(age, hasDisability)`

Suggère le meilleur tarif en fonction de l'âge et du statut.

```typescript
getSuggestedPassengerType(65, false)
// → { type: 'SENIOR', reason: 'Tarif senior (60+ ans)', discount: 30 }

getSuggestedPassengerType(30, true)
// → { type: 'DISABLED', reason: 'Tarif réduit pour personne en situation de handicap', discount: 40 }
```

### 5. `formatDiscountInfo(discountPercent, basePrice)`

Formate les informations de réduction pour l'affichage.

```typescript
formatDiscountInfo(50, 10000)
// → "Réduction de 50% (-5000 FC) = 5000 FC"
```

## 🎨 Interface Utilisateur

### Formulaire de Réservation (`components/client/BookingForm.tsx`)

**Champs ajoutés :**

1. **Type de passager** (select)
   - Options : Adulte, Enfant, Bébé, Senior, Handicapé
   - Avec emojis et description des réductions

2. **Âge du passager** (number input)
   - Obligatoire
   - Min: 0, Max: 120
   - Validation en temps réel

3. **Confirmation handicap** (checkbox conditionnelle)
   - Apparaît uniquement si type = DISABLED
   - Avertissement sur le justificatif requis
   - Explique la vérification à l'embarquement

**Exemple de rendu :**

```tsx
<select id="passengerType">
  <option value="ADULT">👨‍💼 Adulte (12-59 ans) - Prix plein</option>
  <option value="CHILD">👶 Enfant (2-11 ans) - 50% de réduction</option>
  <option value="INFANT">🍼 Bébé (0-1 an) - 80% de réduction</option>
  <option value="SENIOR">👴 Senior (60+ ans) - 30% de réduction</option>
  <option value="DISABLED">♿ Handicapé - 40% de réduction</option>
</select>

<input type="number" id="passengerAge" min="0" max="120" required />

{passengerType === 'DISABLED' && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
    <input type="checkbox" id="hasDisability" />
    <label>Je confirme que le passager est en situation de handicap</label>
    <p>📄 Un justificatif médical sera demandé lors de l'embarquement.</p>
  </div>
)}
```

## 🔐 Interface Admin (`app/admin/passenger-pricing/page.tsx`)

### Fonctionnalités

1. **Visualisation des tarifs**
   - Cartes pour chaque type de passager
   - Affichage du pourcentage de réduction
   - Tranche d'âge applicable
   - Description du tarif
   - Badge "Justificatif requis" pour DISABLED

2. **Modification des tarifs**
   - Formulaire d'édition inline
   - Champs : discountPercent, minAge, maxAge, description, isActive
   - Validation côté client et serveur
   - Boutons Annuler/Enregistrer

3. **Guide d'utilisation**
   - Section informative sur le fonctionnement
   - Exemples de réductions
   - Explication du calcul automatique

### API Endpoint

**PUT** `/api/admin/passenger-pricing/[id]`

```typescript
// Request
{
  discountPercent: number,  // 0-100
  minAge: number | null,
  maxAge: number | null,
  description: string,
  isActive: boolean
}

// Response
{
  id: string,
  passengerType: string,
  discountPercent: number,
  minAge: number | null,
  maxAge: number | null,
  isActive: boolean,
  description: string,
  requiresDisabilityProof: boolean,
  updatedAt: string
}
```

## 🚀 Flux de Réservation

### 1. Sélection du type et âge

```mermaid
User selects type → System validates age → Shows discount info
```

### 2. Calcul du prix (API)

```typescript
// Dans /api/bookings POST
const pricingRule = await prisma.passengerPricing.findUnique({
  where: { passengerType: passengerTypeValue }
});

const basePrice = trip.price;
const discountPercent = pricingRule?.discountPercent || 0;
const discountAmount = (basePrice * discountPercent) / 100;
const ticketPrice = basePrice - discountAmount;

await prisma.booking.create({
  data: {
    passengerType: passengerTypeValue,
    passengerAge: age,
    hasDisability: hasDisability,
    basePrice: basePrice,
    discountAmount: discountAmount,
    totalPrice: ticketPrice + baggageExtras,
    // ... autres champs
  }
});
```

### 3. Stockage et traçabilité

Chaque réservation conserve :
- `basePrice` : Prix original du trajet
- `discountAmount` : Montant de la réduction appliquée
- `totalPrice` : Prix final payé par le client
- `passengerType` : Type de passager sélectionné
- `passengerAge` : Âge du passager au moment de la réservation

## 📈 Cas d'Usage

### Exemple 1 : Enfant de 8 ans

```
Trajet : Abidjan → Yamoussoukro
Prix de base : 10,000 FC
Type sélectionné : CHILD
Âge saisi : 8

Calcul :
- basePrice = 10,000 FC
- discountPercent = 50%
- discountAmount = 5,000 FC
- totalPrice = 5,000 FC

✅ Validation : OK (8 ans est dans la tranche 2-11 ans)
```

### Exemple 2 : Senior de 65 ans

```
Trajet : Bouaké → San Pedro
Prix de base : 15,000 FC
Type sélectionné : SENIOR
Âge saisi : 65

Calcul :
- basePrice = 15,000 FC
- discountPercent = 30%
- discountAmount = 4,500 FC
- totalPrice = 10,500 FC

✅ Validation : OK (65 ans ≥ 60 ans)
```

### Exemple 3 : Personne handicapée de 35 ans

```
Trajet : Abidjan → Bouaké
Prix de base : 8,000 FC
Type sélectionné : DISABLED
Âge saisi : 35
hasDisability : true

Calcul :
- basePrice = 8,000 FC
- discountPercent = 40%
- discountAmount = 3,200 FC
- totalPrice = 4,800 FC

⚠️ Justificatif requis à l'embarquement
✅ Validation : OK (DISABLED accepte tous les âges)
```

## 🛡️ Sécurité et Validation

### Validations côté client
- Âge obligatoire (champ required)
- Âge entre 0 et 120 ans
- Type de passager obligatoire
- Checkbox de confirmation pour DISABLED

### Validations côté serveur
- Vérification de l'existence de la règle de tarification
- Validation de la cohérence âge/type
- Calcul sécurisé des réductions (pas de manipulation possible)
- Vérification des permissions admin pour modification des tarifs

### Authentification
- Seuls les ADMINISTRATOR peuvent modifier les tarifs
- Vérification via `isAdminRole()` dans les endpoints admin
- Protection CSRF intégrée dans NextAuth

## 📝 Migration et Initialisation

### Migration Prisma

```bash
npx prisma migrate dev --name add_senior_disabled_pricing
```

### Initialisation des données

```bash
npx tsx prisma/seed-senior-disabled.ts
```

Crée les 5 tarifs par défaut :
- ADULT : 0% (12-59 ans)
- CHILD : 50% (2-11 ans)
- INFANT : 80% (0-1 an)
- SENIOR : 30% (60+ ans)
- DISABLED : 40% (tous âges, justificatif requis)

## 🎯 Améliorations Futures

### Court terme
- [ ] Upload de justificatif de handicap dans le formulaire
- [ ] Vérification automatique de la validité du justificatif
- [ ] Notification email avec les détails de réduction

### Moyen terme
- [ ] Rapports statistiques sur l'utilisation des tarifs réduits
- [ ] Alertes admin si incohérence âge/type détectée
- [ ] Export des données de réduction pour comptabilité

### Long terme
- [ ] Tarifs dynamiques selon la saison
- [ ] Réductions cumulables (ex: Senior + Carte de fidélité)
- [ ] Programme de fidélité avec bonus selon le type de passager

## 🤝 Support

Pour toute question ou problème concernant le système de tarification :
- Documentation technique : `PRICING_SYSTEM.md` (ce fichier)
- API : `API.md` - Section "Tarification des Passagers"
- Code source : 
  - Backend : `app/api/bookings/route.ts`
  - Frontend : `components/client/BookingForm.tsx`
  - Admin : `app/admin/passenger-pricing/page.tsx`
  - Utilitaires : `lib/passenger-pricing.ts`

---

**Dernière mise à jour** : 28 janvier 2026  
**Version** : 1.0.0  
**Auteur** : Équipe Technique Aigle Royale

### SEAT_MANAGEMENT.md

# 🪑 Gestion de la Visibilité des Sièges

## Vue d'ensemble

Le système de gestion de la visibilité des sièges permet aux administrateurs de contrôler quels sièges sont affichés aux clients lors de la réservation. Cela permet de :

- 🔧 Mettre des sièges en maintenance
- 🎯 Réserver des sièges pour des usages spécifiques
- 📦 Bloquer des rangées pour du fret ou des bagages
- 🎫 Gérer des configurations de bus flexibles

## Numérotation Alphanumérique

### Format Standardisé

Tous les sièges utilisent une numérotation alphanumérique :

```
A1  A2  A3  A4
B1  B2  B3  B4
C1  C2  C3  C4
D1  D2  D3  D4
```

**Structure** :
- **Lettre** : Rangée (A, B, C, D, etc.)
- **Chiffre** : Position dans la rangée (1, 2, 3, 4, etc.)

### Génération Automatique

Les numéros de sièges sont générés automatiquement lors de la configuration du bus :

```typescript
function buildSeatNumbers(rows: number, seatsPerRow: number): string[] {
  const seatNumbers: string[] = []
  
  for (let r = 0; r < rows; r++) {
    const rowLetter = String.fromCharCode(65 + r) // A, B, C, D...
    for (let s = 1; s <= seatsPerRow; s++) {
      seatNumbers.push(`${rowLetter}${s}`)
    }
  }
  
  return seatNumbers
}
```

**Caractéristiques** :
- Exclusion automatique du siège conducteur
- Calcul basé sur la capacité du bus
- Unique par bus grâce à la contrainte `@@unique([busId, seatNumber])`

## Interface Administrateur

### Accès

**URL** : `/admin/buses/[busId]/seats`

**Navigation** :
1. Accéder à `/admin/buses` (Liste des bus)
2. Cliquer sur "Sièges" à côté du bus désiré
3. Gérer la visibilité des sièges

### Fonctionnalités

#### 1. Vue d'ensemble

**Statistiques en temps réel** :
- 📊 **Sièges totaux** : Nombre total de sièges configurés
- ✅ **Sièges visibles** : Sièges disponibles pour réservation
- 👁️ **Sièges cachés** : Sièges non affichés aux clients

#### 2. Plan des Sièges

**Organisation par rangée** :
- Chaque rangée (A, B, C, etc.) est affichée séparément
- Les sièges sont présentés dans une grille responsive
- Codes couleur pour identification rapide

**Codes Couleur** :
- 🟢 **Vert** : Siège standard visible
- 🟡 **Doré** : Siège VIP visible
- ⚪ **Gris** : Siège caché (non réservable)

#### 3. Actions Individuelles

**Cacher/Afficher un siège** :
1. Cliquer sur le siège désiré
2. Le siège change immédiatement de statut
3. Sauvegarde automatique via l'API
4. Feedback visuel avec indicateur de chargement

**Effet visuel** :
- Au survol : Icône œil (👁️) ou œil barré (🚫)
- Animation de survol avec effet de scale
- Indicateur de sauvegarde (spinner)

#### 4. Actions par Rangée

**Cacher/Afficher toute une rangée** :
1. Cliquer sur "Cacher/Afficher toute la rangée"
2. Tous les sièges de la rangée changent de statut
3. Requêtes parallèles pour performance optimale

## Architecture Technique

### Modèle de Données

```prisma
model Seat {
  id          String   @id @default(uuid())
  busId       String
  seatNumber  String   // Format: A1, B1, C1, etc.
  seatType    String   @default("Standard")
  isAvailable Boolean  @default(true)
  isHidden    Boolean  @default(false) // Visibilité du siège
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  bus      Bus        @relation(fields: [busId], references: [id], onDelete: Cascade)
  bookings Booking[]
  
  @@unique([busId, seatNumber])
}
```

**Champs clés** :
- `seatNumber` : Numéro alphanumérique unique par bus
- `isHidden` : Contrôle la visibilité (défaut: `false`)
- `isAvailable` : Disponibilité pour réservation (indépendant de `isHidden`)

### API Endpoints

#### PUT `/api/admin/buses/[busId]/seats/[seatId]`

**Mettre à jour la visibilité d'un siège**

**Requête** :
```json
{
  "isHidden": true
}
```

**Réponse** :
```json
{
  "success": true,
  "seat": {
    "id": "abc123",
    "busId": "bus456",
    "seatNumber": "A1",
    "seatType": "Standard",
    "isAvailable": true,
    "isHidden": true,
    "createdAt": "2026-01-28T10:00:00Z",
    "updatedAt": "2026-01-28T10:30:00Z"
  }
}
```

**Authentification** : Admin requis

**Validation** :
- Vérifie l'appartenance du siège au bus
- Valide le type booléen de `isHidden`
- Gère les erreurs 401, 403, 404, 400

### Filtrage Automatique

Les sièges cachés sont automatiquement exclus des requêtes de réservation :

```typescript
// Dans /app/trips/[id]/book/page.tsx
const trip = await prisma.trip.findUnique({
  where: { id },
  include: {
    bus: {
      include: {
        seats: {
          where: {
            isHidden: false, // Exclure les sièges cachés
          },
          include: {
            bookings: {
              where: {
                status: { in: ['CONFIRMED', 'PENDING'] },
              },
            },
          },
        },
      },
    },
    // ...
  },
})
```

**Impact** :
- Les clients ne voient jamais les sièges cachés
- Aucune modification nécessaire dans le composant `SeatMap`
- Filtrage appliqué au niveau de la base de données

## Composant React

### SeatVisibilityManager

**Props** :
```typescript
interface SeatVisibilityManagerProps {
  busId: string
  seats: Seat[]
}
```

**État local** :
```typescript
const [seatStates, setSeatStates] = useState<Record<string, boolean>>({})
const [saving, setSaving] = useState<Set<string>>(new Set())
```

**Fonctions principales** :

1. **toggleSeatVisibility** : Bascule la visibilité d'un siège
2. **toggleRowVisibility** : Bascule toute une rangée
3. **seatsByRow** : Organisation des sièges par rangée (useMemo)

**Optimisations** :
- `useMemo` pour le calcul des rangées
- Mise à jour optimiste de l'UI
- Gestion d'erreurs avec rollback
- Indicateurs de chargement par siège

## Cas d'Usage

### 1. Maintenance de Sièges

**Scénario** : Un siège est endommagé et doit être retiré temporairement

**Actions** :
1. Accéder à `/admin/buses/[busId]/seats`
2. Cliquer sur le siège défectueux (ex: C3)
3. Le siège devient gris et disparaît des réservations
4. Une fois réparé, cliquer à nouveau pour le réafficher

### 2. Réservation de Rangées pour Fret

**Scénario** : Une rangée entière doit être réservée pour transporter des bagages volumineux

**Actions** :
1. Accéder à la gestion des sièges
2. Sélectionner la rangée D (par exemple)
3. Cliquer sur "Cacher toute la rangée"
4. Tous les sièges D1, D2, D3, D4 deviennent indisponibles

### 3. Configuration Bus Spéciale

**Scénario** : Un bus VIP ne doit afficher que certains sièges premium

**Actions** :
1. Cacher toutes les rangées standards
2. Garder uniquement les sièges VIP visibles
3. Les clients ne verront que l'offre premium

## Bonnes Pratiques

### ✅ À Faire

- Toujours vérifier les statistiques après modification
- Informer les équipes avant de cacher des sièges en masse
- Documenter les raisons de cachage (maintenance, etc.)
- Réafficher les sièges dès que possible

### ❌ À Éviter

- Ne pas cacher tous les sièges d'un bus en service
- Éviter de modifier pendant les heures de pointe
- Ne pas cacher de sièges déjà réservés sans vérification
- Éviter les modifications trop fréquentes

## Performances

### Optimisations Implémentées

1. **Requêtes Parallèles** : Les mises à jour de rangée utilisent `Promise.all()`
2. **Mise à Jour Optimiste** : L'UI se met à jour immédiatement
3. **Filtrage Base de Données** : `WHERE isHidden = false` au niveau SQL
4. **Mémoisation** : `useMemo` pour le calcul des rangées
5. **Indicateurs Visuels** : Feedback instantané pour l'utilisateur

### Métriques

- **Temps de mise à jour** : < 200ms par siège
- **Temps de mise à jour rangée** : < 1s pour 4 sièges
- **Filtrage requêtes** : 0ms (niveau base de données)

## Sécurité

### Contrôles d'Accès

- ✅ Authentification requise (session NextAuth)
- ✅ Rôle Admin vérifié via `isAdminRole()`
- ✅ Validation propriété bus-siège
- ✅ Validation types de données (Zod possible)

### Protection des Données

- Les sièges cachés restent en base de données
- Aucune suppression définitive
- Traçabilité via `updatedAt`
- Restauration immédiate possible

## Feuille de Route

### Améliorations Futures

- [ ] **Historique des modifications** : Qui a caché/affiché quand
- [ ] **Raisons de cachage** : Champ `hiddenReason` (maintenance, réservé, etc.)
- [ ] **Planification** : Cacher/afficher automatiquement selon dates
- [ ] **Notifications** : Alertes lorsque trop de sièges cachés
- [ ] **Export/Import** : Configurations de visibilité réutilisables
- [ ] **API Bulk** : Mettre à jour plusieurs sièges en une requête

## Support

Pour toute question ou problème :

1. Vérifier ce document
2. Consulter `/admin/buses/[busId]/seats` pour les instructions intégrées
3. Contacter l'équipe technique

---

**Dernière mise à jour** : 28 janvier 2026  
**Version** : 1.0.0

## 6. Tests et qualite

# Guide de Test - Plateforme Aigle Royale

## 🧪 Tests de Base

### 1. Vérifier l'installation

```bash
# Vérifier que toutes les dépendances sont installées
npm install

# Vérifier que Prisma est configuré
npm run db:generate

# Vérifier la connexion à la base de données
npm run db:push
```

### 2. Peupler la base de données avec des données de test

```bash
npm run db:seed
```

Cela créera :
- Un administrateur : `admin@aigleroyale.com` / `admin123`
- Un agent : `agent@aigleroyale.com` / `agent123`
- Des routes (Abidjan → Yamoussoukro, Abidjan → Bouaké)
- Des bus avec leurs sièges
- Des trajets pour demain

### 3. Démarrer le serveur

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

---

## 📋 Checklist de Tests par Module

### ✅ Module Client

#### Test 1 : Inscription d'un nouveau client
1. Aller sur `/auth/register`
2. Remplir le formulaire :
   - Prénom : Test
   - Nom : Client
   - Email : `client@test.com`
   - Téléphone : `+225 07 12 34 56 78`
   - Mot de passe : `client123`
   - Confirmer : `client123`
3. Cliquer sur "S'inscrire"
4. ✅ Vérifier : Redirection vers `/auth/login`

#### Test 2 : Connexion client
1. Aller sur `/auth/login`
2. Entrer : `client@test.com` / `client123`
3. Cliquer sur "Se connecter"
4. ✅ Vérifier : Redirection vers `/dashboard`

#### Test 3 : Recherche de trajet
1. Sur la page d'accueil (`/`)
2. Remplir le formulaire de recherche :
   - Départ : `Abidjan`
   - Arrivée : `Yamoussoukro`
   - Date : Demain
3. Cliquer sur "Rechercher des trajets"
4. ✅ Vérifier : Affichage des trajets disponibles

#### Test 4 : Réservation d'un billet
1. Sur la page de résultats (`/trips/search`)
2. Cliquer sur "Réserver" pour un trajet
3. ✅ Vérifier : Redirection vers `/trips/[id]/book`
4. Sélectionner un siège sur le plan
5. Remplir les informations :
   - Nom complet : `Jean Dupont`
   - Téléphone : `+225 07 12 34 56 78`
   - Email : `jean@example.com`
6. Cliquer sur "Continuer vers le paiement"
7. ✅ Vérifier : Redirection vers `/bookings/[id]/payment`

#### Test 5 : Paiement
1. Sur la page de paiement
2. Choisir une méthode de paiement (ex: "Paiement en agence")
3. Cliquer sur "Payer"
4. ✅ Vérifier : Redirection vers `/bookings/[id]/confirmation`
5. ✅ Vérifier : Affichage du billet avec QR code
6. ✅ Vérifier : Possibilité d'imprimer le billet

#### Test 6 : Dashboard client
1. Aller sur `/dashboard`
2. ✅ Vérifier : Affichage des dernières réservations
3. ✅ Vérifier : Liens vers "Réserver un billet" et "Envoyer un colis"

---

### ✅ Module Fret (Colis)

#### Test 7 : Créer une commande de fret
1. Aller sur `/freight/new`
2. Rechercher un trajet :
   - Départ : `Abidjan`
   - Arrivée : `Yamoussoukro`
   - Date : Demain
3. Sélectionner un trajet
4. Remplir les informations :
   - Expéditeur : Nom, Téléphone
   - Destinataire : Nom, Téléphone
   - Poids : `5` kg
   - Type : `Documents`
   - Valeur : `10000` FC
5. Cliquer sur "Créer la commande"
6. ✅ Vérifier : Affichage du code de suivi

#### Test 8 : Suivi d'un colis
1. Aller sur `/api/freight?trackingCode=FR-XXXXX`
2. ✅ Vérifier : Affichage des détails du colis

---

### ✅ Module Agent Agréé

#### Test 9 : Connexion agent
1. Aller sur `/auth/login`
2. Entrer : `agent@aigleroyale.com` / `agent123`
3. Cliquer sur "Se connecter"
4. ✅ Vérifier : Redirection vers `/agent`

#### Test 10 : Dashboard agent
1. Sur `/agent`
2. ✅ Vérifier : Affichage des statistiques (ventes, commissions)
3. ✅ Vérifier : Liens vers "Vendre un billet" et "Enregistrer un colis"
4. ✅ Vérifier : Tableau des ventes récentes

#### Test 11 : Vente d'un billet par agent
1. Sur `/agent/bookings/new` (à créer si nécessaire)
2. Créer une réservation pour un client
3. ✅ Vérifier : La réservation est associée à l'agent
4. ✅ Vérifier : Commission calculée automatiquement

---

### ✅ Module Agence Mère

#### Test 12 : Créer un compte agence
1. Via l'admin, créer un utilisateur avec le rôle `AGENCY_STAFF`
2. Se connecter avec ce compte
3. ✅ Vérifier : Redirection vers `/agency`

#### Test 13 : Dashboard agence
1. Sur `/agency`
2. ✅ Vérifier : Statistiques du jour (ventes, CA)
3. ✅ Vérifier : Tableau des ventes récentes

---

### ✅ Module Administrateur

#### Test 14 : Connexion admin
1. Aller sur `/auth/login`
2. Entrer : `admin@aigleroyale.com` / `admin123`
3. Cliquer sur "Se connecter"
4. ✅ Vérifier : Redirection vers `/admin`

#### Test 15 : Dashboard admin
1. Sur `/admin`
2. ✅ Vérifier : Affichage des KPI (réservations totales, CA, utilisateurs, trajets)
3. ✅ Vérifier : Liens vers les différentes sections de gestion

#### Test 16 : Gestion des bus
1. Aller sur `/admin/buses` (à créer)
2. Créer un nouveau bus :
   - Plaque : `AR-003-AB`
   - Nom : `Bus Standard 2`
   - Capacité : `50`
3. ✅ Vérifier : Le bus apparaît dans la liste
4. ✅ Vérifier : Les sièges sont créés automatiquement

#### Test 17 : Gestion des trajets
1. Aller sur `/admin/routes` (à créer)
2. Créer une nouvelle route :
   - Origine : `Abidjan`
   - Destination : `San-Pedro`
   - Distance : `350` km
   - Durée : `240` minutes
3. Créer un trajet :
   - Sélectionner le bus et la route
   - Date/heure de départ
   - Prix : `6000` FC
4. ✅ Vérifier : Le trajet apparaît dans les résultats de recherche

#### Test 18 : Gestion des utilisateurs
1. Aller sur `/admin/users` (à créer)
2. Créer un nouvel agent :
   - Email : `agent2@test.com`
   - Mot de passe : `agent123`
   - Rôle : `AGENT`
3. ✅ Vérifier : L'utilisateur peut se connecter

---

### ✅ Module Publicité

#### Test 19 : Créer une publicité
1. En tant qu'admin, aller sur `/admin/advertisements` (à créer)
2. Créer une nouvelle publicité :
   - Titre : `Promotion spéciale`
   - Image URL : URL d'une image
   - Type : `BANNER_HOMEPAGE`
   - Dates de début et fin
3. ✅ Vérifier : La publicité apparaît sur la page d'accueil

#### Test 20 : Statistiques publicitaires
1. Sur `/admin/advertisements/[id]`
2. ✅ Vérifier : Affichage des impressions et clics
3. Cliquer sur la publicité depuis la page d'accueil
4. ✅ Vérifier : Le compteur de clics s'incrémente

---

## 🔍 Tests API (avec Postman ou curl)

### Test 21 : API Recherche de trajets
```bash
curl "http://localhost:3000/api/trips/search?origin=Abidjan&destination=Yamoussoukro&date=2024-01-15"
```
✅ Vérifier : Retourne un tableau de trajets

### Test 22 : API Création de réservation
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{
    "tripId": "trip-id",
    "seatId": "seat-id",
    "passengerName": "Test User",
    "passengerPhone": "+225 07 12 34 56 78"
  }'
```
✅ Vérifier : Retourne bookingId et ticketNumber

### Test 23 : API Création de fret
```bash
curl -X POST http://localhost:3000/api/freight \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{
    "tripId": "trip-id",
    "senderName": "Expéditeur",
    "senderPhone": "+225 07 12 34 56 78",
    "receiverName": "Destinataire",
    "receiverPhone": "+225 07 12 34 56 78",
    "weight": 5
  }'
```
✅ Vérifier : Retourne freightOrderId et trackingCode

---

## 🐛 Tests de Sécurité

### Test 24 : Protection des routes
1. Essayer d'accéder à `/admin` sans être connecté
   - ✅ Vérifier : Redirection vers `/auth/login`

2. Se connecter en tant que client et essayer d'accéder à `/admin`
   - ✅ Vérifier : Redirection vers `/dashboard`

3. Se connecter en tant qu'agent et essayer d'accéder à `/agency`
   - ✅ Vérifier : Redirection vers `/dashboard`

### Test 25 : Validation des données
1. Essayer de créer une réservation sans sélectionner de siège
   - ✅ Vérifier : Message d'erreur affiché

2. Essayer de créer un compte avec un email déjà utilisé
   - ✅ Vérifier : Message d'erreur "Cet email est déjà utilisé"

3. Essayer de réserver un siège déjà occupé
   - ✅ Vérifier : Message d'erreur "Siège non disponible"

---

## 📊 Tests de Performance

### Test 26 : Charge de la page d'accueil
1. Ouvrir les DevTools (F12)
2. Aller sur `/`
3. ✅ Vérifier : Temps de chargement < 2 secondes

### Test 27 : Recherche de trajets
1. Effectuer une recherche
2. ✅ Vérifier : Résultats affichés rapidement (< 1 seconde)

---

## ✅ Checklist Finale

- [ ] Toutes les pages se chargent sans erreur
- [ ] L'authentification fonctionne pour tous les rôles
- [ ] Les réservations peuvent être créées et payées
- [ ] Les billets avec QR code sont générés
- [ ] Le module fret fonctionne
- [ ] Les agents peuvent vendre des billets
- [ ] L'admin peut gérer les bus, trajets, utilisateurs
- [ ] Les publicités s'affichent correctement
- [ ] Les statistiques sont calculées correctement
- [ ] Les routes sont protégées selon les rôles

---

## 🛠️ Outils de Test Recommandés

1. **Postman** : Pour tester les API
2. **Chrome DevTools** : Pour déboguer le frontend
3. **Prisma Studio** : Pour inspecter la base de données
   ```bash
   npm run db:studio
   ```
4. **React DevTools** : Extension Chrome pour déboguer React

---

## 📝 Notes

- Assurez-vous que PostgreSQL est en cours d'exécution avant de tester
- Les données de seed créent des trajets pour "demain", ajustez la date si nécessaire
- Pour tester les paiements réels, configurez les clés API dans `.env`
- Les QR codes sont générés automatiquement lors de la création d'une réservation

## 7. Deploiement et operations

# 🚀 Guide de Déploiement VPS - Aigle Royale

**Date**: 4 Février 2026  
**Application**: Plateforme de réservation de bus Next.js 16

---

## 📋 Prérequis

### Serveur VPS Recommandé
- **OS**: Ubuntu 22.04 LTS ou Debian 12
- **RAM**: Minimum 2 GB (4 GB recommandé)
- **CPU**: 2 vCores minimum
- **Stockage**: 20 GB SSD minimum
- **Accès**: SSH avec clé publique
- **Domaine**: Configuré et pointant vers le VPS

### Accès Requis
```bash
# Connexion SSH
ssh root@votre-vps-ip

# Ou avec utilisateur non-root
ssh utilisateur@votre-vps-ip

# Domaine configuré
Domaine: travelia.afrika-connect.io
```

---

## 🔧 Étape 1: Préparation du Serveur

### 1.1 Mise à jour du système
```bash
# Mise à jour des paquets
sudo apt update && sudo apt upgrade -y

# Installation des outils essentiels
sudo apt install -y curl wget git build-essential ufw fail2ban
```

### 1.2 Configuration du pare-feu
```bash
# Autoriser SSH (IMPORTANT: avant d'activer ufw!)
sudo ufw allow OpenSSH
sudo ufw allow 22/tcp

# Autoriser HTTP et HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Activer le pare-feu
sudo ufw enable

# Vérifier le statut
sudo ufw status
```

### 1.3 Créer un utilisateur dédié (recommandé)
```bash
# Créer l'utilisateur 'aigle' (ou autre nom)
sudo adduser aigle

# Donner les droits sudo
sudo usermod -aG sudo aigle

# Configurer SSH pour cet utilisateur
sudo mkdir -p /home/aigle/.ssh
sudo cp ~/.ssh/authorized_keys /home/aigle/.ssh/
sudo chown -R aigle:aigle /home/aigle/.ssh
sudo chmod 700 /home/aigle/.ssh
sudo chmod 600 /home/aigle/.ssh/authorized_keys

# Se connecter avec le nouvel utilisateur
su - aigle
```

---

## 📦 Étape 2: Installation de Node.js

### 2.1 Installation via NodeSource
```bash
# Installer Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Vérifier l'installation
node --version  # Devrait afficher v20.x.x
npm --version   # Devrait afficher 10.x.x

# Installer pnpm (optionnel, plus rapide que npm)
sudo npm install -g pnpm pm2
```

---

## 🗄️ Étape 3: Installation de PostgreSQL

### 3.1 Installation
```bash
# Installer PostgreSQL 15
sudo apt install -y postgresql postgresql-contrib

# Démarrer et activer PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Vérifier le statut
sudo systemctl status postgresql
```

### 3.2 Configuration de la base de données
```bash
# Se connecter à PostgreSQL
sudo -u postgres psql

# Dans le shell PostgreSQL, exécuter:
```

```sql
-- Créer la base de données
CREATE DATABASE aigle_royale;

-- Créer un utilisateur dédié
CREATE USER aigle_user WITH PASSWORD 'VotreMotDePasseTresFort!2026';

-- Donner tous les droits sur la base
GRANT ALL PRIVILEGES ON DATABASE aigle_royale TO aigle_user;

-- PostgreSQL 15+: donner les permissions sur le schéma
\c aigle_royale
GRANT ALL ON SCHEMA public TO aigle_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO aigle_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO aigle_user;

-- Sortir
\q
```

### 3.3 Configuration de l'accès distant (si nécessaire)
```bash
# Éditer pg_hba.conf
sudo nano /etc/postgresql/15/main/pg_hba.conf

# Ajouter cette ligne pour l'accès local (déjà présente normalement):
# local   all             all                                     md5

# Redémarrer PostgreSQL
sudo systemctl restart postgresql
```

---

## 🌐 Étape 4: Installation de Nginx

### 4.1 Installation
```bash
# Installer Nginx
sudo apt install -y nginx

# Démarrer et activer Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Vérifier le statut
sudo systemctl status nginx
```

### 4.2 Configuration Nginx pour Next.js
```bash
# Créer la configuration du site
sudo nano /etc/nginx/sites-available/aigle-royale
```

Copier cette configuration:

```nginx
# Configuration Nginx pour Aigle Royale Next.js
upstream nextjs_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    
    server_name travelia.afrika-connect.io;
    
    # Logs
    access_log /var/log/nginx/aigle-royale-access.log;
    error_log /var/log/nginx/aigle-royale-error.log;
    
    # Taille maximale des uploads
    client_max_body_size 10M;
    
    location / {
        proxy_pass http://nextjs_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Fichiers statiques Next.js
    location /_next/static {
        proxy_pass http://nextjs_backend;
        proxy_cache_bypass $http_upgrade;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
    
    # Assets publics
    location /public {
        proxy_pass http://nextjs_backend;
        add_header Cache-Control "public, max-age=3600";
    }
}
```

### 4.3 Activer la configuration
```bash
# Créer le lien symbolique
sudo ln -s /etc/nginx/sites-available/aigle-royale /etc/nginx/sites-enabled/

# Désactiver le site par défaut (optionnel)
sudo rm /etc/nginx/sites-enabled/default

# Tester la configuration
sudo nginx -t

# Recharger Nginx
sudo systemctl reload nginx
```

---

## 🔐 Étape 5: SSL avec Let's Encrypt

### 5.1 Installation de Certbot
```bash
# Installer Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtenir le certificat SSL
sudo certbot --nginx -d travelia.afrika-connect.io

# Suivre les instructions interactives:
# - Entrer votre email
# - Accepter les conditions
# - Choisir de rediriger HTTP vers HTTPS (recommandé)
```

### 5.2 Renouvellement automatique
```bash
# Tester le renouvellement
sudo certbot renew --dry-run

# Certbot installe automatiquement un cron job pour le renouvellement
# Vérifier:
sudo systemctl status certbot.timer
```

---

## 📁 Étape 6: Déploiement de l'Application

### 6.1 Cloner le repository
```bash
# Se placer dans le dossier home
cd ~

# Cloner le projet (remplacer par votre URL Git)
git clone https://github.com/votre-username/aigle-royale.git
cd aigle-royale

# Ou uploader via SCP depuis votre machine locale:
# scp -r "C:\Mes Sites Web\Aigle royale" aigle@votre-vps-ip:~/aigle-royale
```

### 6.2 Créer le fichier .env
```bash
# Créer le fichier .env
nano .env
```

Copier cette configuration (adapter les valeurs):

```env
# Base de données PostgreSQL
DATABASE_URL="postgresql://aigle_user:VotreMotDePasseTresFort!2026@localhost:5432/aigle_royale?schema=public"

# NextAuth Configuration
NEXTAUTH_URL="https://votre-domaine.com"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# IMPORTANT: Générer un secret fort pour NEXTAUTH_SECRET
# Exécuter: openssl rand -base64 32
# Et remplacer la valeur ci-dessus

# CRON Secret (protection des endpoints planifiés)
CRON_SECRET="$(openssl rand -base64 32)"

# Devise (conversion FC -> USD)
NEXT_PUBLIC_USD_FC_RATE=600
NEXT_PUBLIC_WIFI_PASS_PRICE_FC=1000
NEXT_PUBLIC_EXTRA_BAGGAGE_PIECE_PRICE_FC=1000
NEXT_PUBLIC_EXTRA_BAGGAGE_OVERWEIGHT_PRICE_FC_PER_KG=200

# Configuration Production
NODE_ENV=production

# Désactiver les comptes démo en production
DEMO_SEED=false
ADMIN_PASSWORD=""

# APIs de paiement (à configurer)
MOBILE_MONEY_API_KEY="votre_cle_api_mobile_money"
CARD_PAYMENT_API_KEY="votre_cle_api_carte"

# Email (SendGrid, Mailgun, etc.)
EMAIL_PROVIDER_API_KEY="votre_cle_api_email"
EMAIL_FROM="noreply@votre-domaine.com"

# SMS (Twilio, etc.)
SMS_PROVIDER_API_KEY="votre_cle_api_sms"
SMS_FROM="+225XXXXXXXXXX"
```

### 6.3 Générer les secrets
```bash
# Générer NEXTAUTH_SECRET
echo "NEXTAUTH_SECRET=\"$(openssl rand -base64 32)\""

# Générer CRON_SECRET
echo "CRON_SECRET=\"$(openssl rand -base64 32)\""

# Copier ces valeurs dans votre .env
```

### 6.4 Installation des dépendances
```bash
# Installer les dépendances
npm install --production=false

# Ou avec pnpm (plus rapide)
pnpm install
```

### 6.5 Configuration Prisma et migration
```bash
# Générer le client Prisma
npm run db:generate

# Appliquer les migrations
npm run db:push

# OU utiliser les migrations (recommandé pour production)
npx prisma migrate deploy

# Créer un administrateur (optionnel)
npx tsx scripts/create-admin.ts
```

### 6.6 Build de l'application
```bash
# Build Next.js pour production
npm run build

# Le build crée le dossier .next/
```

---

## 🔄 Étape 7: Configuration PM2 (Process Manager)

### 7.1 Créer le fichier ecosystem
```bash
# Créer ecosystem.config.js
nano ecosystem.config.js
```

Copier cette configuration:

```javascript
module.exports = {
  apps: [{
    name: 'aigle-royale',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/home/aigle/aigle-royale',
    instances: 2, // Utiliser 2 instances (cluster mode)
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    exp_backoff_restart_delay: 100,
  }]
}
```

### 7.2 Démarrer l'application avec PM2
```bash
# Créer le dossier logs
mkdir -p logs

# Démarrer l'application
pm2 start ecosystem.config.js

# Sauvegarder la configuration PM2
pm2 save

# Configurer PM2 pour démarrer au boot
pm2 startup

# Exécuter la commande affichée (ex: sudo env PATH=$PATH:/usr/bin...)

# Vérifier le statut
pm2 status
pm2 logs aigle-royale

# Commandes utiles:
# pm2 restart aigle-royale    # Redémarrer
# pm2 stop aigle-royale       # Arrêter
# pm2 reload aigle-royale     # Rechargement à chaud
# pm2 monit                   # Monitoring en temps réel
```

---

## ⏰ Étape 8: Configuration des CRON Jobs

### 8.1 CRON pour annulation des réservations expirées

L'application utilise Vercel Cron, mais sur VPS nous devons configurer un CRON système:

```bash
# Éditer le crontab
crontab -e
```

Ajouter cette ligne:

```bash
# Annuler les réservations expirées toutes les 15 minutes
*/15 * * * * curl -H "Authorization: Bearer $(grep CRON_SECRET ~/.aigle-royale.env | cut -d'=' -f2)" https://travelia.afrika-connect.io/api/cron/cancel-expired-bookings >> /home/aigle/aigle-royale/logs/cron.log 2>&1
```

OU utiliser un script dédié:

```bash
# Créer le script cron
nano ~/cron-cancel-bookings.sh
```

Contenu du script:

```bash
#!/bin/bash
CRON_SECRET=$(grep CRON_SECRET /home/aigle/aigle-royale/.env | cut -d'=' -f2 | tr -d '"')
curl -s -H "Authorization: Bearer $CRON_SECRET" \
     https://travelia.afrika-connect.io/api/cron/cancel-expired-bookings \
     >> /home/aigle/aigle-royale/logs/cron-$(date +\%Y-\%m-\%d).log 2>&1
```

```bash
# Rendre exécutable
chmod +x ~/cron-cancel-bookings.sh

# Ajouter au crontab
crontab -e
# */15 * * * * /home/aigle/cron-cancel-bookings.sh
```

---

## 🔍 Étape 9: Monitoring et Logs

### 9.1 Logs de l'application
```bash
# Logs PM2
pm2 logs aigle-royale

# Logs en temps réel
pm2 logs aigle-royale --lines 100

# Logs Nginx
sudo tail -f /var/log/nginx/aigle-royale-access.log
sudo tail -f /var/log/nginx/aigle-royale-error.log
```

### 9.2 Monitoring système
```bash
# Monitoring PM2
pm2 monit

# Utilisation disque
df -h

# Utilisation RAM
free -h

# Processus
htop  # ou top
```

### 9.3 Configuration de logrotate
```bash
# Créer la config logrotate
sudo nano /etc/logrotate.d/aigle-royale
```

Contenu:

```
/home/aigle/aigle-royale/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 aigle aigle
    sharedscripts
}
```

---

## 🔄 Étape 10: Script de Déploiement Automatique

### 10.1 Créer un script de déploiement
```bash
nano ~/deploy.sh
```

Contenu:

```bash
#!/bin/bash

echo "🚀 Déploiement Aigle Royale..."

# Aller dans le dossier du projet
cd ~/aigle-royale

# Sauvegarder la version actuelle
echo "📦 Sauvegarde de la version actuelle..."
pm2 save

# Récupérer les dernières modifications
echo "⬇️ Récupération du code..."
git pull origin main

# Installer/Mettre à jour les dépendances
echo "📦 Installation des dépendances..."
npm install --production=false

# Générer le client Prisma
echo "🔨 Génération du client Prisma..."
npm run db:generate

# Appliquer les migrations
echo "🗄️ Migrations de la base de données..."
npx prisma migrate deploy

# Build de l'application
echo "🏗️ Build de l'application..."
npm run build

# Redémarrer l'application (rechargement à chaud)
echo "🔄 Redémarrage de l'application..."
pm2 reload ecosystem.config.js

# Vérifier le statut
echo "✅ Vérification du statut..."
pm2 status

echo "🎉 Déploiement terminé!"
echo "📊 Logs disponibles avec: pm2 logs aigle-royale"
```

```bash
# Rendre exécutable
chmod +x ~/deploy.sh

# Utiliser:
~/deploy.sh
```

---

## 🔐 Étape 11: Sécurité Additionnelle

### 11.1 Configuration fail2ban
```bash
# Créer une jail pour Nginx
sudo nano /etc/fail2ban/jail.local
```

Contenu:

```ini
[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/aigle-royale-error.log

[nginx-noscript]
enabled = true
port = http,https
logpath = /var/log/nginx/aigle-royale-access.log

[nginx-badbots]
enabled = true
port = http,https
logpath = /var/log/nginx/aigle-royale-access.log
```

```bash
# Redémarrer fail2ban
sudo systemctl restart fail2ban

# Vérifier le statut
sudo fail2ban-client status
```

### 11.2 Désactiver root login SSH
```bash
sudo nano /etc/ssh/sshd_config

# Modifier/Ajouter ces lignes:
# PermitRootLogin no
# PasswordAuthentication no  # Si vous utilisez des clés SSH

# Redémarrer SSH
sudo systemctl restart sshd
```

### 11.3 Configuration des limites de rate limiting

Installer et configurer nginx-limit-req (déjà inclus dans Nginx):

```bash
sudo nano /etc/nginx/sites-available/aigle-royale
```

Ajouter avant le bloc `server`:

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;

server {
    # ... configuration existante ...
    
    # Appliquer le rate limiting sur les APIs sensibles
    location /api/auth/ {
        limit_req zone=auth_limit burst=3 nodelay;
        proxy_pass http://nextjs_backend;
        # ... autres directives proxy ...
    }
    
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://nextjs_backend;
        # ... autres directives proxy ...
    }
    
    # ... reste de la configuration ...
}
```

```bash
# Recharger Nginx
sudo nginx -t && sudo systemctl reload nginx
```

---

## 📊 Étape 12: Sauvegarde de la Base de Données

### 12.1 Script de sauvegarde automatique
```bash
nano ~/backup-db.sh
```

Contenu:

```bash
#!/bin/bash

# Configuration
DB_NAME="aigle_royale"
DB_USER="aigle_user"
BACKUP_DIR="/home/aigle/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/aigle_royale_$DATE.sql"

# Créer le dossier de backup
mkdir -p $BACKUP_DIR

# Effectuer le backup
PGPASSWORD='VotreMotDePasseTresFort!2026' pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_FILE

# Compresser le backup
gzip $BACKUP_FILE

# Garder seulement les 30 derniers jours
find $BACKUP_DIR -name "aigle_royale_*.sql.gz" -mtime +30 -delete

echo "✅ Backup créé: ${BACKUP_FILE}.gz"
```

```bash
# Rendre exécutable
chmod +x ~/backup-db.sh

# Ajouter au crontab (tous les jours à 2h du matin)
crontab -e
# 0 2 * * * /home/aigle/backup-db.sh >> /home/aigle/logs/backup.log 2>&1
```

### 12.2 Restauration d'un backup
```bash
# Restaurer un backup
gunzip < /home/aigle/backups/aigle_royale_YYYYMMDD_HHMMSS.sql.gz | \
PGPASSWORD='VotreMotDePasseTresFort!2026' psql -U aigle_user -h localhost aigle_royale
```

---

## ✅ Checklist de Vérification Post-Déploiement

### Système
- [ ] VPS accessible via SSH
- [ ] Pare-feu (ufw) configuré et actif
- [ ] Fail2ban installé et actif
- [ ] Utilisateur non-root créé

### Services
- [ ] PostgreSQL installé et démarré
- [ ] Base de données créée
- [ ] Nginx installé et configuré
- [ ] SSL/HTTPS actif (Let's Encrypt)
- [ ] PM2 configuré pour démarrage automatique

### Application
- [ ] Code déployé (git clone ou SCP)
- [ ] Fichier `.env` créé avec secrets forts
- [ ] Dépendances installées
- [ ] Client Prisma généré
- [ ] Migrations appliquées
- [ ] Build Next.js réussi
- [ ] Application démarrée avec PM2

### Sécurité
- [ ] DEMO_SEED=false en production
- [ ] Secrets générés (NEXTAUTH_SECRET, CRON_SECRET)
- [ ] Rate limiting configuré
- [ ] HTTPS uniquement (redirect HTTP)
- [ ] Headers de sécurité configurés

### Monitoring
- [ ] Logs accessibles (PM2, Nginx)
- [ ] CRON jobs configurés
- [ ] Backups automatiques configurés
- [ ] Monitoring système actif

### Tests
- [ ] Site accessible via HTTPS
- [ ] Login administrateur fonctionne
- [ ] Réservation de test réussie
- [ ] API endpoints répondent
- [ ] Uploads de fichiers fonctionnent

---

## 🔧 Dépannage

### L'application ne démarre pas
```bash
# Vérifier les logs PM2
pm2 logs aigle-royale --lines 100

# Vérifier les erreurs
pm2 describe aigle-royale

# Redémarrer en mode debug
pm2 delete aigle-royale
NODE_ENV=production PORT=3000 npm start
```

### Erreur de connexion base de données
```bash
# Vérifier PostgreSQL
sudo systemctl status postgresql

# Tester la connexion
psql -U aigle_user -d aigle_royale -h localhost

# Vérifier DATABASE_URL dans .env
cat .env | grep DATABASE_URL
```

### Erreur 502 Bad Gateway (Nginx)
```bash
# Vérifier que l'app tourne
pm2 status

# Vérifier les logs Nginx
sudo tail -f /var/log/nginx/aigle-royale-error.log

# Vérifier que le port 3000 écoute
sudo netstat -tulpn | grep 3000
```

### SSL ne fonctionne pas
```bash
# Renouveler le certificat
sudo certbot renew

# Vérifier la configuration Nginx
sudo nginx -t

# Vérifier les logs Certbot
sudo journalctl -u certbot -n 50
```

### Manque de mémoire
```bash
# Vérifier l'utilisation
free -h

# Réduire les instances PM2
pm2 scale aigle-royale 1

# Ou ajouter du swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 📚 Commandes Utiles

### PM2
```bash
pm2 start ecosystem.config.js      # Démarrer
pm2 stop aigle-royale              # Arrêter
pm2 restart aigle-royale           # Redémarrer
pm2 reload aigle-royale            # Rechargement à chaud
pm2 delete aigle-royale            # Supprimer
pm2 logs aigle-royale              # Voir les logs
pm2 monit                          # Monitoring
pm2 save                           # Sauvegarder config
pm2 list                           # Liste des apps
```

### Nginx
```bash
sudo nginx -t                      # Tester la config
sudo systemctl reload nginx        # Recharger
sudo systemctl restart nginx       # Redémarrer
sudo systemctl status nginx        # Statut
```

### PostgreSQL
```bash
sudo systemctl status postgresql   # Statut
sudo -u postgres psql             # Accéder au shell
```

### Logs
```bash
# PM2
pm2 logs --lines 200

# Nginx
sudo tail -f /var/log/nginx/aigle-royale-access.log
sudo tail -f /var/log/nginx/aigle-royale-error.log

# Système
sudo journalctl -u nginx -f
```

---

## 🎯 Optimisations Avancées (Optionnel)

### 1. Redis pour le cache
```bash
# Installer Redis
sudo apt install redis-server

# Configurer dans .env
REDIS_URL="redis://localhost:6379"
```

### 2. CDN pour les assets statiques
- Configurer Cloudflare ou BunnyCDN
- Pointer les assets vers le CDN

### 3. Monitoring avec Prometheus + Grafana
```bash
# Installation Prometheus
# ... (configuration avancée)
```

---

## 📞 Support

En cas de problème:
1. Vérifier les logs: `pm2 logs aigle-royale`
2. Vérifier Nginx: `sudo nginx -t`
3. Vérifier la base de données: PostgreSQL logs
4. Consulter la documentation Next.js: https://nextjs.org/docs

---

**Félicitations! Votre application Aigle Royale est maintenant déployée en production! 🎉**

## 8. Audit et securite

### AUDIT_REPORT.md

# Rapport d'audit des dépendances — Aigle Royale

Date: 2026-01-24

Résumé
------
- Exécution : `npm audit --json` (résumé fourni ci-dessous).
- Total vulnérabilités détectées : 8 (1 critical, 5 high, 2 moderate).
- Actions recommandées : appliquer correctifs sûrs, tester localement, puis effectuer mises à jour majeures avec prudence et tests.

Détails des vulnérabilités et commandes proposées
------------------------------------------------

1) jspdf
- Sévérité : critical / high
- Contexte : utilisé en tant que dépendance directe (`jspdf`)
- Problèmes : ReDoS, DoS, Local File Inclusion (advisories GHSA-w532-jxjh-hjhj, GHSA-8mvj-3j78-4qmw, GHSA-f8cm-6447-x5h2)
- Fix disponible : `jspdf@4.0.0` (major)
- Commande proposée :

```bash
npm install jspdf@4.0.0
```

Remarque : `jspdf@4` est une mise à jour majeure — tester les usages (rendering, API) avant déploiement.

2) @capacitor/cli (transitif: `tar`)
- Sévérité : high
- Contexte : vulnérabilité transitive via `tar` (path traversal / arbitrary file overwrite)
- Fix disponible : mise à jour majeure du paquet CLI (audit propose `@capacitor/cli@2.5.0`) — attention aux incompatibilités avec autres packages Capacitor installés.
- Commande proposée (préférer vérifier compatibilité) :

```bash
# Mettre à jour Capacitor en cohérence (vérifier d'abord la compatibilité avec votre projet)
npm install @capacitor/cli@latest @capacitor/core@latest @capacitor/android@latest @capacitor/ios@latest
```

Remarque : si vous n'utilisez pas Capacitor en production, envisager de le retirer des dépendances de production.

3) tar (transitif)
- Sévérité : high
- Contexte : `tar` vulnérable (path sanitization, symlink poisoning)
- Résolution : se fait en mettant à jour la dépendance parent (ex: `@capacitor/cli`) ou en mettant à jour directement `tar` si présent.
- Commande proposée :

```bash
npm update tar
# ou si transitive, mettre à jour le package parent (voir point @capacitor/cli)
```

4) @next/eslint-plugin-next / eslint-config-next / glob
- Sévérité : high
- Contexte : vulnérabilité transitive via `glob` et plugins ESLint (devDependencies). `glob` a un advisory sur commande CLI injection.
- Commandes proposées :

```bash
npm install eslint-config-next@latest --save-dev
npm install @next/eslint-plugin-next@latest --save-dev
npm install glob@latest --save-dev
```

Remarque : mettre à jour les plugins de lint est généralement sûr mais vérifier les règles et tests.

5) dompurify (transitif via jspdf)
- Sévérité : moderate
- Contexte : DOMPurify XSS advisory (GHSA-vhxf-7vqr-mrjg) pour versions <3.2.4.
- Résolution : la mise à jour de `jspdf` (point 1) règle typiquement cette dépendance transitive.

6) lodash
- Sévérité : moderate
- Contexte : prototype pollution dans certaines versions anciennes (via un transitive)
- Commande proposée :

```bash
npm install lodash@latest
```

Étapes recommandées (ordre prudent)
----------------------------------
1. Commit/push current branch et créer une branche `audit/fix-deps`.
2. Exécuter :

```bash
npm ci
npm audit fix
```

3. Pour vulnérabilités résiduelles (surtout celles nécessitant mises à jour majeures), appliquer chaque correction en isolé, ex. :

```bash
npm install jspdf@4.0.0
npm install eslint-config-next@latest --save-dev @next/eslint-plugin-next@latest --save-dev
npm install @capacitor/cli@latest @capacitor/core@latest # si vous utilisez Capacitor
```

4. Lancer la suite de vérifications locales :

```bash
npm run lint
npm run build
```

5. Tester manuellement les pages/flux critiques (paiement, génération de PDF, upload, API cron).
6. Re-exécuter `npm audit --json` et vérifier que le nombre de vulnérabilités diminue.
7. Déployer sur une staging et vérifier le comportement.

Notes opérationnelles et risques
--------------------------------
- Certaines corrections nécessitent des mises à jour majeures (breaking changes). Testez en isolation.
- Si `@capacitor/*` est utilisé pour des builds mobiles, coordonner les versions Capacitor avec la plateforme mobile (Android/iOS).
- `jspdf` étant utilisé pour génération PDF/QR/tickets, vérifiez la compatibilité API après mise à jour majeure.
- Validez que `devDependencies` mis à jour (eslint, glob) ne brisent pas le CI.

Annexes
-------
- Source des alerts (extraits `npm audit`):
  - jspdf advisories: https://github.com/advisories/GHSA-w532-jxjh-hjhj, https://github.com/advisories/GHSA-8mvj-3j78-4qmw, https://github.com/advisories/GHSA-f8cm-6447-x5h2
  - dompurify advisory: https://github.com/advisories/GHSA-vhxf-7vqr-mrjg
  - glob advisory: https://github.com/advisories/GHSA-5j98-mcp5-4vw2
  - tar advisory: https://github.com/advisories/GHSA-8qq5-rm4j-mr97

---

Fichier généré automatiquement — pour corrections automatiques ou application manuelle, demandez et je peux appliquer les mises à jour sûres et re-tester `npm audit`.

### AUDIT_GENERAL_2026.md

# 📊 Audit Général de l'Application - Aigle Royale
**Date**: 4 Février 2026  
**Version**: 1.0.0  
**Type**: Plateforme de réservation de bus & gestion de fret

---

## 📋 Résumé Exécutif

### Vue d'ensemble
L'application **Aigle Royale** est une plateforme Next.js 14 complète de réservation de billets de bus avec gestion de fret. Elle utilise TypeScript, Prisma avec SQLite, NextAuth pour l'authentification, et offre plusieurs interfaces selon les rôles utilisateurs.

### Points Forts ✅
- ✅ Architecture modulaire bien structurée (App Router Next.js)
- ✅ Système d'authentification robuste avec NextAuth et bcrypt
- ✅ Schéma de base de données complet et relationnel
- ✅ Gestion multi-rôles (CLIENT, AGENT, SUPER_AGENT, ADMINISTRATOR, LOGISTICS, etc.)
- ✅ Fonctionnalités avancées (parrainage, fidélité, multi-devises)
- ✅ TypeScript pour la sécurité de type

### Points Critiques ⚠️
- ⚠️ **8 vulnérabilités de dépendances** (1 critical, 5 high, 2 moderate)
- ⚠️ **Erreurs TypeScript** présentes dans le code
- ⚠️ **SQLite en production** (non recommandé pour production)
- ⚠️ **Absence de fichier .env** (seul env.example présent)
- ⚠️ **Secrets par défaut** dans env.example

---

## 🏗️ Architecture & Structure

### Stack Technique
```
Frontend:  React 18, Next.js 14 (App Router), TypeScript
Backend:   Next.js API Routes, Prisma ORM
Database:  SQLite (dev), PostgreSQL (recommandé prod)
Auth:      NextAuth.js v4 avec JWT
UI:        Tailwind CSS, Lucide Icons, class-variance-authority
Addons:    Capacitor (mobile), QR Code, jsPDF, Recharts
```

### Structure du Projet
```
✅ BONNE ORGANISATION
├── app/                  # Next.js App Router (bien structuré)
│   ├── admin/           # Interface administrateur
│   ├── agent/           # Interface agent
│   ├── super-agent/     # Interface super agent
│   ├── logistics/       # Interface logistique
│   ├── api/             # 76+ API routes
│   └── auth/            # Authentification
├── components/          # Composants React réutilisables
├── lib/                 # Utilitaires (auth, prisma, notifications)
├── prisma/              # Schéma & migrations
└── public/              # Assets statiques
```

**Score Architecture**: 8.5/10
- Points forts: Organisation claire, séparation des responsabilités
- À améliorer: Documentation inline, tests unitaires manquants

---

## 🗄️ Base de Données

### Schéma Prisma
Le schéma comprend **26 modèles** principaux:
- `User` (utilisateurs multi-rôles)
- `Trip`, `Route`, `Bus`, `Seat` (système de transport)
- `Booking`, `BookingGroup`, `Payment` (réservations)
- `FreightOrder`, `LogisticsIssue` (fret)
- `LoyaltyTransaction`, `Commission` (fidélité & commissions)
- `Advertisement`, `BusRental`, `Meal`, etc.

### Points Forts
✅ Relations bien définies avec clés étrangères  
✅ Index sur les champs critiques (`@@index`)  
✅ Contraintes d'unicité appropriées (`@@unique`)  
✅ Support des stops intermédiaires (TripStop, RouteStop)  
✅ Système de tarification passagers (ADULT, CHILD, SENIOR, DISABLED)  
✅ Gestion de la disponibilité des sièges par segment

### Points d'Amélioration
⚠️ **SQLite en production**: Limité en concurrence, recommandé PostgreSQL  
⚠️ Pas de soft deletes (champs `deletedAt`)  
⚠️ Manque de champs d'audit (`createdBy`, `updatedBy`)  
⚠️ Pas de versioning des données critiques

**Score Base de Données**: 7/10

---

## 🔒 Sécurité

### Points Forts ✅
1. **Authentification**
   - NextAuth.js avec stratégie JWT
   - Hashage bcrypt des mots de passe (10 rounds)
   - Protection CSRF intégrée
   - Sessions sécurisées

2. **Autorisation**
   - Vérification des rôles dans les API routes
   - Fonction helper `isAdminRole()` 
   - Protection des routes sensibles avec `getServerSession()`
   - Middleware de validation

3. **Validation**
   - Zod pour validation des schémas (mentionné)
   - Validation des entrées utilisateur
   - Sanitization des données

### Vulnérabilités Identifiées ⚠️

#### 1. Dépendances Vulnérables (CRITICAL)
```
jspdf@4.0.0           - ReDoS, DoS, Local File Inclusion
@capacitor/cli        - Path traversal via tar
tar (transitif)       - Path sanitization, symlink poisoning
```
**Impact**: Exploitation possible en production  
**Solution**: Mettre à jour vers versions sécurisées (voir AUDIT_REPORT.md)

#### 2. Secrets par Défaut (HIGH)
```env
NEXTAUTH_SECRET="change-me-with-a-long-random-secret"
CRON_SECRET="replace-with-a-strong-random-secret"
```
**Impact**: Compromission de sessions si utilisé en production  
**Solution**: Générer des secrets forts et uniques

#### 3. Endpoint CRON Non Sécurisé (MEDIUM)
```typescript
// app/api/cron/cancel-expired-bookings/route.ts
const cronSecret = process.env.CRON_SECRET || 'dev-secret'
```
**Impact**: Valeur par défaut en développement exposée  
**Solution**: Forcer la configuration en production

#### 4. Mots de Passe de Démonstration (LOW)
```
admin@aigleroyale.com : admin123
agent@demo.com        : demo123
```
**Impact**: Comptes par défaut connus  
**Solution**: Désactiver en production (DEMO_SEED=false)

#### 5. Absence de Rate Limiting (MEDIUM)
**Impact**: Possibilité d'attaques par force brute  
**Solution**: Implémenter rate limiting sur auth et APIs

#### 6. Pas de Validation des Variables d'Environnement (MEDIUM)
**Impact**: Application peut démarrer avec config invalide  
**Solution**: Valider au démarrage (utiliser Zod ou similar)

#### 7. Erreurs TypeScript en Production (LOW)
```typescript
// TicketCard.tsx - paramètres any
// booking-groups/[id]/payment/route.ts - templates.bookingConfirmed inexistant
```
**Impact**: Bugs potentiels à l'exécution  
**Solution**: Corriger les types

**Score Sécurité**: 6/10 (correcte mais améliorable)

---

## 🔧 Code Quality

### Erreurs de Compilation TypeScript

#### 1. TicketCard.tsx (3 erreurs)
```typescript
// ERREUR: Paramètres implicitement 'any'
export function TicketCard({ booking, currency, formatCurrency })
```
**Solution**:
```typescript
interface TicketCardProps {
  booking: Booking;
  currency: 'FC' | 'USD';
  formatCurrency: (amount: number) => string;
}
export function TicketCard({ booking, currency, formatCurrency }: TicketCardProps)
```

#### 2. booking-groups/[id]/payment/route.ts
```typescript
// ERREUR: Property 'bookingConfirmed' does not exist
const templates = NotificationService.templates.bookingConfirmed(booking, booking.ticketNumber)
```
**Réalité**: La propriété s'appelle `bookingConfirmation` (pas `bookingConfirmed`)  
**Solution**: Renommer l'appel ou ajouter la méthode manquante

### Bonnes Pratiques Observées ✅
- Utilisation de `async/await` consistante
- Gestion des erreurs avec try/catch
- Transactions Prisma pour opérations critiques
- Fonctions utilitaires bien organisées
- Composants React bien structurés

### Points d'Amélioration 📝
- ❌ Absence de tests unitaires
- ❌ Absence de tests d'intégration
- ❌ Pas de linter configuré strictement (rules vides)
- ❌ Console.log en production (notifications mockées)
- ⚠️ Certaines fonctions trop longues (>100 lignes)
- ⚠️ Duplication de code (ex: `isAdminRole()` répété)

**Score Qualité Code**: 7/10

---

## 🚀 Performance

### Points Forts
- ✅ Utilisation d'index Prisma sur requêtes critiques
- ✅ Parallel operations avec `Promise.all()`
- ✅ Lazy loading des imports
- ✅ Optimisation images Next.js configurée

### Points d'Amélioration
- ⚠️ Pas de mise en cache (Redis, etc.)
- ⚠️ Requêtes N+1 potentielles dans certaines API
- ⚠️ Pas de pagination sur toutes les listes
- ⚠️ SQLite limité en concurrence

**Score Performance**: 6.5/10

---

## 📦 Dépendances

### Dépendances Principales (64)
```json
{
  "next": "^14.0.4",
  "react": "^18.2.0",
  "@prisma/client": "^5.7.1",
  "next-auth": "^4.24.5",
  "bcryptjs": "^2.4.3",
  "zod": "^3.22.4"
}
```

### Problèmes Identifiés

#### Versions Obsolètes
- `jspdf@4.0.0` (latest: 2.x.x avec fixes de sécurité)
- `@capacitor/cli@2.5.0` (latest: 6.x.x)

#### Dépendances Inutilisées
- Capacitor packages si pas de build mobile actif
- `slick-carousel` si slider non utilisé

#### Conflits Potentiels
- `eslint@9.39.2` avec config minimal (peut causer des warnings)

### Recommandations
```bash
# URGENT - Failles de sécurité
npm install jspdf@latest
npm update tar

# Capacitor (si utilisé)
npm install @capacitor/cli@latest @capacitor/core@latest

# Audit complet
npm audit fix --force  # Avec prudence et tests
```

**Score Dépendances**: 5/10 (vulnérabilités critiques)

---

## 🌐 API Routes

### Analyse
- **76+ endpoints** API bien structurés
- Respect des conventions RESTful
- Authentification présente sur routes sensibles
- Validation des données entrantes

### Endpoints Critiques Audités

#### ✅ Bien Sécurisés
- `/api/admin/**` - Vérification rôle ADMINISTRATOR/SUPERVISOR
- `/api/booking-groups/[id]/payment` - Vérification propriétaire
- `/api/freight/**` - Auth requise

#### ⚠️ À Améliorer
- `/api/cron/cancel-expired-bookings` - Secret par défaut faible
- `/api/trips/search` - Pas de rate limiting
- `/api/upload` - Validation type fichier à renforcer

### Points Manquants
- ❌ Pas de documentation API (Swagger/OpenAPI)
- ❌ Pas de versioning API
- ❌ Logs d'audit manquants
- ❌ Métriques/monitoring absents

**Score API**: 7/10

---

## 📱 Fonctionnalités

### Modules Implémentés ✅

#### Client
- ✅ Recherche de trajets
- ✅ Réservation avec choix de siège interactif
- ✅ Paiement (Mobile Money, Carte, Espèces)
- ✅ Génération billets avec QR code
- ✅ Historique réservations
- ✅ Programme fidélité
- ✅ Parrainage

#### Agent
- ✅ Vente billets pour clients
- ✅ Vente de fret (colis)
- ✅ Suivi commissions
- ✅ Dashboard avec statistiques

#### Super Agent (Agence)
- ✅ Vente directe au guichet
- ✅ Check-in passagers
- ✅ Impression boarding passes
- ✅ Gestion bagages

#### Logistique
- ✅ Planning chauffeurs
- ✅ Affectation bus
- ✅ Suivi fret
- ✅ Gestion incidents

#### Administrateur
- ✅ Gestion utilisateurs
- ✅ Gestion bus/routes/trajets
- ✅ Configuration tarifs passagers
- ✅ Statistiques complètes
- ✅ Gestion publicités
- ✅ Gestion locations de bus

### Fonctionnalités Avancées
- ✅ Arrêts intermédiaires
- ✅ Multi-devises (FC/USD)
- ✅ Système de réductions (enfants, seniors, handicapés)
- ✅ Extras (repas, WiFi, bagages supplémentaires)
- ✅ Promotions automatiques
- ✅ Manifestes partageables
- ✅ Auto-annulation réservations expirées (CRON)

**Score Fonctionnalités**: 9/10 (très complet)

---

## 🧪 Tests & Qualité

### État Actuel
- ❌ **Aucun test unitaire** trouvé
- ❌ **Aucun test d'intégration** trouvé
- ❌ **Aucun test E2E** trouvé
- ✅ Scripts de vérification manuels (check_db.js, test_freight.js)
- ✅ Documentation TESTING.md présente

### Recommandations
```bash
# Installation
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev vitest @vitejs/plugin-react

# Tests essentiels à créer
- lib/auth.test.ts
- lib/passenger-pricing.test.ts
- components/TicketCard.test.tsx
- app/api/bookings/route.test.ts
```

**Score Tests**: 2/10 (documentation seulement)

---

## 🐛 Bugs & Problèmes Connus

### 1. Erreurs TypeScript (BLOQUANT)
- `TicketCard.tsx` - Types manquants
- `booking-groups/[id]/payment/route.ts` - Méthode inexistante

### 2. Notifications Mockées (PRODUCTION)
```typescript
// lib/notifications.ts
console.log('[MOCK EMAIL]') // À remplacer par vraie API
console.log('[MOCK SMS]')   // À remplacer par Twilio/autre
```

### 3. Configuration SQLite
```prisma
datasource db {
  provider = "sqlite"  // ⚠️ Non adapté pour production
}
```

### 4. Absence .env
- Application ne peut pas démarrer sans `.env`
- Aucune validation au démarrage

**Score Stabilité**: 6.5/10

---

## 📊 Recommandations Prioritaires

### 🔴 CRITIQUE (À faire immédiatement)

1. **Corriger les vulnérabilités de dépendances**
   ```bash
   npm install jspdf@latest
   npm update tar
   npm audit fix
   ```

2. **Corriger les erreurs TypeScript**
   - Typer `TicketCard` props
   - Fixer `NotificationService.templates`

3. **Créer fichier .env valide**
   ```bash
   cp env.example .env
   # Générer secrets forts
   ```

4. **Migrer vers PostgreSQL en production**
   ```env
   DATABASE_URL="postgresql://user:pass@host:5432/dbname"
   ```

### 🟠 IMPORTANT (Cette semaine)

5. **Implémenter vraies notifications**
   - Intégrer SendGrid/Mailgun pour emails
   - Intégrer Twilio pour SMS

6. **Ajouter validation environnement**
   ```typescript
   // lib/env.ts
   import { z } from 'zod'
   const envSchema = z.object({
     DATABASE_URL: z.string().url(),
     NEXTAUTH_SECRET: z.string().min(32),
     // ...
   })
   ```

7. **Configurer linter strict**
   ```javascript
   // eslint.config.cjs
   rules: {
     '@typescript-eslint/no-explicit-any': 'error',
     '@typescript-eslint/no-unused-vars': 'error',
   }
   ```

8. **Désactiver comptes démo en production**
   ```env
   DEMO_SEED=false
   ```

### 🟡 MOYEN TERME (Ce mois)

9. **Implémenter tests**
   - Tests unitaires lib/
   - Tests composants critiques
   - Tests API endpoints

10. **Ajouter rate limiting**
    ```typescript
    import rateLimit from 'express-rate-limit'
    ```

11. **Implémenter logging structuré**
    ```typescript
    import winston from 'winston'
    ```

12. **Documenter API**
    - Générer Swagger/OpenAPI
    - Documenter tous endpoints

### 🟢 LONG TERME (Trimestre)

13. **Ajouter monitoring**
    - Sentry pour erreurs
    - Analytics pour usage
    - Métriques performance

14. **Implémenter cache**
    - Redis pour sessions
    - Cache requêtes fréquentes

15. **Optimiser performances**
    - Pagination universelle
    - Lazy loading composants
    - Code splitting

16. **Audit accessibilité**
    - WCAG 2.1 Level AA
    - Tests lecteurs écran

---

## 📈 Score Global

| Catégorie | Score | Commentaire |
|-----------|-------|-------------|
| **Architecture** | 8.5/10 | Bien structuré, modulaire |
| **Base de Données** | 7.0/10 | Schéma complet, SQLite limitant |
| **Sécurité** | 6.0/10 | Bases solides, vulnérabilités à corriger |
| **Qualité Code** | 7.0/10 | Bon niveau, manque tests |
| **Performance** | 6.5/10 | Acceptable, optimisations possibles |
| **Dépendances** | 5.0/10 | Vulnérabilités critiques |
| **API** | 7.0/10 | Bien conçu, manque documentation |
| **Fonctionnalités** | 9.0/10 | Très complet |
| **Tests** | 2.0/10 | Quasi inexistants |
| **Stabilité** | 6.5/10 | Erreurs TypeScript à corriger |

### **SCORE GLOBAL: 6.5/10**

---

## ✅ Checklist de Production

- [ ] Corriger toutes les erreurs TypeScript
- [ ] Mettre à jour dépendances vulnérables
- [ ] Migrer vers PostgreSQL
- [ ] Générer secrets forts (NEXTAUTH_SECRET, CRON_SECRET)
- [ ] Désactiver comptes démo (DEMO_SEED=false)
- [ ] Implémenter vraies notifications (emails/SMS)
- [ ] Ajouter validation variables d'environnement
- [ ] Configurer rate limiting
- [ ] Implémenter logging structuré
- [ ] Ajouter tests critiques (auth, bookings, payments)
- [ ] Configurer monitoring (Sentry, analytics)
- [ ] Documenter API (Swagger)
- [ ] Audit de sécurité externe
- [ ] Tests de charge
- [ ] Plan de sauvegarde base de données
- [ ] Configuration CI/CD
- [ ] SSL/HTTPS configuré
- [ ] Firewall et sécurité réseau
- [ ] Plan de reprise d'activité (DRP)

---

## 📝 Conclusion

L'application **Aigle Royale** est une plateforme **ambitieuse et fonctionnellement riche** avec une architecture solide. Cependant, elle nécessite des **corrections urgentes** avant un déploiement en production, notamment:

1. **Sécurité** - Corriger les 8 vulnérabilités de dépendances
2. **Stabilité** - Fixer les erreurs TypeScript
3. **Configuration** - Migrer vers PostgreSQL et sécuriser l'environnement
4. **Tests** - Implémenter une suite de tests de base

Avec ces améliorations, l'application a le potentiel d'être une solution **robuste et professionnelle** pour la gestion de transport de passagers et de fret.

---

**Auditeur**: GitHub Copilot  
**Méthodologie**: Analyse statique du code, revue de sécurité, analyse des dépendances  
**Outils**: npm audit, TypeScript compiler, analyse manuelle du code

## 9. Historique des changements

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

## 10. Annexes source

Les documents originaux restent disponibles individuellement dans leurs fichiers `.md` respectifs.