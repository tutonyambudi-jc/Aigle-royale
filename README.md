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

### Back-Office
- Gestion des bus & flotte
- Gestion des trajets & horaires
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

## 📝 Scripts Disponibles

- `npm run dev` - Lancer le serveur de développement
- `npm run build` - Construire pour la production
- `npm run start` - Lancer le serveur de production
- `npm run db:generate` - Générer le client Prisma
- `npm run db:push` - Pousser les changements vers la DB
- `npm run db:migrate` - Créer une migration
- `npm run db:seed` - Peupler la base de données avec des données de test
- `npm run db:studio` - Ouvrir Prisma Studio

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
