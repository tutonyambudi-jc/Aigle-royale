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
