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
