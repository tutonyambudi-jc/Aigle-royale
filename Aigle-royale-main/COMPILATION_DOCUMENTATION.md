# Compilation des documents Markdown

Genere le 2026-03-30 23:57:49.

## Table des matieres

- [API.md](#apimd)
- [AUDIT_GENERAL_2026.md](#audit_general_2026md)
- [AUDIT_REPORT.md](#audit_reportmd)
- [CHANGELOG.md](#changelogmd)
- [DEPLOYMENT_VPS.md](#deployment_vpsmd)
- [DOCUMENTATION_PEDAGOGIQUE_MODULES.md](#documentation_pedagogique_modulesmd)
- [PRICING_SYSTEM.md](#pricing_systemmd)
- [QUICK_START.md](#quick_startmd)
- [README.md](#readmemd)
- [SEAT_MANAGEMENT.md](#seat_managementmd)
- [SETUP.md](#setupmd)
- [TESTING.md](#testingmd)

---

## API.md

# Documentation des API Routes

## Authentification

### POST `/api/auth/register`
CrÃ©er un nouveau compte utilisateur

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

## RÃ©servations

### POST `/api/bookings`
CrÃ©er une ou plusieurs rÃ©servations (avec regroupement automatique)

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
  "hasDisability": "boolean (optionnel, dÃ©faut: false)",
  "boardingStopId": "string (optionnel, pour arrÃªts intermÃ©diaires)",
  "alightingStopId": "string (optionnel, pour arrÃªts intermÃ©diaires)"
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
- Le systÃ¨me rÃ©cupÃ¨re la rÃ¨gle de tarification selon `passengerType`
- `basePrice` = prix du trajet
- `discountAmount` = `basePrice * (discountPercent / 100)`
- `totalPrice` = `basePrice - discountAmount + extrasTotal`

**Response:**
```json
{
  "bookingGroupId": "string (nouveau - ID du groupe de rÃ©servations)",
  "bookingId": "string (ID de la premiÃ¨re rÃ©servation)",
  "ticketNumber": "string (NumÃ©ro du premier billet)",
  "bookingIds": ["string", "string", ...],
  "ticketNumbers": ["string", "string", ...]
}
```

**Note importante:** Lors de rÃ©servations multiples, toutes les rÃ©servations sont regroupÃ©es dans un `BookingGroup` unique. Cela permet un **paiement unique** pour tous les billets, rÃ©duisant ainsi les frais de commission.

### POST `/api/bookings/[id]/payment`
Effectuer le paiement d'une rÃ©servation individuelle (ancien systÃ¨me)

**Body:**
```json
{
  "method": "MOBILE_MONEY" | "CARD" | "CASH"
}
```

## Groupes de RÃ©servations (Nouveau)

### POST `/api/booking-groups/[id]/payment`
Effectuer le paiement groupÃ© pour plusieurs billets

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

**Avantages du paiement groupÃ©:**
- âœ… Un seul paiement pour tous les billets
- âœ… Une seule commission prÃ©levÃ©e
- âœ… RÃ©capitulatif complet de tous les passagers
- âœ… Gestion simplifiÃ©e pour les familles/groupes

## Trajets

### GET `/api/trips/search`
Rechercher des trajets

**Query Parameters:**
- `origin`: Ville de dÃ©part
- `destination`: Ville d'arrivÃ©e
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
CrÃ©er une commande de fret

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
Lister toutes les rÃ¨gles de tarification (Admin uniquement)

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
Mettre Ã  jour une rÃ¨gle de tarification (Admin uniquement)

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

**Exemples de rÃ¨gles:**
- **ADULT**: 0% de rÃ©duction, 12-59 ans
- **CHILD**: 50% de rÃ©duction, 2-11 ans
- **INFANT**: 80% de rÃ©duction, 0-1 an
- **SENIOR**: 30% de rÃ©duction, 60+ ans
- **DISABLED**: 40% de rÃ©duction, tous Ã¢ges (justificatif requis)

## PublicitÃ©s

### GET `/api/advertisements`
Lister les publicitÃ©s

**Query Parameters:**
- `type`: Type de banniÃ¨re (BANNER_HOMEPAGE, BANNER_RESULTS, BANNER_CONFIRMATION)
- `status`: Statut (ACTIVE, INACTIVE, EXPIRED)

### POST `/api/advertisements`
CrÃ©er une publicitÃ© (Admin uniquement)

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
Obtenir une publicitÃ© spÃ©cifique (incrÃ©mente les impressions)

### PUT `/api/advertisements/[id]`
Mettre Ã  jour une publicitÃ© (Admin uniquement)

### DELETE `/api/advertisements/[id]`
Supprimer une publicitÃ© (Admin uniquement)

### POST `/api/advertisements/[id]/click`
Enregistrer un clic sur une publicitÃ©

## ParamÃ¨tres SystÃ¨me

### GET `/api/settings`
RÃ©cupÃ©rer un paramÃ¨tre systÃ¨me (public)

**Query Parameters:**
- `key`: ClÃ© du paramÃ¨tre (ex: `seatSelectionKey`)

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
RÃ©cupÃ©rer les paramÃ¨tres systÃ¨me (Admin uniquement)

**Query Parameters:**
- `key`: ClÃ© du paramÃ¨tre (optionnel)

### POST `/api/admin/settings`
CrÃ©er ou mettre Ã  jour un paramÃ¨tre systÃ¨me (Admin uniquement)

**Body:**
```json
{
  "key": "string",
  "value": "string"
}
```

## ArrÃªts de Ville

### GET `/api/admin/city-stops`
Lister les arrÃªts de ville actifs (Admin uniquement)

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
CrÃ©er un nouvel arrÃªt de ville (Admin uniquement)

**Body:**
```json
{
  "cityId": "string",
  "name": "string",
  "address": "string (optionnel)"
}
```

### PUT `/api/admin/city-stops/[id]`
Modifier un arrÃªt de ville (Admin uniquement)

**Body:**
```json
{
  "name": "string",
  "address": "string (optionnel)"
}
```

### DELETE `/api/admin/city-stops/[id]`
DÃ©sactiver un arrÃªt de ville (Admin uniquement)

## ArrÃªts de Route

### GET `/api/admin/routes/[id]`
RÃ©cupÃ©rer les dÃ©tails d'une route (Admin uniquement)

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
Lister les arrÃªts d'une route (Admin uniquement)

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
Ajouter un arrÃªt Ã  une route (Admin uniquement)

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
Supprimer un arrÃªt d'une route (Admin uniquement)

### PATCH `/api/admin/routes/[id]/stops/[routeStopId]/reorder`
RÃ©organiser l'ordre des arrÃªts (Admin uniquement)

**Body:**
```json
{
  "direction": "up | down"
}
```

## Gestion de la VisibilitÃ© des SiÃ¨ges

### PUT `/api/admin/buses/[busId]/seats/[seatId]`
Mettre Ã  jour la visibilitÃ© d'un siÃ¨ge (Admin uniquement)

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
    "seatNumber": "string", // Format alphanumÃ©rique: A1, B1, etc.
    "seatType": "string",
    "isAvailable": "boolean",
    "isHidden": "boolean",
    "createdAt": "datetime",
    "updatedAt": "datetime"
  }
}
```

**Erreurs possibles:**
- `401`: Non authentifiÃ©
- `403`: AccÃ¨s non autorisÃ© (admin requis)
- `404`: SiÃ¨ge introuvable
- `400`: Le siÃ¨ge n'appartient pas Ã  ce bus ou donnÃ©es invalides

**Notes:**
- Les siÃ¨ges cachÃ©s (`isHidden: true`) ne sont pas affichÃ©s dans les formulaires de rÃ©servation
- Le filtrage automatique est appliquÃ© dans toutes les requÃªtes de rÃ©servation
- Utile pour gÃ©rer des siÃ¨ges en maintenance ou rÃ©servÃ©s pour des usages spÃ©cifiques

### PATCH `/api/admin/buses/[busId]/seats/[seatId]`
Basculer la disponibilitÃ© d'un siÃ¨ge (Admin uniquement)

**Body:**
```json
{
  "isAvailable": "boolean"
}
```

## Notes

- Toutes les routes nÃ©cessitent une authentification sauf `/api/auth/*` et certaines routes publiques
- Les rÃ´les sont vÃ©rifiÃ©s pour les routes administratives
- Les erreurs retournent un format JSON avec un champ `error`
- **NumÃ©rotation des siÃ¨ges**: Format alphanumÃ©rique standardisÃ© (A1, A2, B1, B2, etc.)

---

## AUDIT_GENERAL_2026.md

# ðŸ“Š Audit GÃ©nÃ©ral de l'Application - Aigle Royale
**Date**: 4 FÃ©vrier 2026  
**Version**: 1.0.0  
**Type**: Plateforme de rÃ©servation de bus & gestion de fret

---

## ðŸ“‹ RÃ©sumÃ© ExÃ©cutif

### Vue d'ensemble
L'application **Aigle Royale** est une plateforme Next.js 14 complÃ¨te de rÃ©servation de billets de bus avec gestion de fret. Elle utilise TypeScript, Prisma avec SQLite, NextAuth pour l'authentification, et offre plusieurs interfaces selon les rÃ´les utilisateurs.

### Points Forts âœ…
- âœ… Architecture modulaire bien structurÃ©e (App Router Next.js)
- âœ… SystÃ¨me d'authentification robuste avec NextAuth et bcrypt
- âœ… SchÃ©ma de base de donnÃ©es complet et relationnel
- âœ… Gestion multi-rÃ´les (CLIENT, AGENT, SUPER_AGENT, ADMINISTRATOR, LOGISTICS, etc.)
- âœ… FonctionnalitÃ©s avancÃ©es (parrainage, fidÃ©litÃ©, multi-devises)
- âœ… TypeScript pour la sÃ©curitÃ© de type

### Points Critiques âš ï¸
- âš ï¸ **8 vulnÃ©rabilitÃ©s de dÃ©pendances** (1 critical, 5 high, 2 moderate)
- âš ï¸ **Erreurs TypeScript** prÃ©sentes dans le code
- âš ï¸ **SQLite en production** (non recommandÃ© pour production)
- âš ï¸ **Absence de fichier .env** (seul env.example prÃ©sent)
- âš ï¸ **Secrets par dÃ©faut** dans env.example

---

## ðŸ—ï¸ Architecture & Structure

### Stack Technique
```
Frontend:  React 18, Next.js 14 (App Router), TypeScript
Backend:   Next.js API Routes, Prisma ORM
Database:  SQLite (dev), PostgreSQL (recommandÃ© prod)
Auth:      NextAuth.js v4 avec JWT
UI:        Tailwind CSS, Lucide Icons, class-variance-authority
Addons:    Capacitor (mobile), QR Code, jsPDF, Recharts
```

### Structure du Projet
```
âœ… BONNE ORGANISATION
â”œâ”€â”€ app/                  # Next.js App Router (bien structurÃ©)
â”‚   â”œâ”€â”€ admin/           # Interface administrateur
â”‚   â”œâ”€â”€ agent/           # Interface agent
â”‚   â”œâ”€â”€ super-agent/     # Interface super agent
â”‚   â”œâ”€â”€ logistics/       # Interface logistique
â”‚   â”œâ”€â”€ api/             # 76+ API routes
â”‚   â””â”€â”€ auth/            # Authentification
â”œâ”€â”€ components/          # Composants React rÃ©utilisables
â”œâ”€â”€ lib/                 # Utilitaires (auth, prisma, notifications)
â”œâ”€â”€ prisma/              # SchÃ©ma & migrations
â””â”€â”€ public/              # Assets statiques
```

**Score Architecture**: 8.5/10
- Points forts: Organisation claire, sÃ©paration des responsabilitÃ©s
- Ã€ amÃ©liorer: Documentation inline, tests unitaires manquants

---

## ðŸ—„ï¸ Base de DonnÃ©es

### SchÃ©ma Prisma
Le schÃ©ma comprend **26 modÃ¨les** principaux:
- `User` (utilisateurs multi-rÃ´les)
- `Trip`, `Route`, `Bus`, `Seat` (systÃ¨me de transport)
- `Booking`, `BookingGroup`, `Payment` (rÃ©servations)
- `FreightOrder`, `LogisticsIssue` (fret)
- `LoyaltyTransaction`, `Commission` (fidÃ©litÃ© & commissions)
- `Advertisement`, `BusRental`, `Meal`, etc.

### Points Forts
âœ… Relations bien dÃ©finies avec clÃ©s Ã©trangÃ¨res  
âœ… Index sur les champs critiques (`@@index`)  
âœ… Contraintes d'unicitÃ© appropriÃ©es (`@@unique`)  
âœ… Support des stops intermÃ©diaires (TripStop, RouteStop)  
âœ… SystÃ¨me de tarification passagers (ADULT, CHILD, SENIOR, DISABLED)  
âœ… Gestion de la disponibilitÃ© des siÃ¨ges par segment

### Points d'AmÃ©lioration
âš ï¸ **SQLite en production**: LimitÃ© en concurrence, recommandÃ© PostgreSQL  
âš ï¸ Pas de soft deletes (champs `deletedAt`)  
âš ï¸ Manque de champs d'audit (`createdBy`, `updatedBy`)  
âš ï¸ Pas de versioning des donnÃ©es critiques

**Score Base de DonnÃ©es**: 7/10

---

## ðŸ”’ SÃ©curitÃ©

### Points Forts âœ…
1. **Authentification**
   - NextAuth.js avec stratÃ©gie JWT
   - Hashage bcrypt des mots de passe (10 rounds)
   - Protection CSRF intÃ©grÃ©e
   - Sessions sÃ©curisÃ©es

2. **Autorisation**
   - VÃ©rification des rÃ´les dans les API routes
   - Fonction helper `isAdminRole()` 
   - Protection des routes sensibles avec `getServerSession()`
   - Middleware de validation

3. **Validation**
   - Zod pour validation des schÃ©mas (mentionnÃ©)
   - Validation des entrÃ©es utilisateur
   - Sanitization des donnÃ©es

### VulnÃ©rabilitÃ©s IdentifiÃ©es âš ï¸

#### 1. DÃ©pendances VulnÃ©rables (CRITICAL)
```
jspdf@4.0.0           - ReDoS, DoS, Local File Inclusion
@capacitor/cli        - Path traversal via tar
tar (transitif)       - Path sanitization, symlink poisoning
```
**Impact**: Exploitation possible en production  
**Solution**: Mettre Ã  jour vers versions sÃ©curisÃ©es (voir AUDIT_REPORT.md)

#### 2. Secrets par DÃ©faut (HIGH)
```env
NEXTAUTH_SECRET="change-me-with-a-long-random-secret"
CRON_SECRET="replace-with-a-strong-random-secret"
```
**Impact**: Compromission de sessions si utilisÃ© en production  
**Solution**: GÃ©nÃ©rer des secrets forts et uniques

#### 3. Endpoint CRON Non SÃ©curisÃ© (MEDIUM)
```typescript
// app/api/cron/cancel-expired-bookings/route.ts
const cronSecret = process.env.CRON_SECRET || 'dev-secret'
```
**Impact**: Valeur par dÃ©faut en dÃ©veloppement exposÃ©e  
**Solution**: Forcer la configuration en production

#### 4. Mots de Passe de DÃ©monstration (LOW)
```
admin@aigleroyale.com : admin123
agent@demo.com        : demo123
```
**Impact**: Comptes par dÃ©faut connus  
**Solution**: DÃ©sactiver en production (DEMO_SEED=false)

#### 5. Absence de Rate Limiting (MEDIUM)
**Impact**: PossibilitÃ© d'attaques par force brute  
**Solution**: ImplÃ©menter rate limiting sur auth et APIs

#### 6. Pas de Validation des Variables d'Environnement (MEDIUM)
**Impact**: Application peut dÃ©marrer avec config invalide  
**Solution**: Valider au dÃ©marrage (utiliser Zod ou similar)

#### 7. Erreurs TypeScript en Production (LOW)
```typescript
// TicketCard.tsx - paramÃ¨tres any
// booking-groups/[id]/payment/route.ts - templates.bookingConfirmed inexistant
```
**Impact**: Bugs potentiels Ã  l'exÃ©cution  
**Solution**: Corriger les types

**Score SÃ©curitÃ©**: 6/10 (correcte mais amÃ©liorable)

---

## ðŸ”§ Code Quality

### Erreurs de Compilation TypeScript

#### 1. TicketCard.tsx (3 erreurs)
```typescript
// ERREUR: ParamÃ¨tres implicitement 'any'
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
**RÃ©alitÃ©**: La propriÃ©tÃ© s'appelle `bookingConfirmation` (pas `bookingConfirmed`)  
**Solution**: Renommer l'appel ou ajouter la mÃ©thode manquante

### Bonnes Pratiques ObservÃ©es âœ…
- Utilisation de `async/await` consistante
- Gestion des erreurs avec try/catch
- Transactions Prisma pour opÃ©rations critiques
- Fonctions utilitaires bien organisÃ©es
- Composants React bien structurÃ©s

### Points d'AmÃ©lioration ðŸ“
- âŒ Absence de tests unitaires
- âŒ Absence de tests d'intÃ©gration
- âŒ Pas de linter configurÃ© strictement (rules vides)
- âŒ Console.log en production (notifications mockÃ©es)
- âš ï¸ Certaines fonctions trop longues (>100 lignes)
- âš ï¸ Duplication de code (ex: `isAdminRole()` rÃ©pÃ©tÃ©)

**Score QualitÃ© Code**: 7/10

---

## ðŸš€ Performance

### Points Forts
- âœ… Utilisation d'index Prisma sur requÃªtes critiques
- âœ… Parallel operations avec `Promise.all()`
- âœ… Lazy loading des imports
- âœ… Optimisation images Next.js configurÃ©e

### Points d'AmÃ©lioration
- âš ï¸ Pas de mise en cache (Redis, etc.)
- âš ï¸ RequÃªtes N+1 potentielles dans certaines API
- âš ï¸ Pas de pagination sur toutes les listes
- âš ï¸ SQLite limitÃ© en concurrence

**Score Performance**: 6.5/10

---

## ðŸ“¦ DÃ©pendances

### DÃ©pendances Principales (64)
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

### ProblÃ¨mes IdentifiÃ©s

#### Versions ObsolÃ¨tes
- `jspdf@4.0.0` (latest: 2.x.x avec fixes de sÃ©curitÃ©)
- `@capacitor/cli@2.5.0` (latest: 6.x.x)

#### DÃ©pendances InutilisÃ©es
- Capacitor packages si pas de build mobile actif
- `slick-carousel` si slider non utilisÃ©

#### Conflits Potentiels
- `eslint@9.39.2` avec config minimal (peut causer des warnings)

### Recommandations
```bash
# URGENT - Failles de sÃ©curitÃ©
npm install jspdf@latest
npm update tar

# Capacitor (si utilisÃ©)
npm install @capacitor/cli@latest @capacitor/core@latest

# Audit complet
npm audit fix --force  # Avec prudence et tests
```

**Score DÃ©pendances**: 5/10 (vulnÃ©rabilitÃ©s critiques)

---

## ðŸŒ API Routes

### Analyse
- **76+ endpoints** API bien structurÃ©s
- Respect des conventions RESTful
- Authentification prÃ©sente sur routes sensibles
- Validation des donnÃ©es entrantes

### Endpoints Critiques AuditÃ©s

#### âœ… Bien SÃ©curisÃ©s
- `/api/admin/**` - VÃ©rification rÃ´le ADMINISTRATOR/SUPERVISOR
- `/api/booking-groups/[id]/payment` - VÃ©rification propriÃ©taire
- `/api/freight/**` - Auth requise

#### âš ï¸ Ã€ AmÃ©liorer
- `/api/cron/cancel-expired-bookings` - Secret par dÃ©faut faible
- `/api/trips/search` - Pas de rate limiting
- `/api/upload` - Validation type fichier Ã  renforcer

### Points Manquants
- âŒ Pas de documentation API (Swagger/OpenAPI)
- âŒ Pas de versioning API
- âŒ Logs d'audit manquants
- âŒ MÃ©triques/monitoring absents

**Score API**: 7/10

---

## ðŸ“± FonctionnalitÃ©s

### Modules ImplÃ©mentÃ©s âœ…

#### Client
- âœ… Recherche de trajets
- âœ… RÃ©servation avec choix de siÃ¨ge interactif
- âœ… Paiement (Mobile Money, Carte, EspÃ¨ces)
- âœ… GÃ©nÃ©ration billets avec QR code
- âœ… Historique rÃ©servations
- âœ… Programme fidÃ©litÃ©
- âœ… Parrainage

#### Agent
- âœ… Vente billets pour clients
- âœ… Vente de fret (colis)
- âœ… Suivi commissions
- âœ… Dashboard avec statistiques

#### Super Agent (Agence)
- âœ… Vente directe au guichet
- âœ… Check-in passagers
- âœ… Impression boarding passes
- âœ… Gestion bagages

#### Logistique
- âœ… Planning chauffeurs
- âœ… Affectation bus
- âœ… Suivi fret
- âœ… Gestion incidents

#### Administrateur
- âœ… Gestion utilisateurs
- âœ… Gestion bus/routes/trajets
- âœ… Configuration tarifs passagers
- âœ… Statistiques complÃ¨tes
- âœ… Gestion publicitÃ©s
- âœ… Gestion locations de bus

### FonctionnalitÃ©s AvancÃ©es
- âœ… ArrÃªts intermÃ©diaires
- âœ… Multi-devises (FC/USD)
- âœ… SystÃ¨me de rÃ©ductions (enfants, seniors, handicapÃ©s)
- âœ… Extras (repas, WiFi, bagages supplÃ©mentaires)
- âœ… Promotions automatiques
- âœ… Manifestes partageables
- âœ… Auto-annulation rÃ©servations expirÃ©es (CRON)

**Score FonctionnalitÃ©s**: 9/10 (trÃ¨s complet)

---

## ðŸ§ª Tests & QualitÃ©

### Ã‰tat Actuel
- âŒ **Aucun test unitaire** trouvÃ©
- âŒ **Aucun test d'intÃ©gration** trouvÃ©
- âŒ **Aucun test E2E** trouvÃ©
- âœ… Scripts de vÃ©rification manuels (check_db.js, test_freight.js)
- âœ… Documentation TESTING.md prÃ©sente

### Recommandations
```bash
# Installation
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev vitest @vitejs/plugin-react

# Tests essentiels Ã  crÃ©er
- lib/auth.test.ts
- lib/passenger-pricing.test.ts
- components/TicketCard.test.tsx
- app/api/bookings/route.test.ts
```

**Score Tests**: 2/10 (documentation seulement)

---

## ðŸ› Bugs & ProblÃ¨mes Connus

### 1. Erreurs TypeScript (BLOQUANT)
- `TicketCard.tsx` - Types manquants
- `booking-groups/[id]/payment/route.ts` - MÃ©thode inexistante

### 2. Notifications MockÃ©es (PRODUCTION)
```typescript
// lib/notifications.ts
console.log('[MOCK EMAIL]') // Ã€ remplacer par vraie API
console.log('[MOCK SMS]')   // Ã€ remplacer par Twilio/autre
```

### 3. Configuration SQLite
```prisma
datasource db {
  provider = "sqlite"  // âš ï¸ Non adaptÃ© pour production
}
```

### 4. Absence .env
- Application ne peut pas dÃ©marrer sans `.env`
- Aucune validation au dÃ©marrage

**Score StabilitÃ©**: 6.5/10

---

## ðŸ“Š Recommandations Prioritaires

### ðŸ”´ CRITIQUE (Ã€ faire immÃ©diatement)

1. **Corriger les vulnÃ©rabilitÃ©s de dÃ©pendances**
   ```bash
   npm install jspdf@latest
   npm update tar
   npm audit fix
   ```

2. **Corriger les erreurs TypeScript**
   - Typer `TicketCard` props
   - Fixer `NotificationService.templates`

3. **CrÃ©er fichier .env valide**
   ```bash
   cp env.example .env
   # GÃ©nÃ©rer secrets forts
   ```

4. **Migrer vers PostgreSQL en production**
   ```env
   DATABASE_URL="postgresql://user:pass@host:5432/dbname"
   ```

### ðŸŸ  IMPORTANT (Cette semaine)

5. **ImplÃ©menter vraies notifications**
   - IntÃ©grer SendGrid/Mailgun pour emails
   - IntÃ©grer Twilio pour SMS

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

8. **DÃ©sactiver comptes dÃ©mo en production**
   ```env
   DEMO_SEED=false
   ```

### ðŸŸ¡ MOYEN TERME (Ce mois)

9. **ImplÃ©menter tests**
   - Tests unitaires lib/
   - Tests composants critiques
   - Tests API endpoints

10. **Ajouter rate limiting**
    ```typescript
    import rateLimit from 'express-rate-limit'
    ```

11. **ImplÃ©menter logging structurÃ©**
    ```typescript
    import winston from 'winston'
    ```

12. **Documenter API**
    - GÃ©nÃ©rer Swagger/OpenAPI
    - Documenter tous endpoints

### ðŸŸ¢ LONG TERME (Trimestre)

13. **Ajouter monitoring**
    - Sentry pour erreurs
    - Analytics pour usage
    - MÃ©triques performance

14. **ImplÃ©menter cache**
    - Redis pour sessions
    - Cache requÃªtes frÃ©quentes

15. **Optimiser performances**
    - Pagination universelle
    - Lazy loading composants
    - Code splitting

16. **Audit accessibilitÃ©**
    - WCAG 2.1 Level AA
    - Tests lecteurs Ã©cran

---

## ðŸ“ˆ Score Global

| CatÃ©gorie | Score | Commentaire |
|-----------|-------|-------------|
| **Architecture** | 8.5/10 | Bien structurÃ©, modulaire |
| **Base de DonnÃ©es** | 7.0/10 | SchÃ©ma complet, SQLite limitant |
| **SÃ©curitÃ©** | 6.0/10 | Bases solides, vulnÃ©rabilitÃ©s Ã  corriger |
| **QualitÃ© Code** | 7.0/10 | Bon niveau, manque tests |
| **Performance** | 6.5/10 | Acceptable, optimisations possibles |
| **DÃ©pendances** | 5.0/10 | VulnÃ©rabilitÃ©s critiques |
| **API** | 7.0/10 | Bien conÃ§u, manque documentation |
| **FonctionnalitÃ©s** | 9.0/10 | TrÃ¨s complet |
| **Tests** | 2.0/10 | Quasi inexistants |
| **StabilitÃ©** | 6.5/10 | Erreurs TypeScript Ã  corriger |

### **SCORE GLOBAL: 6.5/10**

---

## âœ… Checklist de Production

- [ ] Corriger toutes les erreurs TypeScript
- [ ] Mettre Ã  jour dÃ©pendances vulnÃ©rables
- [ ] Migrer vers PostgreSQL
- [ ] GÃ©nÃ©rer secrets forts (NEXTAUTH_SECRET, CRON_SECRET)
- [ ] DÃ©sactiver comptes dÃ©mo (DEMO_SEED=false)
- [ ] ImplÃ©menter vraies notifications (emails/SMS)
- [ ] Ajouter validation variables d'environnement
- [ ] Configurer rate limiting
- [ ] ImplÃ©menter logging structurÃ©
- [ ] Ajouter tests critiques (auth, bookings, payments)
- [ ] Configurer monitoring (Sentry, analytics)
- [ ] Documenter API (Swagger)
- [ ] Audit de sÃ©curitÃ© externe
- [ ] Tests de charge
- [ ] Plan de sauvegarde base de donnÃ©es
- [ ] Configuration CI/CD
- [ ] SSL/HTTPS configurÃ©
- [ ] Firewall et sÃ©curitÃ© rÃ©seau
- [ ] Plan de reprise d'activitÃ© (DRP)

---

## ðŸ“ Conclusion

L'application **Aigle Royale** est une plateforme **ambitieuse et fonctionnellement riche** avec une architecture solide. Cependant, elle nÃ©cessite des **corrections urgentes** avant un dÃ©ploiement en production, notamment:

1. **SÃ©curitÃ©** - Corriger les 8 vulnÃ©rabilitÃ©s de dÃ©pendances
2. **StabilitÃ©** - Fixer les erreurs TypeScript
3. **Configuration** - Migrer vers PostgreSQL et sÃ©curiser l'environnement
4. **Tests** - ImplÃ©menter une suite de tests de base

Avec ces amÃ©liorations, l'application a le potentiel d'Ãªtre une solution **robuste et professionnelle** pour la gestion de transport de passagers et de fret.

---

**Auditeur**: GitHub Copilot  
**MÃ©thodologie**: Analyse statique du code, revue de sÃ©curitÃ©, analyse des dÃ©pendances  
**Outils**: npm audit, TypeScript compiler, analyse manuelle du code

---

## AUDIT_REPORT.md

# Rapport d'audit des dÃ©pendances â€” Aigle Royale

Date: 2026-01-24

RÃ©sumÃ©
------
- ExÃ©cution : `npm audit --json` (rÃ©sumÃ© fourni ci-dessous).
- Total vulnÃ©rabilitÃ©s dÃ©tectÃ©es : 8 (1 critical, 5 high, 2 moderate).
- Actions recommandÃ©es : appliquer correctifs sÃ»rs, tester localement, puis effectuer mises Ã  jour majeures avec prudence et tests.

DÃ©tails des vulnÃ©rabilitÃ©s et commandes proposÃ©es
------------------------------------------------

1) jspdf
- SÃ©vÃ©ritÃ© : critical / high
- Contexte : utilisÃ© en tant que dÃ©pendance directe (`jspdf`)
- ProblÃ¨mes : ReDoS, DoS, Local File Inclusion (advisories GHSA-w532-jxjh-hjhj, GHSA-8mvj-3j78-4qmw, GHSA-f8cm-6447-x5h2)
- Fix disponible : `jspdf@4.0.0` (major)
- Commande proposÃ©e :

```bash
npm install jspdf@4.0.0
```

Remarque : `jspdf@4` est une mise Ã  jour majeure â€” tester les usages (rendering, API) avant dÃ©ploiement.

2) @capacitor/cli (transitif: `tar`)
- SÃ©vÃ©ritÃ© : high
- Contexte : vulnÃ©rabilitÃ© transitive via `tar` (path traversal / arbitrary file overwrite)
- Fix disponible : mise Ã  jour majeure du paquet CLI (audit propose `@capacitor/cli@2.5.0`) â€” attention aux incompatibilitÃ©s avec autres packages Capacitor installÃ©s.
- Commande proposÃ©e (prÃ©fÃ©rer vÃ©rifier compatibilitÃ©) :

```bash
# Mettre Ã  jour Capacitor en cohÃ©rence (vÃ©rifier d'abord la compatibilitÃ© avec votre projet)
npm install @capacitor/cli@latest @capacitor/core@latest @capacitor/android@latest @capacitor/ios@latest
```

Remarque : si vous n'utilisez pas Capacitor en production, envisager de le retirer des dÃ©pendances de production.

3) tar (transitif)
- SÃ©vÃ©ritÃ© : high
- Contexte : `tar` vulnÃ©rable (path sanitization, symlink poisoning)
- RÃ©solution : se fait en mettant Ã  jour la dÃ©pendance parent (ex: `@capacitor/cli`) ou en mettant Ã  jour directement `tar` si prÃ©sent.
- Commande proposÃ©e :

```bash
npm update tar
# ou si transitive, mettre Ã  jour le package parent (voir point @capacitor/cli)
```

4) @next/eslint-plugin-next / eslint-config-next / glob
- SÃ©vÃ©ritÃ© : high
- Contexte : vulnÃ©rabilitÃ© transitive via `glob` et plugins ESLint (devDependencies). `glob` a un advisory sur commande CLI injection.
- Commandes proposÃ©es :

```bash
npm install eslint-config-next@latest --save-dev
npm install @next/eslint-plugin-next@latest --save-dev
npm install glob@latest --save-dev
```

Remarque : mettre Ã  jour les plugins de lint est gÃ©nÃ©ralement sÃ»r mais vÃ©rifier les rÃ¨gles et tests.

5) dompurify (transitif via jspdf)
- SÃ©vÃ©ritÃ© : moderate
- Contexte : DOMPurify XSS advisory (GHSA-vhxf-7vqr-mrjg) pour versions <3.2.4.
- RÃ©solution : la mise Ã  jour de `jspdf` (point 1) rÃ¨gle typiquement cette dÃ©pendance transitive.

6) lodash
- SÃ©vÃ©ritÃ© : moderate
- Contexte : prototype pollution dans certaines versions anciennes (via un transitive)
- Commande proposÃ©e :

```bash
npm install lodash@latest
```

Ã‰tapes recommandÃ©es (ordre prudent)
----------------------------------
1. Commit/push current branch et crÃ©er une branche `audit/fix-deps`.
2. ExÃ©cuter :

```bash
npm ci
npm audit fix
```

3. Pour vulnÃ©rabilitÃ©s rÃ©siduelles (surtout celles nÃ©cessitant mises Ã  jour majeures), appliquer chaque correction en isolÃ©, ex. :

```bash
npm install jspdf@4.0.0
npm install eslint-config-next@latest --save-dev @next/eslint-plugin-next@latest --save-dev
npm install @capacitor/cli@latest @capacitor/core@latest # si vous utilisez Capacitor
```

4. Lancer la suite de vÃ©rifications locales :

```bash
npm run lint
npm run build
```

5. Tester manuellement les pages/flux critiques (paiement, gÃ©nÃ©ration de PDF, upload, API cron).
6. Re-exÃ©cuter `npm audit --json` et vÃ©rifier que le nombre de vulnÃ©rabilitÃ©s diminue.
7. DÃ©ployer sur une staging et vÃ©rifier le comportement.

Notes opÃ©rationnelles et risques
--------------------------------
- Certaines corrections nÃ©cessitent des mises Ã  jour majeures (breaking changes). Testez en isolation.
- Si `@capacitor/*` est utilisÃ© pour des builds mobiles, coordonner les versions Capacitor avec la plateforme mobile (Android/iOS).
- `jspdf` Ã©tant utilisÃ© pour gÃ©nÃ©ration PDF/QR/tickets, vÃ©rifiez la compatibilitÃ© API aprÃ¨s mise Ã  jour majeure.
- Validez que `devDependencies` mis Ã  jour (eslint, glob) ne brisent pas le CI.

Annexes
-------
- Source des alerts (extraits `npm audit`):
  - jspdf advisories: https://github.com/advisories/GHSA-w532-jxjh-hjhj, https://github.com/advisories/GHSA-8mvj-3j78-4qmw, https://github.com/advisories/GHSA-f8cm-6447-x5h2
  - dompurify advisory: https://github.com/advisories/GHSA-vhxf-7vqr-mrjg
  - glob advisory: https://github.com/advisories/GHSA-5j98-mcp5-4vw2
  - tar advisory: https://github.com/advisories/GHSA-8qq5-rm4j-mr97

---

Fichier gÃ©nÃ©rÃ© automatiquement â€” pour corrections automatiques ou application manuelle, demandez et je peux appliquer les mises Ã  jour sÃ»res et re-tester `npm audit`.

---

## CHANGELOG.md

# Changelog

Toutes les Ã©volutions notables du projet sont documentÃ©es ici.

## [2026-03-30] - Module Bons de voyage & report de billet

### AjoutÃ©
- Module admin **Bons de voyage** :
  - page liste : `/admin/travel-vouchers`
  - page crÃ©ation : `/admin/travel-vouchers/create`
  - API admin : `GET/POST /api/admin/travel-vouchers`
- Menu admin : entrÃ©e **Bons de voyage** dans la sidebar.
- Action **Dupliquer** sur la liste des bons pour prÃ©remplir le formulaire de crÃ©ation.
- Action **Reporter** dans `/admin/bookings` :
  - gÃ©nÃ¨re un bon de voyage liÃ© au billet,
  - annule automatiquement le billet initial avec motif.
- Colonne **Bon de voyage** dans la liste des rÃ©servations admin (`/admin/bookings`) :
  - affiche le code et le statut du bon liÃ©, sinon `â€”`.
- Script utilitaire de test : `scripts/create-test-bookings.ts`.
- Module de **frais de service / frais administratif** configurable :
  - configuration dans `/admin/settings`,
  - clÃ©s de paramÃ¨tres: `serviceFeeEnabled`, `serviceFeeMode`, `serviceFeeValue`,
  - calcul appliquÃ© automatiquement lors de la crÃ©ation de rÃ©servation (`POST /api/bookings`).
- Module **classement des compagnies** :
  - endpoint classement: `GET /api/companies/ranking`,
  - endpoint notation: `POST /api/companies/reviews`,
  - page publique: `/companies/ranking` (lecture seule),
  - notation dÃ©placÃ©e dans l'espace client: `/dashboard/reviews`,
  - badge automatique **RecommandÃ©e** selon rÃ¨gles mÃ©tier (moyenne + nombre dâ€™avis).
  - modÃ©ration admin des avis: `/admin/companies/reviews` + API `GET/PATCH /api/admin/companies/reviews`.
- Module **notifications multi-canal** :
  - API admin: `GET/POST /api/admin/notifications`,
  - API client in-app: `GET/PATCH /api/app-notifications`,
  - pages admin: `/admin/notifications` et `/admin/notifications/dashboard`,
  - page client: `/dashboard/notifications`,
  - canaux supportÃ©s: SMS, WhatsApp, Email, Notification app,
  - journalisation des envois par campagne (`notification_campaigns`, `notification_logs`).
- IntÃ©gration **Brevo** (optionnelle) pour email et SMS transactionnels (`BREVO_*` dans `.env` ou page `/admin/notifications/brevo`).
- Module **Support client** : hub `/support`, assistance FAQ, lien WhatsApp configurable, plaintes (`SupportComplaint`) avec API `POST/GET /api/support/complaints`, admin `/admin/support` et paramÃ¨tres `/admin/support/settings`.

### ModifiÃ©
- Tableau de bord admin : indicateurs **ventes** (7j / 30j), **revenus** encaissÃ©s (7j / 30j), **taux de remplissage** (trajets partis sur 30j), **performance partenaires** (compagnies, top CA sur 30j).
- **Vue globale des modules** sur `/admin` : compteurs et liens rapides par domaine (exploitation, rÃ©seau, commercial, clients, communication, publicitÃ©).
- Script `dev` dans `package.json` :
  - passe de `next dev` Ã  `next dev --webpack` pour contourner le crash Turbopack observÃ© localement.

### Documentation
- `README.md` mis Ã  jour avec :
  - description du flux de report de billet,
  - vÃ©rification rapide du workflow,
  - commande de gÃ©nÃ©ration des rÃ©servations de test.

---

## DEPLOYMENT_VPS.md

# ðŸš€ Guide de DÃ©ploiement VPS - Aigle Royale

**Date**: 4 FÃ©vrier 2026  
**Application**: Plateforme de rÃ©servation de bus Next.js 16

---

## ðŸ“‹ PrÃ©requis

### Serveur VPS RecommandÃ©
- **OS**: Ubuntu 22.04 LTS ou Debian 12
- **RAM**: Minimum 2 GB (4 GB recommandÃ©)
- **CPU**: 2 vCores minimum
- **Stockage**: 20 GB SSD minimum
- **AccÃ¨s**: SSH avec clÃ© publique
- **Domaine**: ConfigurÃ© et pointant vers le VPS

### AccÃ¨s Requis
```bash
# Connexion SSH
ssh root@votre-vps-ip

# Ou avec utilisateur non-root
ssh utilisateur@votre-vps-ip

# Domaine configurÃ©
Domaine: travelia.afrika-connect.io
```

---

## ðŸ”§ Ã‰tape 1: PrÃ©paration du Serveur

### 1.1 Mise Ã  jour du systÃ¨me
```bash
# Mise Ã  jour des paquets
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

# VÃ©rifier le statut
sudo ufw status
```

### 1.3 CrÃ©er un utilisateur dÃ©diÃ© (recommandÃ©)
```bash
# CrÃ©er l'utilisateur 'aigle' (ou autre nom)
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

## ðŸ“¦ Ã‰tape 2: Installation de Node.js

### 2.1 Installation via NodeSource
```bash
# Installer Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# VÃ©rifier l'installation
node --version  # Devrait afficher v20.x.x
npm --version   # Devrait afficher 10.x.x

# Installer pnpm (optionnel, plus rapide que npm)
sudo npm install -g pnpm pm2
```

---

## ðŸ—„ï¸ Ã‰tape 3: Installation de PostgreSQL

### 3.1 Installation
```bash
# Installer PostgreSQL 15
sudo apt install -y postgresql postgresql-contrib

# DÃ©marrer et activer PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# VÃ©rifier le statut
sudo systemctl status postgresql
```

### 3.2 Configuration de la base de donnÃ©es
```bash
# Se connecter Ã  PostgreSQL
sudo -u postgres psql

# Dans le shell PostgreSQL, exÃ©cuter:
```

```sql
-- CrÃ©er la base de donnÃ©es
CREATE DATABASE aigle_royale;

-- CrÃ©er un utilisateur dÃ©diÃ©
CREATE USER aigle_user WITH PASSWORD 'VotreMotDePasseTresFort!2026';

-- Donner tous les droits sur la base
GRANT ALL PRIVILEGES ON DATABASE aigle_royale TO aigle_user;

-- PostgreSQL 15+: donner les permissions sur le schÃ©ma
\c aigle_royale
GRANT ALL ON SCHEMA public TO aigle_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO aigle_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO aigle_user;

-- Sortir
\q
```

### 3.3 Configuration de l'accÃ¨s distant (si nÃ©cessaire)
```bash
# Ã‰diter pg_hba.conf
sudo nano /etc/postgresql/15/main/pg_hba.conf

# Ajouter cette ligne pour l'accÃ¨s local (dÃ©jÃ  prÃ©sente normalement):
# local   all             all                                     md5

# RedÃ©marrer PostgreSQL
sudo systemctl restart postgresql
```

---

## ðŸŒ Ã‰tape 4: Installation de Nginx

### 4.1 Installation
```bash
# Installer Nginx
sudo apt install -y nginx

# DÃ©marrer et activer Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# VÃ©rifier le statut
sudo systemctl status nginx
```

### 4.2 Configuration Nginx pour Next.js
```bash
# CrÃ©er la configuration du site
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
# CrÃ©er le lien symbolique
sudo ln -s /etc/nginx/sites-available/aigle-royale /etc/nginx/sites-enabled/

# DÃ©sactiver le site par dÃ©faut (optionnel)
sudo rm /etc/nginx/sites-enabled/default

# Tester la configuration
sudo nginx -t

# Recharger Nginx
sudo systemctl reload nginx
```

---

## ðŸ” Ã‰tape 5: SSL avec Let's Encrypt

### 5.1 Installation de Certbot
```bash
# Installer Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtenir le certificat SSL
sudo certbot --nginx -d travelia.afrika-connect.io

# Suivre les instructions interactives:
# - Entrer votre email
# - Accepter les conditions
# - Choisir de rediriger HTTP vers HTTPS (recommandÃ©)
```

### 5.2 Renouvellement automatique
```bash
# Tester le renouvellement
sudo certbot renew --dry-run

# Certbot installe automatiquement un cron job pour le renouvellement
# VÃ©rifier:
sudo systemctl status certbot.timer
```

---

## ðŸ“ Ã‰tape 6: DÃ©ploiement de l'Application

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

### 6.2 CrÃ©er le fichier .env
```bash
# CrÃ©er le fichier .env
nano .env
```

Copier cette configuration (adapter les valeurs):

```env
# Base de donnÃ©es PostgreSQL
DATABASE_URL="postgresql://aigle_user:VotreMotDePasseTresFort!2026@localhost:5432/aigle_royale?schema=public"

# NextAuth Configuration
NEXTAUTH_URL="https://votre-domaine.com"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# IMPORTANT: GÃ©nÃ©rer un secret fort pour NEXTAUTH_SECRET
# ExÃ©cuter: openssl rand -base64 32
# Et remplacer la valeur ci-dessus

# CRON Secret (protection des endpoints planifiÃ©s)
CRON_SECRET="$(openssl rand -base64 32)"

# Devise (conversion FC -> USD)
NEXT_PUBLIC_USD_FC_RATE=600
NEXT_PUBLIC_WIFI_PASS_PRICE_FC=1000
NEXT_PUBLIC_EXTRA_BAGGAGE_PIECE_PRICE_FC=1000
NEXT_PUBLIC_EXTRA_BAGGAGE_OVERWEIGHT_PRICE_FC_PER_KG=200

# Configuration Production
NODE_ENV=production

# DÃ©sactiver les comptes dÃ©mo en production
DEMO_SEED=false
ADMIN_PASSWORD=""

# APIs de paiement (Ã  configurer)
MOBILE_MONEY_API_KEY="votre_cle_api_mobile_money"
CARD_PAYMENT_API_KEY="votre_cle_api_carte"

# Email (SendGrid, Mailgun, etc.)
EMAIL_PROVIDER_API_KEY="votre_cle_api_email"
EMAIL_FROM="noreply@votre-domaine.com"

# SMS (Twilio, etc.)
SMS_PROVIDER_API_KEY="votre_cle_api_sms"
SMS_FROM="+225XXXXXXXXXX"
```

### 6.3 GÃ©nÃ©rer les secrets
```bash
# GÃ©nÃ©rer NEXTAUTH_SECRET
echo "NEXTAUTH_SECRET=\"$(openssl rand -base64 32)\""

# GÃ©nÃ©rer CRON_SECRET
echo "CRON_SECRET=\"$(openssl rand -base64 32)\""

# Copier ces valeurs dans votre .env
```

### 6.4 Installation des dÃ©pendances
```bash
# Installer les dÃ©pendances
npm install --production=false

# Ou avec pnpm (plus rapide)
pnpm install
```

### 6.5 Configuration Prisma et migration
```bash
# GÃ©nÃ©rer le client Prisma
npm run db:generate

# Appliquer les migrations
npm run db:push

# OU utiliser les migrations (recommandÃ© pour production)
npx prisma migrate deploy

# CrÃ©er un administrateur (optionnel)
npx tsx scripts/create-admin.ts
```

### 6.6 Build de l'application
```bash
# Build Next.js pour production
npm run build

# Le build crÃ©e le dossier .next/
```

---

## ðŸ”„ Ã‰tape 7: Configuration PM2 (Process Manager)

### 7.1 CrÃ©er le fichier ecosystem
```bash
# CrÃ©er ecosystem.config.js
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

### 7.2 DÃ©marrer l'application avec PM2
```bash
# CrÃ©er le dossier logs
mkdir -p logs

# DÃ©marrer l'application
pm2 start ecosystem.config.js

# Sauvegarder la configuration PM2
pm2 save

# Configurer PM2 pour dÃ©marrer au boot
pm2 startup

# ExÃ©cuter la commande affichÃ©e (ex: sudo env PATH=$PATH:/usr/bin...)

# VÃ©rifier le statut
pm2 status
pm2 logs aigle-royale

# Commandes utiles:
# pm2 restart aigle-royale    # RedÃ©marrer
# pm2 stop aigle-royale       # ArrÃªter
# pm2 reload aigle-royale     # Rechargement Ã  chaud
# pm2 monit                   # Monitoring en temps rÃ©el
```

---

## â° Ã‰tape 8: Configuration des CRON Jobs

### 8.1 CRON pour annulation des rÃ©servations expirÃ©es

L'application utilise Vercel Cron, mais sur VPS nous devons configurer un CRON systÃ¨me:

```bash
# Ã‰diter le crontab
crontab -e
```

Ajouter cette ligne:

```bash
# Annuler les rÃ©servations expirÃ©es toutes les 15 minutes
*/15 * * * * curl -H "Authorization: Bearer $(grep CRON_SECRET ~/.aigle-royale.env | cut -d'=' -f2)" https://travelia.afrika-connect.io/api/cron/cancel-expired-bookings >> /home/aigle/aigle-royale/logs/cron.log 2>&1
```

OU utiliser un script dÃ©diÃ©:

```bash
# CrÃ©er le script cron
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
# Rendre exÃ©cutable
chmod +x ~/cron-cancel-bookings.sh

# Ajouter au crontab
crontab -e
# */15 * * * * /home/aigle/cron-cancel-bookings.sh
```

---

## ðŸ” Ã‰tape 9: Monitoring et Logs

### 9.1 Logs de l'application
```bash
# Logs PM2
pm2 logs aigle-royale

# Logs en temps rÃ©el
pm2 logs aigle-royale --lines 100

# Logs Nginx
sudo tail -f /var/log/nginx/aigle-royale-access.log
sudo tail -f /var/log/nginx/aigle-royale-error.log
```

### 9.2 Monitoring systÃ¨me
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
# CrÃ©er la config logrotate
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

## ðŸ”„ Ã‰tape 10: Script de DÃ©ploiement Automatique

### 10.1 CrÃ©er un script de dÃ©ploiement
```bash
nano ~/deploy.sh
```

Contenu:

```bash
#!/bin/bash

echo "ðŸš€ DÃ©ploiement Aigle Royale..."

# Aller dans le dossier du projet
cd ~/aigle-royale

# Sauvegarder la version actuelle
echo "ðŸ“¦ Sauvegarde de la version actuelle..."
pm2 save

# RÃ©cupÃ©rer les derniÃ¨res modifications
echo "â¬‡ï¸ RÃ©cupÃ©ration du code..."
git pull origin main

# Installer/Mettre Ã  jour les dÃ©pendances
echo "ðŸ“¦ Installation des dÃ©pendances..."
npm install --production=false

# GÃ©nÃ©rer le client Prisma
echo "ðŸ”¨ GÃ©nÃ©ration du client Prisma..."
npm run db:generate

# Appliquer les migrations
echo "ðŸ—„ï¸ Migrations de la base de donnÃ©es..."
npx prisma migrate deploy

# Build de l'application
echo "ðŸ—ï¸ Build de l'application..."
npm run build

# RedÃ©marrer l'application (rechargement Ã  chaud)
echo "ðŸ”„ RedÃ©marrage de l'application..."
pm2 reload ecosystem.config.js

# VÃ©rifier le statut
echo "âœ… VÃ©rification du statut..."
pm2 status

echo "ðŸŽ‰ DÃ©ploiement terminÃ©!"
echo "ðŸ“Š Logs disponibles avec: pm2 logs aigle-royale"
```

```bash
# Rendre exÃ©cutable
chmod +x ~/deploy.sh

# Utiliser:
~/deploy.sh
```

---

## ðŸ” Ã‰tape 11: SÃ©curitÃ© Additionnelle

### 11.1 Configuration fail2ban
```bash
# CrÃ©er une jail pour Nginx
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
# RedÃ©marrer fail2ban
sudo systemctl restart fail2ban

# VÃ©rifier le statut
sudo fail2ban-client status
```

### 11.2 DÃ©sactiver root login SSH
```bash
sudo nano /etc/ssh/sshd_config

# Modifier/Ajouter ces lignes:
# PermitRootLogin no
# PasswordAuthentication no  # Si vous utilisez des clÃ©s SSH

# RedÃ©marrer SSH
sudo systemctl restart sshd
```

### 11.3 Configuration des limites de rate limiting

Installer et configurer nginx-limit-req (dÃ©jÃ  inclus dans Nginx):

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

## ðŸ“Š Ã‰tape 12: Sauvegarde de la Base de DonnÃ©es

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

# CrÃ©er le dossier de backup
mkdir -p $BACKUP_DIR

# Effectuer le backup
PGPASSWORD='VotreMotDePasseTresFort!2026' pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_FILE

# Compresser le backup
gzip $BACKUP_FILE

# Garder seulement les 30 derniers jours
find $BACKUP_DIR -name "aigle_royale_*.sql.gz" -mtime +30 -delete

echo "âœ… Backup crÃ©Ã©: ${BACKUP_FILE}.gz"
```

```bash
# Rendre exÃ©cutable
chmod +x ~/backup-db.sh

# Ajouter au crontab (tous les jours Ã  2h du matin)
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

## âœ… Checklist de VÃ©rification Post-DÃ©ploiement

### SystÃ¨me
- [ ] VPS accessible via SSH
- [ ] Pare-feu (ufw) configurÃ© et actif
- [ ] Fail2ban installÃ© et actif
- [ ] Utilisateur non-root crÃ©Ã©

### Services
- [ ] PostgreSQL installÃ© et dÃ©marrÃ©
- [ ] Base de donnÃ©es crÃ©Ã©e
- [ ] Nginx installÃ© et configurÃ©
- [ ] SSL/HTTPS actif (Let's Encrypt)
- [ ] PM2 configurÃ© pour dÃ©marrage automatique

### Application
- [ ] Code dÃ©ployÃ© (git clone ou SCP)
- [ ] Fichier `.env` crÃ©Ã© avec secrets forts
- [ ] DÃ©pendances installÃ©es
- [ ] Client Prisma gÃ©nÃ©rÃ©
- [ ] Migrations appliquÃ©es
- [ ] Build Next.js rÃ©ussi
- [ ] Application dÃ©marrÃ©e avec PM2

### SÃ©curitÃ©
- [ ] DEMO_SEED=false en production
- [ ] Secrets gÃ©nÃ©rÃ©s (NEXTAUTH_SECRET, CRON_SECRET)
- [ ] Rate limiting configurÃ©
- [ ] HTTPS uniquement (redirect HTTP)
- [ ] Headers de sÃ©curitÃ© configurÃ©s

### Monitoring
- [ ] Logs accessibles (PM2, Nginx)
- [ ] CRON jobs configurÃ©s
- [ ] Backups automatiques configurÃ©s
- [ ] Monitoring systÃ¨me actif

### Tests
- [ ] Site accessible via HTTPS
- [ ] Login administrateur fonctionne
- [ ] RÃ©servation de test rÃ©ussie
- [ ] API endpoints rÃ©pondent
- [ ] Uploads de fichiers fonctionnent

---

## ðŸ”§ DÃ©pannage

### L'application ne dÃ©marre pas
```bash
# VÃ©rifier les logs PM2
pm2 logs aigle-royale --lines 100

# VÃ©rifier les erreurs
pm2 describe aigle-royale

# RedÃ©marrer en mode debug
pm2 delete aigle-royale
NODE_ENV=production PORT=3000 npm start
```

### Erreur de connexion base de donnÃ©es
```bash
# VÃ©rifier PostgreSQL
sudo systemctl status postgresql

# Tester la connexion
psql -U aigle_user -d aigle_royale -h localhost

# VÃ©rifier DATABASE_URL dans .env
cat .env | grep DATABASE_URL
```

### Erreur 502 Bad Gateway (Nginx)
```bash
# VÃ©rifier que l'app tourne
pm2 status

# VÃ©rifier les logs Nginx
sudo tail -f /var/log/nginx/aigle-royale-error.log

# VÃ©rifier que le port 3000 Ã©coute
sudo netstat -tulpn | grep 3000
```

### SSL ne fonctionne pas
```bash
# Renouveler le certificat
sudo certbot renew

# VÃ©rifier la configuration Nginx
sudo nginx -t

# VÃ©rifier les logs Certbot
sudo journalctl -u certbot -n 50
```

### Manque de mÃ©moire
```bash
# VÃ©rifier l'utilisation
free -h

# RÃ©duire les instances PM2
pm2 scale aigle-royale 1

# Ou ajouter du swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## ðŸ“š Commandes Utiles

### PM2
```bash
pm2 start ecosystem.config.js      # DÃ©marrer
pm2 stop aigle-royale              # ArrÃªter
pm2 restart aigle-royale           # RedÃ©marrer
pm2 reload aigle-royale            # Rechargement Ã  chaud
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
sudo systemctl restart nginx       # RedÃ©marrer
sudo systemctl status nginx        # Statut
```

### PostgreSQL
```bash
sudo systemctl status postgresql   # Statut
sudo -u postgres psql             # AccÃ©der au shell
```

### Logs
```bash
# PM2
pm2 logs --lines 200

# Nginx
sudo tail -f /var/log/nginx/aigle-royale-access.log
sudo tail -f /var/log/nginx/aigle-royale-error.log

# SystÃ¨me
sudo journalctl -u nginx -f
```

---

## ðŸŽ¯ Optimisations AvancÃ©es (Optionnel)

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
# ... (configuration avancÃ©e)
```

---

## ðŸ“ž Support

En cas de problÃ¨me:
1. VÃ©rifier les logs: `pm2 logs aigle-royale`
2. VÃ©rifier Nginx: `sudo nginx -t`
3. VÃ©rifier la base de donnÃ©es: PostgreSQL logs
4. Consulter la documentation Next.js: https://nextjs.org/docs

---

**FÃ©licitations! Votre application Aigle Royale est maintenant dÃ©ployÃ©e en production! ðŸŽ‰**

---

## DOCUMENTATION_PEDAGOGIQUE_MODULES.md

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
- `NotificationCampaign` + `NotificationLog`: traÃ§abilite communication

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

---

## PRICING_SYSTEM.md

# ðŸ’° SystÃ¨me de Tarification Intelligente - Documentation Technique

## Vue d'ensemble

Le systÃ¨me de tarification intelligente d'Aigle Royale applique automatiquement des rÃ©ductions tarifaires basÃ©es sur l'Ã¢ge et le statut des passagers. Il garantit une tarification Ã©quitable et transparente tout en offrant des avantages aux personnes Ã¢gÃ©es et aux personnes en situation de handicap.

## ðŸ“Š Types de Passagers et RÃ©ductions

| Type | Emoji | Ã‚ge | RÃ©duction | Justificatif | Code |
|------|-------|-----|-----------|--------------|------|
| Adulte | ðŸ‘¨â€ðŸ’¼ | 12-59 ans | 0% | Non | `ADULT` |
| Enfant | ðŸ‘¶ | 2-11 ans | 50% | Non | `CHILD` |
| BÃ©bÃ© | ðŸ¼ | 0-1 an | 80% | Non | `INFANT` |
| Senior | ðŸ‘´ | 60+ ans | 30% | Non | `SENIOR` |
| HandicapÃ© | â™¿ | Tous Ã¢ges | 40% | **Oui** | `DISABLED` |

### RÃ¨gles de Validation

1. **ADULT** : Ã‚ge entre 12 et 59 ans
2. **CHILD** : Ã‚ge entre 2 et 11 ans
3. **INFANT** : Ã‚ge entre 0 et 1 an
4. **SENIOR** : Ã‚ge â‰¥ 60 ans
5. **DISABLED** : Tous Ã¢ges, justificatif mÃ©dical requis

## ðŸ—„ï¸ Architecture de Base de DonnÃ©es

### Table `PassengerPricing`

```sql
CREATE TABLE passenger_pricing (
  id TEXT PRIMARY KEY,
  passengerType TEXT UNIQUE NOT NULL,  -- ADULT, CHILD, INFANT, SENIOR, DISABLED
  discountPercent REAL DEFAULT 0,      -- Pourcentage de rÃ©duction (0-100)
  minAge INTEGER,                       -- Ã‚ge minimum (nullable)
  maxAge INTEGER,                       -- Ã‚ge maximum (nullable)
  isActive BOOLEAN DEFAULT 1,           -- Tarif actif ou non
  description TEXT,                     -- Description du tarif
  requiresDisabilityProof BOOLEAN DEFAULT 0,  -- Justificatif requis
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Champs ajoutÃ©s au modÃ¨le `Booking`

```sql
ALTER TABLE bookings ADD COLUMN passengerType TEXT DEFAULT 'ADULT';
ALTER TABLE bookings ADD COLUMN passengerAge INTEGER;
ALTER TABLE bookings ADD COLUMN hasDisability BOOLEAN DEFAULT 0;
ALTER TABLE bookings ADD COLUMN disabilityProofUrl TEXT;
ALTER TABLE bookings ADD COLUMN basePrice REAL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN discountAmount REAL DEFAULT 0;
-- totalPrice existe dÃ©jÃ  et contient : basePrice - discountAmount + extrasTotal
```

## ðŸ”§ Fonctions Utilitaires (`lib/passenger-pricing.ts`)

### 1. `getPassengerTypeByAge(age: number)`

DÃ©termine automatiquement le type de passager selon l'Ã¢ge.

```typescript
getPassengerTypeByAge(5)   // â†’ 'CHILD'
getPassengerTypeByAge(65)  // â†’ 'SENIOR'
getPassengerTypeByAge(0)   // â†’ 'INFANT'
getPassengerTypeByAge(30)  // â†’ 'ADULT'
```

### 2. `validateAgeForPassengerType(age, type, rule)`

VÃ©rifie la cohÃ©rence entre l'Ã¢ge et le type de passager sÃ©lectionnÃ©.

```typescript
validateAgeForPassengerType(5, 'ADULT', adultRule)
// â†’ { isValid: false, error: "L'Ã¢ge minimum pour le tarif ADULT est 12 ans" }

validateAgeForPassengerType(65, 'SENIOR', seniorRule)
// â†’ { isValid: true }
```

### 3. `calculatePassengerPrice(basePrice, passengerPricing)`

Calcule le prix final avec rÃ©duction.

```typescript
calculatePassengerPrice(10000, childPricing)
// â†’ { basePrice: 10000, discountAmount: 5000, finalPrice: 5000 }
```

### 4. `getSuggestedPassengerType(age, hasDisability)`

SuggÃ¨re le meilleur tarif en fonction de l'Ã¢ge et du statut.

```typescript
getSuggestedPassengerType(65, false)
// â†’ { type: 'SENIOR', reason: 'Tarif senior (60+ ans)', discount: 30 }

getSuggestedPassengerType(30, true)
// â†’ { type: 'DISABLED', reason: 'Tarif rÃ©duit pour personne en situation de handicap', discount: 40 }
```

### 5. `formatDiscountInfo(discountPercent, basePrice)`

Formate les informations de rÃ©duction pour l'affichage.

```typescript
formatDiscountInfo(50, 10000)
// â†’ "RÃ©duction de 50% (-5000 FC) = 5000 FC"
```

## ðŸŽ¨ Interface Utilisateur

### Formulaire de RÃ©servation (`components/client/BookingForm.tsx`)

**Champs ajoutÃ©s :**

1. **Type de passager** (select)
   - Options : Adulte, Enfant, BÃ©bÃ©, Senior, HandicapÃ©
   - Avec emojis et description des rÃ©ductions

2. **Ã‚ge du passager** (number input)
   - Obligatoire
   - Min: 0, Max: 120
   - Validation en temps rÃ©el

3. **Confirmation handicap** (checkbox conditionnelle)
   - ApparaÃ®t uniquement si type = DISABLED
   - Avertissement sur le justificatif requis
   - Explique la vÃ©rification Ã  l'embarquement

**Exemple de rendu :**

```tsx
<select id="passengerType">
  <option value="ADULT">ðŸ‘¨â€ðŸ’¼ Adulte (12-59 ans) - Prix plein</option>
  <option value="CHILD">ðŸ‘¶ Enfant (2-11 ans) - 50% de rÃ©duction</option>
  <option value="INFANT">ðŸ¼ BÃ©bÃ© (0-1 an) - 80% de rÃ©duction</option>
  <option value="SENIOR">ðŸ‘´ Senior (60+ ans) - 30% de rÃ©duction</option>
  <option value="DISABLED">â™¿ HandicapÃ© - 40% de rÃ©duction</option>
</select>

<input type="number" id="passengerAge" min="0" max="120" required />

{passengerType === 'DISABLED' && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
    <input type="checkbox" id="hasDisability" />
    <label>Je confirme que le passager est en situation de handicap</label>
    <p>ðŸ“„ Un justificatif mÃ©dical sera demandÃ© lors de l'embarquement.</p>
  </div>
)}
```

## ðŸ” Interface Admin (`app/admin/passenger-pricing/page.tsx`)

### FonctionnalitÃ©s

1. **Visualisation des tarifs**
   - Cartes pour chaque type de passager
   - Affichage du pourcentage de rÃ©duction
   - Tranche d'Ã¢ge applicable
   - Description du tarif
   - Badge "Justificatif requis" pour DISABLED

2. **Modification des tarifs**
   - Formulaire d'Ã©dition inline
   - Champs : discountPercent, minAge, maxAge, description, isActive
   - Validation cÃ´tÃ© client et serveur
   - Boutons Annuler/Enregistrer

3. **Guide d'utilisation**
   - Section informative sur le fonctionnement
   - Exemples de rÃ©ductions
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

## ðŸš€ Flux de RÃ©servation

### 1. SÃ©lection du type et Ã¢ge

```mermaid
User selects type â†’ System validates age â†’ Shows discount info
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

### 3. Stockage et traÃ§abilitÃ©

Chaque rÃ©servation conserve :
- `basePrice` : Prix original du trajet
- `discountAmount` : Montant de la rÃ©duction appliquÃ©e
- `totalPrice` : Prix final payÃ© par le client
- `passengerType` : Type de passager sÃ©lectionnÃ©
- `passengerAge` : Ã‚ge du passager au moment de la rÃ©servation

## ðŸ“ˆ Cas d'Usage

### Exemple 1 : Enfant de 8 ans

```
Trajet : Abidjan â†’ Yamoussoukro
Prix de base : 10,000 FC
Type sÃ©lectionnÃ© : CHILD
Ã‚ge saisi : 8

Calcul :
- basePrice = 10,000 FC
- discountPercent = 50%
- discountAmount = 5,000 FC
- totalPrice = 5,000 FC

âœ… Validation : OK (8 ans est dans la tranche 2-11 ans)
```

### Exemple 2 : Senior de 65 ans

```
Trajet : BouakÃ© â†’ San Pedro
Prix de base : 15,000 FC
Type sÃ©lectionnÃ© : SENIOR
Ã‚ge saisi : 65

Calcul :
- basePrice = 15,000 FC
- discountPercent = 30%
- discountAmount = 4,500 FC
- totalPrice = 10,500 FC

âœ… Validation : OK (65 ans â‰¥ 60 ans)
```

### Exemple 3 : Personne handicapÃ©e de 35 ans

```
Trajet : Abidjan â†’ BouakÃ©
Prix de base : 8,000 FC
Type sÃ©lectionnÃ© : DISABLED
Ã‚ge saisi : 35
hasDisability : true

Calcul :
- basePrice = 8,000 FC
- discountPercent = 40%
- discountAmount = 3,200 FC
- totalPrice = 4,800 FC

âš ï¸ Justificatif requis Ã  l'embarquement
âœ… Validation : OK (DISABLED accepte tous les Ã¢ges)
```

## ðŸ›¡ï¸ SÃ©curitÃ© et Validation

### Validations cÃ´tÃ© client
- Ã‚ge obligatoire (champ required)
- Ã‚ge entre 0 et 120 ans
- Type de passager obligatoire
- Checkbox de confirmation pour DISABLED

### Validations cÃ´tÃ© serveur
- VÃ©rification de l'existence de la rÃ¨gle de tarification
- Validation de la cohÃ©rence Ã¢ge/type
- Calcul sÃ©curisÃ© des rÃ©ductions (pas de manipulation possible)
- VÃ©rification des permissions admin pour modification des tarifs

### Authentification
- Seuls les ADMINISTRATOR peuvent modifier les tarifs
- VÃ©rification via `isAdminRole()` dans les endpoints admin
- Protection CSRF intÃ©grÃ©e dans NextAuth

## ðŸ“ Migration et Initialisation

### Migration Prisma

```bash
npx prisma migrate dev --name add_senior_disabled_pricing
```

### Initialisation des donnÃ©es

```bash
npx tsx prisma/seed-senior-disabled.ts
```

CrÃ©e les 5 tarifs par dÃ©faut :
- ADULT : 0% (12-59 ans)
- CHILD : 50% (2-11 ans)
- INFANT : 80% (0-1 an)
- SENIOR : 30% (60+ ans)
- DISABLED : 40% (tous Ã¢ges, justificatif requis)

## ðŸŽ¯ AmÃ©liorations Futures

### Court terme
- [ ] Upload de justificatif de handicap dans le formulaire
- [ ] VÃ©rification automatique de la validitÃ© du justificatif
- [ ] Notification email avec les dÃ©tails de rÃ©duction

### Moyen terme
- [ ] Rapports statistiques sur l'utilisation des tarifs rÃ©duits
- [ ] Alertes admin si incohÃ©rence Ã¢ge/type dÃ©tectÃ©e
- [ ] Export des donnÃ©es de rÃ©duction pour comptabilitÃ©

### Long terme
- [ ] Tarifs dynamiques selon la saison
- [ ] RÃ©ductions cumulables (ex: Senior + Carte de fidÃ©litÃ©)
- [ ] Programme de fidÃ©litÃ© avec bonus selon le type de passager

## ðŸ¤ Support

Pour toute question ou problÃ¨me concernant le systÃ¨me de tarification :
- Documentation technique : `PRICING_SYSTEM.md` (ce fichier)
- API : `API.md` - Section "Tarification des Passagers"
- Code source : 
  - Backend : `app/api/bookings/route.ts`
  - Frontend : `components/client/BookingForm.tsx`
  - Admin : `app/admin/passenger-pricing/page.tsx`
  - Utilitaires : `lib/passenger-pricing.ts`

---

**DerniÃ¨re mise Ã  jour** : 28 janvier 2026  
**Version** : 1.0.0  
**Auteur** : Ã‰quipe Technique Aigle Royale

---

## QUICK_START.md

# ðŸš€ Guide de DÃ©marrage Rapide

## Installation en 5 minutes

### 1. PrÃ©requis
- Node.js 18+ installÃ©
- PostgreSQL installÃ© et en cours d'exÃ©cution

### 2. Configuration rapide

```bash
# Cloner/ouvrir le projet
cd "Aigle royale"

# Installer les dÃ©pendances
npm install

# CrÃ©er le fichier .env (copiez depuis env.example)
# Windows PowerShell (Ã  la racine du projet) :
Copy-Item env.example .env
# Puis Ã©ditez .env et configurez DATABASE_URL avec vos credentials PostgreSQL

# Configurer la base de donnÃ©es
npm run db:generate
npm run db:push
npm run db:seed

# Lancer le serveur
npm 
```

### 3. AccÃ©der Ã  l'application

Ouvrez [http://localhost:3000](http://localhost:3000)

### 4. Comptes de test

AprÃ¨s avoir exÃ©cutÃ© `npm run db:seed`, vous pouvez vous connecter avec :

**Administrateur:**
- Email: `admin@aigleroyale.com`
- Mot de passe: `admin123`

**Agent DÃ©mo:**
- Email: `agent@demo.com`
- Mot de passe: `demo123`

**Super Agent (Agence) DÃ©mo:**
- Email: `superagent@demo.com`
- Mot de passe: `demo123`

### 5. Tests rapides

#### Test 1 : CrÃ©er un compte client
1. Aller sur `/auth/register`
2. CrÃ©er un compte
3. Se connecter
4. âœ… VÃ©rifier : Redirection vers `/dashboard`

#### Test 2 : Rechercher et rÃ©server un trajet
1. Sur la page d'accueil, rechercher un trajet :
   - DÃ©part: `Abidjan`
   - ArrivÃ©e: `Yamoussoukro`
   - Date: Demain
   - **Passagers: 2 Adultes, 1 Enfant** (teste le paiement groupÃ©)
2. Cliquer sur "RÃ©server" pour un trajet
3. **SÃ©lectionner 3 siÃ¨ges** (un pour chaque passager)
4. Remplir les informations pour chaque passager
5. Choisir "Paiement en agence"
6. âœ… VÃ©rifier : **Page de paiement groupÃ©** affiche le rÃ©capitulatif des 3 billets
7. âœ… VÃ©rifier : **Un seul montant total** pour tous les billets
8. âœ… VÃ©rifier : Billets gÃ©nÃ©rÃ©s avec QR codes individuels

#### Test 3 : Tester le back-office admin
1. Se connecter en tant qu'admin
2. Aller sur `/admin`
3. âœ… VÃ©rifier : Affichage des statistiques

### 6. Scripts de test automatisÃ©s

```bash
# Test de configuration complÃ¨te
npm run test:setup

# Test des API endpoints (serveur doit Ãªtre lancÃ©)
npm run test:api
```

### 7. Inspecter la base de donnÃ©es

```bash
# Ouvrir Prisma Studio
npm run db:studio
```

Cela ouvrira une interface graphique pour voir et modifier les donnÃ©es.

---

## ðŸ› DÃ©pannage

### Erreur : "Cannot connect to database"
- VÃ©rifiez que PostgreSQL est en cours d'exÃ©cution
- VÃ©rifiez que `DATABASE_URL` dans `.env` est correct

### Erreur : "Module not found"
- ExÃ©cutez `npm install` Ã  nouveau
- VÃ©rifiez que `node_modules` existe

### Erreur : "Port 3000 already in use"
- ArrÃªtez l'autre processus utilisant le port 3000
- Ou changez le port dans `package.json` : `"dev": "next dev -p 3001"`

### Les trajets ne s'affichent pas
- VÃ©rifiez que `npm run db:seed` a Ã©tÃ© exÃ©cutÃ©
- Les trajets sont crÃ©Ã©s pour "demain", ajustez la date de recherche

---

## ðŸ“š Documentation complÃ¨te

- **Installation dÃ©taillÃ©e** : Voir `SETUP.md`
- **Guide de test complet** : Voir `TESTING.md`
- **Documentation API** : Voir `API.md`

---

## âœ… Checklist de vÃ©rification

- [ ] PostgreSQL est installÃ© et en cours d'exÃ©cution
- [ ] Le fichier `.env` est configurÃ©
- [ ] `npm install` s'est exÃ©cutÃ© sans erreur
- [ ] `npm run db:push` a crÃ©Ã© les tables
- [ ] `npm run db:seed` a peuplÃ© la base de donnÃ©es
- [ ] `npm run dev` dÃ©marre sans erreur
- [ ] Le site est accessible sur http://localhost:3000
- [ ] Je peux me connecter avec les comptes de test

---

## ðŸŽ¯ Prochaines Ã©tapes

1. **Personnaliser** : Modifiez les couleurs dans `tailwind.config.ts`
2. **Ajouter des donnÃ©es** : Utilisez Prisma Studio ou crÃ©ez vos propres routes/bus
3. **Configurer les paiements** : Ajoutez les clÃ©s API dans `.env`
4. **DÃ©ployer** : PrÃ©parez le projet pour la production

Bon dÃ©veloppement ! ðŸš€

---

## README.md

# ðŸšŒ Plateforme Aigle Royale - RÃ©servation de Billets de Bus & Gestion de Fret

Plateforme web complÃ¨te pour la rÃ©servation et la vente de billets de bus avec gestion de fret et module publicitaire.

## ðŸš€ FonctionnalitÃ©s

### Module Client
- Recherche de trajets (ville dÃ©part/arrivÃ©e, date)
- **Recherche incluant les arrÃªts intermÃ©diaires**
- **SÃ©lection multiple de passagers** (adultes, enfants, bÃ©bÃ©s, seniors)
- Choix de siÃ¨ge interactif sur plan du bus
- **SÃ©lection du type de passager** (Adulte, Enfant, BÃ©bÃ©, Senior, HandicapÃ©)
- **Tarification automatique selon l'Ã¢ge et le statut**
- **Paiement groupÃ© pour plusieurs billets** (Ã©conomie sur les frais de commission)
- RÃ©servation et paiement (Mobile Money, Carte bancaire, Paiement en agence)
- GÃ©nÃ©ration de billets Ã©lectroniques avec QR code
- Historique des voyages
- Annulation/modification de rÃ©servations

### Module Agents AgrÃ©Ã©s
- Vente de billets pour clients
- Vente de fret (colis)
- Impression ou envoi de billets
- Commission automatique par vente
- Historique des transactions
- Rapports journaliers

### Module Agence MÃ¨re
- Vente directe au guichet
- RÃ©servation pour paiement ultÃ©rieur
- Gestion des clients sans compte
- Impression de billets officiels
- Suivi caisse journaliÃ¨re

### Module Gestion du Fret
- Enregistrement de colis (poids, type, valeur)
- Association colis â†” voyage
- Code de suivi unique
- Statuts : reÃ§u / en transit / livrÃ©
- Tarification automatique

### Module PublicitÃ©
- Vente d'espaces publicitaires (banniÃ¨res homepage, rÃ©sultats, confirmation)
- Gestion des annonceurs
- Statistiques d'impressions & clics
- Facturation annonceurs

### Module Classement des compagnies
- Notation client (1 Ã  5 Ã©toiles + commentaire) depuis l'espace client
- Classement automatique des compagnies (moyenne + volume d'avis)
- Badge **RecommandÃ©e** selon seuil mÃ©tier

### Module Notifications
- Campagnes multi-canal : **SMS**, **WhatsApp**, **Email**, **notification app**
- Module admin d'envoi : `/admin/notifications`
- Dashboard de suivi des envois : `/admin/notifications/dashboard`
- Centre client des notifications in-app : `/dashboard/notifications`
- Journalisation des envois (sent/failed) par canal
- **Brevo (optionnel)** : interface admin `/admin/notifications/brevo` (clÃ© API, expÃ©diteurs, activation email/SMS) ou variables `BREVO_*` dans `.env`. Sans clÃ© ni activation, lâ€™envoi reste simulÃ© (console). Le canal **WhatsApp** nâ€™est pas branchÃ© sur Brevo dans ce code (mock ou autre fournisseur Ã  prÃ©voir).

### Module Support
- Hub public : `/support` â€” **Assistance** (FAQ), **WhatsApp** (lien `wa.me` si numÃ©ro configurÃ©), **Plainte / rÃ©clamation** (formulaire avec rÃ©fÃ©rence `P-â€¦`).
- Administration : `/admin/support` (liste, statut, prioritÃ©, notes internes), `/admin/support/settings` (numÃ©ro WhatsApp + message prÃ©rempli). Variables optionnelles : `SUPPORT_WHATSAPP_NUMBER`, `SUPPORT_WHATSAPP_PREFILL`.

### Back-Office
- Gestion des bus & flotte
- Gestion des trajets & horaires
- **Report de billet avec Ã©mission automatique dâ€™un bon de voyage**
- **Gestion des frais de service / frais administratif (configurable)**
- **Gestion des arrÃªts intermÃ©diaires sur les routes**
- **Gestion des arrÃªts de ville (gares et points d'embarquement)**
- **Gestion de la visibilitÃ© des siÃ¨ges** (cacher/afficher par siÃ¨ge ou par rangÃ©e)
- **NumÃ©rotation alphanumÃ©rique des siÃ¨ges** (A1, B1, C1, etc.)
- **Tarification par type de passager avec rÃ©ductions automatiques**
- **Validation automatique de l'Ã¢ge selon le type de passager**
- Gestion des agences & agents
- Utilisateurs & rÃ´les
- Tableau de bord avec KPI
- Rapports exportables (Excel / PDF)
- **ParamÃ¨tres systÃ¨me configurables** (mÃ©thode de sÃ©lection des siÃ¨ges)

## ðŸ› ï¸ Technologies

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Base de donnÃ©es**: PostgreSQL avec Prisma ORM
- **Authentification**: NextAuth.js
- **Validation**: Zod, React Hook Form

## ðŸ“¦ Installation

1. Cloner le projet
```bash
git clone <repository-url>
cd "Aigle royale"
```

2. Installer les dÃ©pendances
```bash
npm install
```

3. Configurer la base de donnÃ©es
```bash
# CrÃ©er un fichier .env Ã  partir de env.example
# Windows PowerShell :
Copy-Item env.example .env

# Modifier DATABASE_URL dans .env avec vos credentials PostgreSQL

# GÃ©nÃ©rer le client Prisma
npm run db:generate

# CrÃ©er la base de donnÃ©es et appliquer les migrations
npm run db:push
```

4. Lancer le serveur de dÃ©veloppement
```bash
npm run dev
```

5. Ouvrir [http://localhost:3000](http://localhost:3000)

## ðŸ“ Structure du Projet

```
â”œâ”€â”€ app/                    # App Router Next.js
â”‚   â”œâ”€â”€ (auth)/            # Routes d'authentification
â”‚   â”œâ”€â”€ (client)/          # Interface client
â”‚   â”œâ”€â”€ (agent)/           # Interface agent agrÃ©Ã©
â”‚   â”œâ”€â”€ (agency)/          # Interface agence mÃ¨re
â”‚   â”œâ”€â”€ (admin)/           # Back-office
â”‚   â”‚   â”œâ”€â”€ settings/      # Configuration systÃ¨me
â”‚   â”‚   â”œâ”€â”€ buses/         # Gestion des bus
â”‚   â”‚   â”œâ”€â”€ routes/        # Gestion des trajets
â”‚   â”‚   â”‚   â””â”€â”€ [id]/stops/  # Gestion des arrÃªts de route
â”‚   â”‚   â”œâ”€â”€ city-stops/    # Gestion des arrÃªts de ville
â”‚   â”‚   â””â”€â”€ ...
â”‚   â””â”€â”€ api/               # API Routes
â”‚       â”œâ”€â”€ auth/          # Authentification
â”‚       â”œâ”€â”€ bookings/      # RÃ©servations
â”‚       â”œâ”€â”€ admin/         # API admin
â”‚       â”‚   â”œâ”€â”€ settings/  # Gestion des paramÃ¨tres
â”‚       â”‚   â”œâ”€â”€ routes/    # API routes admin
â”‚       â”‚   â”‚   â””â”€â”€ [id]/
â”‚       â”‚   â”‚       â””â”€â”€ stops/  # API arrÃªts de route
â”‚       â”‚   â””â”€â”€ city-stops/  # API arrÃªts de ville
â”‚       â”œâ”€â”€ settings/      # API publique des paramÃ¨tres
â”‚       â””â”€â”€ ...
â”œâ”€â”€ components/            # Composants React rÃ©utilisables
â”‚   â”œâ”€â”€ client/           # Composants client (SeatMap, BookingForm...)
â”‚   â”œâ”€â”€ admin/            # Composants admin
â”‚   â””â”€â”€ ...
â”œâ”€â”€ lib/                   # Utilitaires et configurations
â”œâ”€â”€ prisma/                # SchÃ©ma Prisma
â”‚   â”œâ”€â”€ schema.prisma     # DÃ©finition des modÃ¨les
â”‚   â”œâ”€â”€ seed.ts           # Script de peuplement
â”‚   â””â”€â”€ migrations/       # Migrations de base de donnÃ©es
â””â”€â”€ public/                # Assets statiques
```

## ðŸ” RÃ´les Utilisateurs

- **CLIENT**: Achat de billets et envoi de colis
- **AGENT**: Vente de billets & fret via le systÃ¨me
- **AGENCY_STAFF**: Vente physique centralisÃ©e
- **ADMINISTRATOR**: Supervision globale
- **ACCOUNTANT**: Suivi financier
- **SUPERVISOR**: ContrÃ´le des agences et agents

## ðŸŽ« Report de billet (Admin)

Le back-office admin permet maintenant de **reporter un billet** en un clic depuis la liste des rÃ©servations (`/admin/bookings`) :

- Action **Reporter** sur une rÃ©servation `PENDING` ou `CONFIRMED`
- GÃ©nÃ©ration dâ€™un **bon de voyage** (code `BV-XXXX...`) avec le montant du billet
- Annulation automatique du billet initial avec motif de report
- TraÃ§abilitÃ© dans le module **Bons de voyage** (`/admin/travel-vouchers`)
- Colonne **Bon de voyage** dans `/admin/bookings` (code + statut du bon liÃ©)
- Action **Dupliquer** dans `/admin/travel-vouchers` pour prÃ©remplir la crÃ©ation dâ€™un nouveau bon

Ce mÃ©canisme Ã©vite la perte de valeur pour le client tout en gardant un historique clair cÃ´tÃ© exploitation.

## ðŸ† Classement des compagnies

Le module de classement est disponible via `/companies/ranking` et propose :

- **Consultation publique** : classement des compagnies et badge recommandÃ©e.
- **Note client** : un client peut noter une compagnie (1 Ã  5) et laisser un commentaire depuis `/dashboard/reviews`.
- **ContrÃ´le mÃ©tier** : la note est autorisÃ©e uniquement si le client a un billet `CONFIRMED` ou `COMPLETED` avec la compagnie.
- **Classement** : tri par moyenne dÃ©croissante, puis nombre dâ€™avis.
- **Badge RecommandÃ©e** : attribuÃ© automatiquement selon les rÃ¨gles suivantes :
  - moyenne >= 4.2
  - au moins 3 avis
- **ModÃ©ration admin** : les avis peuvent Ãªtre masquÃ©s/affichÃ©s dans `/admin/companies/reviews` (seuls les avis visibles sont pris en compte dans le classement public).

## ðŸ’¼ Frais de service (Admin)

Le back-office permet de configurer des frais administratifs dans `/admin/settings` :

- Activation / dÃ©sactivation du module
- Mode de calcul :
  - `FIXED` : montant fixe en FC par billet
  - `PERCENT` : pourcentage appliquÃ© au sous-total du billet
- Valeur des frais

RÃ¨gle mÃ©tier appliquÃ©e Ã  la crÃ©ation de rÃ©servation :

- `sous-total billet = (prix aprÃ¨s rÃ©duction passager) + extras bagages`
- `frais de service = fixe ou pourcentage selon le paramÃ¨tre`
- `total billet = sous-total billet + frais de service`

Le calcul est appliquÃ© cÃ´tÃ© serveur au moment de `POST /api/bookings` pour prÃ©server lâ€™intÃ©gritÃ© mÃ©tier.

### VÃ©rification rapide du flux

1. Aller sur `/admin/bookings`
2. Cliquer **Reporter** sur une rÃ©servation `PENDING` ou `CONFIRMED`
3. VÃ©rifier :
   - rÃ©servation initiale en `CANCELLED`
   - code `BV-...` visible dans la colonne **Bon de voyage**
   - bon prÃ©sent dans `/admin/travel-vouchers`

## ðŸ“ Scripts Disponibles

- `npm run dev` - Lancer le serveur de dÃ©veloppement
- `npm run build` - Construire pour la production
- `npm run start` - Lancer le serveur de production
- `npm run db:generate` - GÃ©nÃ©rer le client Prisma
- `npm run db:push` - Pousser les changements vers la DB
- `npm run db:migrate` - CrÃ©er une migration
- `npm run db:seed` - Peupler la base de donnÃ©es avec des donnÃ©es de test
- `npm run db:studio` - Ouvrir Prisma Studio
- `npx tsx scripts/create-test-bookings.ts` - CrÃ©er des rÃ©servations futures de test pour valider le flux de report

## âš™ï¸ ParamÃ¨tres SystÃ¨me Configurables

### MÃ©thode de SÃ©lection des SiÃ¨ges

L'application permet de configurer la mÃ©thode utilisÃ©e pour identifier les siÃ¨ges lors de la rÃ©servation :

- **Par ID unique** (par dÃ©faut) : Utilise l'identifiant unique de chaque siÃ¨ge dans la base de donnÃ©es
- **Par numÃ©ro de siÃ¨ge** : Utilise le numÃ©ro visible du siÃ¨ge (ex: A1, B2, C3...)

**Configuration** : Accessible depuis `/admin/settings` (rÃ©servÃ© aux administrateurs)

**API Endpoints** :
- `GET /api/settings?key=seatSelectionKey` - RÃ©cupÃ©rer le paramÃ¨tre (public)
- `GET /api/admin/settings?key=seatSelectionKey` - RÃ©cupÃ©rer le paramÃ¨tre (admin)
- `POST /api/admin/settings` - Modifier le paramÃ¨tre (admin uniquement)

**ModÃ¨le de donnÃ©es** :
```typescript
model Setting {
  id        String   @id @default(uuid())
  key       String   @unique
  value     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### ArrÃªts IntermÃ©diaires sur les Routes

Le systÃ¨me permet de configurer des arrÃªts intermÃ©diaires sur les routes pour permettre aux passagers d'embarquer ou de descendre dans des villes spÃ©cifiques sans affecter la route principale.

**FonctionnalitÃ©s** :
- **ArrÃªts de ville (CityStop)** : Gares et points d'embarquement dans chaque ville
- **ArrÃªts de route (RouteStop)** : Association d'arrÃªts Ã  des routes spÃ©cifiques
- **RÃ´les d'arrÃªts** : BOARDING (embarquement), ALIGHTING (dÃ©barquement), STOP (les deux)
- **Ordre des arrÃªts** : Organisation sÃ©quentielle des arrÃªts sur la route
- **DisponibilitÃ© par segment** : Gestion des places disponibles entre chaque arrÃªt

**Configuration** :

1. **Gestion des arrÃªts de ville** : `/admin/city-stops`
   - CrÃ©er/modifier/supprimer des arrÃªts de ville
   - Associer Ã  une ville spÃ©cifique
   - DÃ©finir nom et adresse

2. **Gestion des arrÃªts de route** : `/admin/routes/[id]/stops`
   - Ajouter des arrÃªts Ã  une route
   - DÃ©finir le rÃ´le (BOARDING/ALIGHTING/STOP)
   - RÃ©organiser l'ordre des arrÃªts
   - Ajouter des notes pour chaque arrÃªt

3. **Activation par bus** :
   - PropriÃ©tÃ© `allowsIntermediateStops` dans la configuration du bus
   - Seuls les bus autorisÃ©s peuvent Ãªtre affectÃ©s aux routes avec arrÃªts

**API Endpoints** :
- `GET /api/admin/city-stops` - Liste des arrÃªts de ville
- `POST /api/admin/city-stops` - CrÃ©er un arrÃªt de ville
- `PUT /api/admin/city-stops/[id]` - Modifier un arrÃªt
- `DELETE /api/admin/city-stops/[id]` - DÃ©sactiver un arrÃªt
- `GET /api/admin/routes/[id]` - DÃ©tails d'une route
- `GET /api/admin/routes/[id]/stops` - Liste des arrÃªts d'une route
- `POST /api/admin/routes/[id]/stops` - Ajouter un arrÃªt Ã  une route
- `DELETE /api/admin/routes/[id]/stops/[routeStopId]` - Supprimer un arrÃªt de route
- `PATCH /api/admin/routes/[id]/stops/[routeStopId]/reorder` - RÃ©organiser les arrÃªts

**ModÃ¨les de donnÃ©es** :
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
  seatNumber  String   // Format alphanumÃ©rique: A1, A2, B1, B2, etc.
  seatType    String   @default("Standard")
  isAvailable Boolean  @default(true)
  isHidden    Boolean  @default(false) // Pour cacher/afficher le siÃ¨ge
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  bus      Bus        @relation(fields: [busId], references: [id], onDelete: Cascade)
  bookings Booking[]
  
  @@unique([busId, seatNumber])
}

model Booking {
  // ... autres champs
  passengerType        String    @default("ADULT") // ADULT, CHILD, INFANT, SENIOR, DISABLED
  passengerAge         Int?      // Ã‚ge du passager au moment de la rÃ©servation
  hasDisability        Boolean   @default(false)
  disabilityProofUrl   String?   // URL du justificatif de handicap
  basePrice            Float     @default(0) // Prix de base avant rÃ©ductions
  discountAmount       Float     @default(0) // Montant de la rÃ©duction appliquÃ©e
  totalPrice           Float     @default(0) // Prix final aprÃ¨s rÃ©duction
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

## ðŸŽ¨ Composants ClÃ©s

### SeatMap Component

Composant de sÃ©lection de siÃ¨ges avec design 3D premium :

**Props** :
- `seats` : Liste des siÃ¨ges avec leur disponibilitÃ©
- `selectedSeat` / `selectedSeatIds` : SiÃ¨ge(s) sÃ©lectionnÃ©(s)
- `onSeatSelect` : Callback lors de la sÃ©lection
- `premiumMode` : Mode d'affichage premium (optionnel)
- `selectionKey` : `'id'` ou `'seatNumber'` - MÃ©thode de sÃ©lection
- `maxSelection` : Nombre maximum de siÃ¨ges sÃ©lectionnables

**CaractÃ©ristiques** :
- Design 3D avec effet de profondeur et glassmorphisme
- Cockpit et volant intÃ©grÃ©s pour le rÃ©alisme
- LÃ©gende intÃ©grÃ©e (VIP, Standard, SÃ©lectionnÃ©, OccupÃ©)
- Animation pulse pour les siÃ¨ges sÃ©lectionnÃ©s
- IcÃ´nes Lucide React pour le rendu professionnel

**Utilisation** :
```tsx
<SeatMap
  seats={availableSeats}
  selectedSeat={selectedSeat}
  onSeatSelect={setSelectedSeat}
  selectionKey={seatSelectionKey}
/>
```

## ðŸ”’ SÃ©curitÃ©

- Authentification sÃ©curisÃ©e avec NextAuth.js
- Hashage des mots de passe avec bcryptjs
- Validation des donnÃ©es avec Zod
- Protection CSRF intÃ©grÃ©e
- Gestion des rÃ´les et permissions

## ðŸª‘ Gestion de la VisibilitÃ© des SiÃ¨ges

### NumÃ©rotation AlphanumÃ©rique

Tous les siÃ¨ges utilisent une numÃ©rotation alphanumÃ©rique standardisÃ©e :
- **Format**: Lettre de rangÃ©e + NumÃ©ro de siÃ¨ge (ex: A1, A2, B1, B2)
- **GÃ©nÃ©ration automatique** via `buildSeatNumbers(rows, seatsPerRow)`
- **Exclusion du siÃ¨ge conducteur** lors de la configuration

### Interface de Gestion

AccÃ¨s: `/admin/buses/[busId]/seats`

**FonctionnalitÃ©s** :
- âœ… Visualisation du plan complet des siÃ¨ges
- âœ… Cacher/afficher les siÃ¨ges individuellement
- âœ… Cacher/afficher une rangÃ©e entiÃ¨re
- âœ… Statistiques en temps rÃ©el (total, visibles, cachÃ©s)
- âœ… Feedback visuel instantanÃ©
- âœ… Sauvegarde automatique des changements

**Utilisation** :
1. AccÃ©der Ã  la page "Gestion des siÃ¨ges" depuis la liste des bus
2. Cliquer sur un siÃ¨ge pour le cacher (gris) ou l'afficher (vert/dorÃ©)
3. Utiliser "Cacher/Afficher toute la rangÃ©e" pour gÃ©rer des rangÃ©es complÃ¨tes
4. Les siÃ¨ges cachÃ©s n'apparaÃ®tront plus dans les formulaires de rÃ©servation

**Codes couleur** :
- ðŸŸ¢ Vert : SiÃ¨ge standard visible
- ðŸŸ¡ DorÃ© : SiÃ¨ge VIP visible
- âšª Gris : SiÃ¨ge cachÃ© (non rÃ©servable)

**API Endpoint** :
```typescript
PUT /api/admin/buses/[busId]/seats/[seatId]
Body: { isHidden: boolean }
```

## ðŸ“„ Licence

PropriÃ©taire - Aigle Royale
# eticketbbs
# -Aigleroyale.

---

## SEAT_MANAGEMENT.md

# ðŸª‘ Gestion de la VisibilitÃ© des SiÃ¨ges

## Vue d'ensemble

Le systÃ¨me de gestion de la visibilitÃ© des siÃ¨ges permet aux administrateurs de contrÃ´ler quels siÃ¨ges sont affichÃ©s aux clients lors de la rÃ©servation. Cela permet de :

- ðŸ”§ Mettre des siÃ¨ges en maintenance
- ðŸŽ¯ RÃ©server des siÃ¨ges pour des usages spÃ©cifiques
- ðŸ“¦ Bloquer des rangÃ©es pour du fret ou des bagages
- ðŸŽ« GÃ©rer des configurations de bus flexibles

## NumÃ©rotation AlphanumÃ©rique

### Format StandardisÃ©

Tous les siÃ¨ges utilisent une numÃ©rotation alphanumÃ©rique :

```
A1  A2  A3  A4
B1  B2  B3  B4
C1  C2  C3  C4
D1  D2  D3  D4
```

**Structure** :
- **Lettre** : RangÃ©e (A, B, C, D, etc.)
- **Chiffre** : Position dans la rangÃ©e (1, 2, 3, 4, etc.)

### GÃ©nÃ©ration Automatique

Les numÃ©ros de siÃ¨ges sont gÃ©nÃ©rÃ©s automatiquement lors de la configuration du bus :

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

**CaractÃ©ristiques** :
- Exclusion automatique du siÃ¨ge conducteur
- Calcul basÃ© sur la capacitÃ© du bus
- Unique par bus grÃ¢ce Ã  la contrainte `@@unique([busId, seatNumber])`

## Interface Administrateur

### AccÃ¨s

**URL** : `/admin/buses/[busId]/seats`

**Navigation** :
1. AccÃ©der Ã  `/admin/buses` (Liste des bus)
2. Cliquer sur "SiÃ¨ges" Ã  cÃ´tÃ© du bus dÃ©sirÃ©
3. GÃ©rer la visibilitÃ© des siÃ¨ges

### FonctionnalitÃ©s

#### 1. Vue d'ensemble

**Statistiques en temps rÃ©el** :
- ðŸ“Š **SiÃ¨ges totaux** : Nombre total de siÃ¨ges configurÃ©s
- âœ… **SiÃ¨ges visibles** : SiÃ¨ges disponibles pour rÃ©servation
- ðŸ‘ï¸ **SiÃ¨ges cachÃ©s** : SiÃ¨ges non affichÃ©s aux clients

#### 2. Plan des SiÃ¨ges

**Organisation par rangÃ©e** :
- Chaque rangÃ©e (A, B, C, etc.) est affichÃ©e sÃ©parÃ©ment
- Les siÃ¨ges sont prÃ©sentÃ©s dans une grille responsive
- Codes couleur pour identification rapide

**Codes Couleur** :
- ðŸŸ¢ **Vert** : SiÃ¨ge standard visible
- ðŸŸ¡ **DorÃ©** : SiÃ¨ge VIP visible
- âšª **Gris** : SiÃ¨ge cachÃ© (non rÃ©servable)

#### 3. Actions Individuelles

**Cacher/Afficher un siÃ¨ge** :
1. Cliquer sur le siÃ¨ge dÃ©sirÃ©
2. Le siÃ¨ge change immÃ©diatement de statut
3. Sauvegarde automatique via l'API
4. Feedback visuel avec indicateur de chargement

**Effet visuel** :
- Au survol : IcÃ´ne Å“il (ðŸ‘ï¸) ou Å“il barrÃ© (ðŸš«)
- Animation de survol avec effet de scale
- Indicateur de sauvegarde (spinner)

#### 4. Actions par RangÃ©e

**Cacher/Afficher toute une rangÃ©e** :
1. Cliquer sur "Cacher/Afficher toute la rangÃ©e"
2. Tous les siÃ¨ges de la rangÃ©e changent de statut
3. RequÃªtes parallÃ¨les pour performance optimale

## Architecture Technique

### ModÃ¨le de DonnÃ©es

```prisma
model Seat {
  id          String   @id @default(uuid())
  busId       String
  seatNumber  String   // Format: A1, B1, C1, etc.
  seatType    String   @default("Standard")
  isAvailable Boolean  @default(true)
  isHidden    Boolean  @default(false) // VisibilitÃ© du siÃ¨ge
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  bus      Bus        @relation(fields: [busId], references: [id], onDelete: Cascade)
  bookings Booking[]
  
  @@unique([busId, seatNumber])
}
```

**Champs clÃ©s** :
- `seatNumber` : NumÃ©ro alphanumÃ©rique unique par bus
- `isHidden` : ContrÃ´le la visibilitÃ© (dÃ©faut: `false`)
- `isAvailable` : DisponibilitÃ© pour rÃ©servation (indÃ©pendant de `isHidden`)

### API Endpoints

#### PUT `/api/admin/buses/[busId]/seats/[seatId]`

**Mettre Ã  jour la visibilitÃ© d'un siÃ¨ge**

**RequÃªte** :
```json
{
  "isHidden": true
}
```

**RÃ©ponse** :
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
- VÃ©rifie l'appartenance du siÃ¨ge au bus
- Valide le type boolÃ©en de `isHidden`
- GÃ¨re les erreurs 401, 403, 404, 400

### Filtrage Automatique

Les siÃ¨ges cachÃ©s sont automatiquement exclus des requÃªtes de rÃ©servation :

```typescript
// Dans /app/trips/[id]/book/page.tsx
const trip = await prisma.trip.findUnique({
  where: { id },
  include: {
    bus: {
      include: {
        seats: {
          where: {
            isHidden: false, // Exclure les siÃ¨ges cachÃ©s
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
- Les clients ne voient jamais les siÃ¨ges cachÃ©s
- Aucune modification nÃ©cessaire dans le composant `SeatMap`
- Filtrage appliquÃ© au niveau de la base de donnÃ©es

## Composant React

### SeatVisibilityManager

**Props** :
```typescript
interface SeatVisibilityManagerProps {
  busId: string
  seats: Seat[]
}
```

**Ã‰tat local** :
```typescript
const [seatStates, setSeatStates] = useState<Record<string, boolean>>({})
const [saving, setSaving] = useState<Set<string>>(new Set())
```

**Fonctions principales** :

1. **toggleSeatVisibility** : Bascule la visibilitÃ© d'un siÃ¨ge
2. **toggleRowVisibility** : Bascule toute une rangÃ©e
3. **seatsByRow** : Organisation des siÃ¨ges par rangÃ©e (useMemo)

**Optimisations** :
- `useMemo` pour le calcul des rangÃ©es
- Mise Ã  jour optimiste de l'UI
- Gestion d'erreurs avec rollback
- Indicateurs de chargement par siÃ¨ge

## Cas d'Usage

### 1. Maintenance de SiÃ¨ges

**ScÃ©nario** : Un siÃ¨ge est endommagÃ© et doit Ãªtre retirÃ© temporairement

**Actions** :
1. AccÃ©der Ã  `/admin/buses/[busId]/seats`
2. Cliquer sur le siÃ¨ge dÃ©fectueux (ex: C3)
3. Le siÃ¨ge devient gris et disparaÃ®t des rÃ©servations
4. Une fois rÃ©parÃ©, cliquer Ã  nouveau pour le rÃ©afficher

### 2. RÃ©servation de RangÃ©es pour Fret

**ScÃ©nario** : Une rangÃ©e entiÃ¨re doit Ãªtre rÃ©servÃ©e pour transporter des bagages volumineux

**Actions** :
1. AccÃ©der Ã  la gestion des siÃ¨ges
2. SÃ©lectionner la rangÃ©e D (par exemple)
3. Cliquer sur "Cacher toute la rangÃ©e"
4. Tous les siÃ¨ges D1, D2, D3, D4 deviennent indisponibles

### 3. Configuration Bus SpÃ©ciale

**ScÃ©nario** : Un bus VIP ne doit afficher que certains siÃ¨ges premium

**Actions** :
1. Cacher toutes les rangÃ©es standards
2. Garder uniquement les siÃ¨ges VIP visibles
3. Les clients ne verront que l'offre premium

## Bonnes Pratiques

### âœ… Ã€ Faire

- Toujours vÃ©rifier les statistiques aprÃ¨s modification
- Informer les Ã©quipes avant de cacher des siÃ¨ges en masse
- Documenter les raisons de cachage (maintenance, etc.)
- RÃ©afficher les siÃ¨ges dÃ¨s que possible

### âŒ Ã€ Ã‰viter

- Ne pas cacher tous les siÃ¨ges d'un bus en service
- Ã‰viter de modifier pendant les heures de pointe
- Ne pas cacher de siÃ¨ges dÃ©jÃ  rÃ©servÃ©s sans vÃ©rification
- Ã‰viter les modifications trop frÃ©quentes

## Performances

### Optimisations ImplÃ©mentÃ©es

1. **RequÃªtes ParallÃ¨les** : Les mises Ã  jour de rangÃ©e utilisent `Promise.all()`
2. **Mise Ã  Jour Optimiste** : L'UI se met Ã  jour immÃ©diatement
3. **Filtrage Base de DonnÃ©es** : `WHERE isHidden = false` au niveau SQL
4. **MÃ©moisation** : `useMemo` pour le calcul des rangÃ©es
5. **Indicateurs Visuels** : Feedback instantanÃ© pour l'utilisateur

### MÃ©triques

- **Temps de mise Ã  jour** : < 200ms par siÃ¨ge
- **Temps de mise Ã  jour rangÃ©e** : < 1s pour 4 siÃ¨ges
- **Filtrage requÃªtes** : 0ms (niveau base de donnÃ©es)

## SÃ©curitÃ©

### ContrÃ´les d'AccÃ¨s

- âœ… Authentification requise (session NextAuth)
- âœ… RÃ´le Admin vÃ©rifiÃ© via `isAdminRole()`
- âœ… Validation propriÃ©tÃ© bus-siÃ¨ge
- âœ… Validation types de donnÃ©es (Zod possible)

### Protection des DonnÃ©es

- Les siÃ¨ges cachÃ©s restent en base de donnÃ©es
- Aucune suppression dÃ©finitive
- TraÃ§abilitÃ© via `updatedAt`
- Restauration immÃ©diate possible

## Feuille de Route

### AmÃ©liorations Futures

- [ ] **Historique des modifications** : Qui a cachÃ©/affichÃ© quand
- [ ] **Raisons de cachage** : Champ `hiddenReason` (maintenance, rÃ©servÃ©, etc.)
- [ ] **Planification** : Cacher/afficher automatiquement selon dates
- [ ] **Notifications** : Alertes lorsque trop de siÃ¨ges cachÃ©s
- [ ] **Export/Import** : Configurations de visibilitÃ© rÃ©utilisables
- [ ] **API Bulk** : Mettre Ã  jour plusieurs siÃ¨ges en une requÃªte

## Support

Pour toute question ou problÃ¨me :

1. VÃ©rifier ce document
2. Consulter `/admin/buses/[busId]/seats` pour les instructions intÃ©grÃ©es
3. Contacter l'Ã©quipe technique

---

**DerniÃ¨re mise Ã  jour** : 28 janvier 2026  
**Version** : 1.0.0

---

## SETUP.md

# Guide d'Installation et de Configuration

## PrÃ©requis

- Node.js 18+ 
- PostgreSQL 14+
- npm ou yarn

## Installation

1. **Installer les dÃ©pendances**
```bash
npm install
```

2. **Configurer la base de donnÃ©es**

CrÃ©ez un fichier `.env` Ã  la racine du projet avec le contenu suivant :

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

3. **CrÃ©er la base de donnÃ©es**

Assurez-vous que PostgreSQL est en cours d'exÃ©cution, puis :

```bash
# GÃ©nÃ©rer le client Prisma
npm run db:generate

# CrÃ©er les tables dans la base de donnÃ©es
npm run db:push

# (Optionnel) Peupler la base de donnÃ©es avec des donnÃ©es de test
npm run db:seed
```

4. **Lancer le serveur de dÃ©veloppement**

```bash
npm run dev
```

Le site sera accessible sur [http://localhost:3000](http://localhost:3000)

## Comptes de test (aprÃ¨s seed)

- **Administrateur**: 
  - Email: `admin@aigleroyale.com`
  - Mot de passe: `admin123`

- **Agent**: 
  - Email: `agent@aigleroyale.com`
  - Mot de passe: `agent123`

## Structure du Projet

```
â”œâ”€â”€ app/                    # Pages Next.js (App Router)
â”‚   â”œâ”€â”€ (auth)/            # Authentification
â”‚   â”œâ”€â”€ (client)/          # Interface client
â”‚   â”œâ”€â”€ (agent)/           # Interface agent agrÃ©Ã©
â”‚   â”œâ”€â”€ (agency)/          # Interface agence mÃ¨re
â”‚   â”œâ”€â”€ (admin)/           # Back-office administrateur
â”‚   â””â”€â”€ api/               # API Routes
â”œâ”€â”€ components/            # Composants React rÃ©utilisables
â”‚   â”œâ”€â”€ client/           # Composants pour clients
â”‚   â”œâ”€â”€ freight/          # Composants pour fret
â”‚   â””â”€â”€ advertisements/   # Composants publicitaires
â”œâ”€â”€ lib/                   # Utilitaires et configurations
â”‚   â”œâ”€â”€ auth.ts           # Configuration NextAuth
â”‚   â”œâ”€â”€ prisma.ts         # Client Prisma
â”‚   â””â”€â”€ utils.ts          # Fonctions utilitaires
â”œâ”€â”€ prisma/                # SchÃ©ma Prisma et migrations
â”‚   â”œâ”€â”€ schema.prisma     # ModÃ¨les de donnÃ©es
â”‚   â””â”€â”€ seed.ts           # Script de seed
â””â”€â”€ types/                 # DÃ©finitions TypeScript
```

## FonctionnalitÃ©s ImplÃ©mentÃ©es

### âœ… Module Client
- Recherche de trajets
- RÃ©servation avec choix de siÃ¨ge interactif
- Paiement (Mobile Money, Carte, EspÃ¨ces)
- GÃ©nÃ©ration de billets Ã©lectroniques avec QR code
- Historique des rÃ©servations
- Dashboard client

### âœ… Module Agents AgrÃ©Ã©s
- Vente de billets pour clients
- Vente de fret (colis)
- Suivi des commissions
- Historique des ventes
- Dashboard agent

### âœ… Module Agence MÃ¨re
- Vente directe au guichet
- RÃ©servation pour paiement ultÃ©rieur
- Gestion des clients sans compte
- Suivi caisse journaliÃ¨re
- Dashboard agence

### âœ… Module Gestion du Fret
- Enregistrement de colis
- Association colis â†” voyage
- Code de suivi unique
- Statuts : reÃ§u / en transit / livrÃ©
- Tarification automatique

### âœ… Module PublicitÃ©
- Gestion des espaces publicitaires
- BanniÃ¨res homepage, rÃ©sultats, confirmation
- Statistiques d'impressions & clics
- Gestion des annonceurs

### âœ… Back-Office
- Tableau de bord avec KPI
- Gestion des bus & flotte
- Gestion des trajets & horaires
- Gestion des utilisateurs & rÃ´les
- Rapports exportables

## Prochaines Ã‰tapes

### IntÃ©grations Ã  prÃ©voir :
1. **Paiement Mobile Money** : IntÃ©grer les APIs Orange Money, MTN Mobile Money
2. **Paiement Carte** : IntÃ©grer Stripe ou un processeur de paiement local
3. **Envoi d'emails/SMS** : Pour les confirmations et notifications
4. **GÃ©nÃ©ration PDF** : Pour les billets imprimables
5. **Export Excel/PDF** : Pour les rapports

### AmÃ©liorations possibles :
1. Application mobile native
2. Intelligence artificielle pour pricing dynamique
3. IntÃ©gration ERP externe
4. SystÃ¨me de notifications push
5. Chat en direct pour support client

## Support

Pour toute question ou problÃ¨me, consultez la documentation ou contactez l'Ã©quipe de dÃ©veloppement.

---

## TESTING.md

# Guide de Test - Plateforme Aigle Royale

## ðŸ§ª Tests de Base

### 1. VÃ©rifier l'installation

```bash
# VÃ©rifier que toutes les dÃ©pendances sont installÃ©es
npm install

# VÃ©rifier que Prisma est configurÃ©
npm run db:generate

# VÃ©rifier la connexion Ã  la base de donnÃ©es
npm run db:push
```

### 2. Peupler la base de donnÃ©es avec des donnÃ©es de test

```bash
npm run db:seed
```

Cela crÃ©era :
- Un administrateur : `admin@aigleroyale.com` / `admin123`
- Un agent : `agent@aigleroyale.com` / `agent123`
- Des routes (Abidjan â†’ Yamoussoukro, Abidjan â†’ BouakÃ©)
- Des bus avec leurs siÃ¨ges
- Des trajets pour demain

### 3. DÃ©marrer le serveur

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

---

## ðŸ“‹ Checklist de Tests par Module

### âœ… Module Client

#### Test 1 : Inscription d'un nouveau client
1. Aller sur `/auth/register`
2. Remplir le formulaire :
   - PrÃ©nom : Test
   - Nom : Client
   - Email : `client@test.com`
   - TÃ©lÃ©phone : `+225 07 12 34 56 78`
   - Mot de passe : `client123`
   - Confirmer : `client123`
3. Cliquer sur "S'inscrire"
4. âœ… VÃ©rifier : Redirection vers `/auth/login`

#### Test 2 : Connexion client
1. Aller sur `/auth/login`
2. Entrer : `client@test.com` / `client123`
3. Cliquer sur "Se connecter"
4. âœ… VÃ©rifier : Redirection vers `/dashboard`

#### Test 3 : Recherche de trajet
1. Sur la page d'accueil (`/`)
2. Remplir le formulaire de recherche :
   - DÃ©part : `Abidjan`
   - ArrivÃ©e : `Yamoussoukro`
   - Date : Demain
3. Cliquer sur "Rechercher des trajets"
4. âœ… VÃ©rifier : Affichage des trajets disponibles

#### Test 4 : RÃ©servation d'un billet
1. Sur la page de rÃ©sultats (`/trips/search`)
2. Cliquer sur "RÃ©server" pour un trajet
3. âœ… VÃ©rifier : Redirection vers `/trips/[id]/book`
4. SÃ©lectionner un siÃ¨ge sur le plan
5. Remplir les informations :
   - Nom complet : `Jean Dupont`
   - TÃ©lÃ©phone : `+225 07 12 34 56 78`
   - Email : `jean@example.com`
6. Cliquer sur "Continuer vers le paiement"
7. âœ… VÃ©rifier : Redirection vers `/bookings/[id]/payment`

#### Test 5 : Paiement
1. Sur la page de paiement
2. Choisir une mÃ©thode de paiement (ex: "Paiement en agence")
3. Cliquer sur "Payer"
4. âœ… VÃ©rifier : Redirection vers `/bookings/[id]/confirmation`
5. âœ… VÃ©rifier : Affichage du billet avec QR code
6. âœ… VÃ©rifier : PossibilitÃ© d'imprimer le billet

#### Test 6 : Dashboard client
1. Aller sur `/dashboard`
2. âœ… VÃ©rifier : Affichage des derniÃ¨res rÃ©servations
3. âœ… VÃ©rifier : Liens vers "RÃ©server un billet" et "Envoyer un colis"

---

### âœ… Module Fret (Colis)

#### Test 7 : CrÃ©er une commande de fret
1. Aller sur `/freight/new`
2. Rechercher un trajet :
   - DÃ©part : `Abidjan`
   - ArrivÃ©e : `Yamoussoukro`
   - Date : Demain
3. SÃ©lectionner un trajet
4. Remplir les informations :
   - ExpÃ©diteur : Nom, TÃ©lÃ©phone
   - Destinataire : Nom, TÃ©lÃ©phone
   - Poids : `5` kg
   - Type : `Documents`
   - Valeur : `10000` FC
5. Cliquer sur "CrÃ©er la commande"
6. âœ… VÃ©rifier : Affichage du code de suivi

#### Test 8 : Suivi d'un colis
1. Aller sur `/api/freight?trackingCode=FR-XXXXX`
2. âœ… VÃ©rifier : Affichage des dÃ©tails du colis

---

### âœ… Module Agent AgrÃ©Ã©

#### Test 9 : Connexion agent
1. Aller sur `/auth/login`
2. Entrer : `agent@aigleroyale.com` / `agent123`
3. Cliquer sur "Se connecter"
4. âœ… VÃ©rifier : Redirection vers `/agent`

#### Test 10 : Dashboard agent
1. Sur `/agent`
2. âœ… VÃ©rifier : Affichage des statistiques (ventes, commissions)
3. âœ… VÃ©rifier : Liens vers "Vendre un billet" et "Enregistrer un colis"
4. âœ… VÃ©rifier : Tableau des ventes rÃ©centes

#### Test 11 : Vente d'un billet par agent
1. Sur `/agent/bookings/new` (Ã  crÃ©er si nÃ©cessaire)
2. CrÃ©er une rÃ©servation pour un client
3. âœ… VÃ©rifier : La rÃ©servation est associÃ©e Ã  l'agent
4. âœ… VÃ©rifier : Commission calculÃ©e automatiquement

---

### âœ… Module Agence MÃ¨re

#### Test 12 : CrÃ©er un compte agence
1. Via l'admin, crÃ©er un utilisateur avec le rÃ´le `AGENCY_STAFF`
2. Se connecter avec ce compte
3. âœ… VÃ©rifier : Redirection vers `/agency`

#### Test 13 : Dashboard agence
1. Sur `/agency`
2. âœ… VÃ©rifier : Statistiques du jour (ventes, CA)
3. âœ… VÃ©rifier : Tableau des ventes rÃ©centes

---

### âœ… Module Administrateur

#### Test 14 : Connexion admin
1. Aller sur `/auth/login`
2. Entrer : `admin@aigleroyale.com` / `admin123`
3. Cliquer sur "Se connecter"
4. âœ… VÃ©rifier : Redirection vers `/admin`

#### Test 15 : Dashboard admin
1. Sur `/admin`
2. âœ… VÃ©rifier : Affichage des KPI (rÃ©servations totales, CA, utilisateurs, trajets)
3. âœ… VÃ©rifier : Liens vers les diffÃ©rentes sections de gestion

#### Test 16 : Gestion des bus
1. Aller sur `/admin/buses` (Ã  crÃ©er)
2. CrÃ©er un nouveau bus :
   - Plaque : `AR-003-AB`
   - Nom : `Bus Standard 2`
   - CapacitÃ© : `50`
3. âœ… VÃ©rifier : Le bus apparaÃ®t dans la liste
4. âœ… VÃ©rifier : Les siÃ¨ges sont crÃ©Ã©s automatiquement

#### Test 17 : Gestion des trajets
1. Aller sur `/admin/routes` (Ã  crÃ©er)
2. CrÃ©er une nouvelle route :
   - Origine : `Abidjan`
   - Destination : `San-Pedro`
   - Distance : `350` km
   - DurÃ©e : `240` minutes
3. CrÃ©er un trajet :
   - SÃ©lectionner le bus et la route
   - Date/heure de dÃ©part
   - Prix : `6000` FC
4. âœ… VÃ©rifier : Le trajet apparaÃ®t dans les rÃ©sultats de recherche

#### Test 18 : Gestion des utilisateurs
1. Aller sur `/admin/users` (Ã  crÃ©er)
2. CrÃ©er un nouvel agent :
   - Email : `agent2@test.com`
   - Mot de passe : `agent123`
   - RÃ´le : `AGENT`
3. âœ… VÃ©rifier : L'utilisateur peut se connecter

---

### âœ… Module PublicitÃ©

#### Test 19 : CrÃ©er une publicitÃ©
1. En tant qu'admin, aller sur `/admin/advertisements` (Ã  crÃ©er)
2. CrÃ©er une nouvelle publicitÃ© :
   - Titre : `Promotion spÃ©ciale`
   - Image URL : URL d'une image
   - Type : `BANNER_HOMEPAGE`
   - Dates de dÃ©but et fin
3. âœ… VÃ©rifier : La publicitÃ© apparaÃ®t sur la page d'accueil

#### Test 20 : Statistiques publicitaires
1. Sur `/admin/advertisements/[id]`
2. âœ… VÃ©rifier : Affichage des impressions et clics
3. Cliquer sur la publicitÃ© depuis la page d'accueil
4. âœ… VÃ©rifier : Le compteur de clics s'incrÃ©mente

---

## ðŸ” Tests API (avec Postman ou curl)

### Test 21 : API Recherche de trajets
```bash
curl "http://localhost:3000/api/trips/search?origin=Abidjan&destination=Yamoussoukro&date=2024-01-15"
```
âœ… VÃ©rifier : Retourne un tableau de trajets

### Test 22 : API CrÃ©ation de rÃ©servation
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
âœ… VÃ©rifier : Retourne bookingId et ticketNumber

### Test 23 : API CrÃ©ation de fret
```bash
curl -X POST http://localhost:3000/api/freight \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{
    "tripId": "trip-id",
    "senderName": "ExpÃ©diteur",
    "senderPhone": "+225 07 12 34 56 78",
    "receiverName": "Destinataire",
    "receiverPhone": "+225 07 12 34 56 78",
    "weight": 5
  }'
```
âœ… VÃ©rifier : Retourne freightOrderId et trackingCode

---

## ðŸ› Tests de SÃ©curitÃ©

### Test 24 : Protection des routes
1. Essayer d'accÃ©der Ã  `/admin` sans Ãªtre connectÃ©
   - âœ… VÃ©rifier : Redirection vers `/auth/login`

2. Se connecter en tant que client et essayer d'accÃ©der Ã  `/admin`
   - âœ… VÃ©rifier : Redirection vers `/dashboard`

3. Se connecter en tant qu'agent et essayer d'accÃ©der Ã  `/agency`
   - âœ… VÃ©rifier : Redirection vers `/dashboard`

### Test 25 : Validation des donnÃ©es
1. Essayer de crÃ©er une rÃ©servation sans sÃ©lectionner de siÃ¨ge
   - âœ… VÃ©rifier : Message d'erreur affichÃ©

2. Essayer de crÃ©er un compte avec un email dÃ©jÃ  utilisÃ©
   - âœ… VÃ©rifier : Message d'erreur "Cet email est dÃ©jÃ  utilisÃ©"

3. Essayer de rÃ©server un siÃ¨ge dÃ©jÃ  occupÃ©
   - âœ… VÃ©rifier : Message d'erreur "SiÃ¨ge non disponible"

---

## ðŸ“Š Tests de Performance

### Test 26 : Charge de la page d'accueil
1. Ouvrir les DevTools (F12)
2. Aller sur `/`
3. âœ… VÃ©rifier : Temps de chargement < 2 secondes

### Test 27 : Recherche de trajets
1. Effectuer une recherche
2. âœ… VÃ©rifier : RÃ©sultats affichÃ©s rapidement (< 1 seconde)

---

## âœ… Checklist Finale

- [ ] Toutes les pages se chargent sans erreur
- [ ] L'authentification fonctionne pour tous les rÃ´les
- [ ] Les rÃ©servations peuvent Ãªtre crÃ©Ã©es et payÃ©es
- [ ] Les billets avec QR code sont gÃ©nÃ©rÃ©s
- [ ] Le module fret fonctionne
- [ ] Les agents peuvent vendre des billets
- [ ] L'admin peut gÃ©rer les bus, trajets, utilisateurs
- [ ] Les publicitÃ©s s'affichent correctement
- [ ] Les statistiques sont calculÃ©es correctement
- [ ] Les routes sont protÃ©gÃ©es selon les rÃ´les

---

## ðŸ› ï¸ Outils de Test RecommandÃ©s

1. **Postman** : Pour tester les API
2. **Chrome DevTools** : Pour dÃ©boguer le frontend
3. **Prisma Studio** : Pour inspecter la base de donnÃ©es
   ```bash
   npm run db:studio
   ```
4. **React DevTools** : Extension Chrome pour dÃ©boguer React

---

## ðŸ“ Notes

- Assurez-vous que PostgreSQL est en cours d'exÃ©cution avant de tester
- Les donnÃ©es de seed crÃ©ent des trajets pour "demain", ajustez la date si nÃ©cessaire
- Pour tester les paiements rÃ©els, configurez les clÃ©s API dans `.env`
- Les QR codes sont gÃ©nÃ©rÃ©s automatiquement lors de la crÃ©ation d'une rÃ©servation

