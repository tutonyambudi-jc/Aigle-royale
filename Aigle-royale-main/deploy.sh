#!/bin/bash

# ============================================
# Script de déploiement Aigle Royale
# ============================================

set -e  # Arrêter en cas d'erreur

echo "🚀 Déploiement Aigle Royale - $(date)"
echo "========================================"

# Vérifier que nous sommes dans le bon dossier
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: package.json introuvable. Êtes-vous dans le bon dossier?"
    exit 1
fi

# Sauvegarder la version actuelle PM2
echo "📦 Sauvegarde de la configuration PM2..."
pm2 save || true

# Récupérer les dernières modifications (si Git est configuré)
if [ -d ".git" ]; then
    echo "⬇️  Récupération du code depuis Git..."
    git pull origin main || {
        echo "⚠️  Attention: git pull a échoué. Continuons quand même..."
    }
else
    echo "ℹ️  Pas de repository Git détecté, passage..."
fi

# Installer/Mettre à jour les dépendances
echo "📦 Installation des dépendances..."
npm install --production=false

# Générer le client Prisma
echo "🔨 Génération du client Prisma..."
npm run db:generate

# Appliquer les migrations de base de données
echo "🗄️  Application des migrations..."
npx prisma migrate deploy || {
    echo "⚠️  Attention: migrations échouées. Continuons avec db:push..."
    npm run db:push
}

# Build de l'application
echo "🏗️  Build de l'application Next.js..."
npm run build

# Vérifier que le build a réussi
if [ ! -d ".next" ]; then
    echo "❌ Erreur: Le build a échoué (.next introuvable)"
    exit 1
fi

# Redémarrer l'application avec PM2 (rechargement à chaud)
echo "🔄 Redémarrage de l'application..."
pm2 reload ecosystem.config.js --update-env

# Attendre quelques secondes
sleep 3

# Vérifier le statut
echo "✅ Vérification du statut..."
pm2 status

# Afficher les logs récents
echo ""
echo "📊 Logs récents:"
pm2 logs aigle-royale --lines 20 --nostream

echo ""
echo "🎉 Déploiement terminé avec succès!"
echo "========================================"
echo "📊 Commandes utiles:"
echo "  - Voir les logs:     pm2 logs aigle-royale"
echo "  - Monitoring:        pm2 monit"
echo "  - Redémarrer:        pm2 restart aigle-royale"
echo ""
