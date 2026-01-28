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
