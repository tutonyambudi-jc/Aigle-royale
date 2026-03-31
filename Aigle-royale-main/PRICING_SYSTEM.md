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
