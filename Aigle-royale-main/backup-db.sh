#!/bin/bash

# ============================================
# Script de sauvegarde Base de Données
# Aigle Royale - PostgreSQL
# ============================================

# Configuration
DB_NAME="aigle_royale"
DB_USER="aigle_user"
DB_HOST="localhost"
BACKUP_DIR="$HOME/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/aigle_royale_$DATE.sql"

# Lire le mot de passe depuis .env (optionnel)
ENV_FILE="$HOME/aigle-royale/.env"
if [ -f "$ENV_FILE" ]; then
    # Extraire le mot de passe de DATABASE_URL
    DB_PASSWORD=$(grep DATABASE_URL "$ENV_FILE" | cut -d':' -f3 | cut -d'@' -f1)
else
    echo "⚠️  Fichier .env introuvable. Utilisez PGPASSWORD ou .pgpass"
    DB_PASSWORD=""
fi

# Créer le dossier de backup s'il n'existe pas
mkdir -p "$BACKUP_DIR"

echo "🗄️  Backup de la base de données Aigle Royale"
echo "Date: $(date)"
echo "========================================"

# Effectuer le backup
if [ -n "$DB_PASSWORD" ]; then
    PGPASSWORD="$DB_PASSWORD" pg_dump -U "$DB_USER" -h "$DB_HOST" "$DB_NAME" > "$BACKUP_FILE"
else
    pg_dump -U "$DB_USER" -h "$DB_HOST" "$DB_NAME" > "$BACKUP_FILE"
fi

# Vérifier que le backup a réussi
if [ $? -eq 0 ]; then
    echo "✅ Backup SQL créé: $BACKUP_FILE"
    
    # Compresser le backup
    echo "🗜️  Compression du backup..."
    gzip "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        echo "✅ Backup compressé: ${BACKUP_FILE}.gz"
        
        # Afficher la taille
        SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
        echo "📦 Taille: $SIZE"
    else
        echo "⚠️  Compression échouée, mais le fichier SQL est disponible"
    fi
    
    # Nettoyer les anciens backups (garder 30 derniers jours)
    echo "🧹 Nettoyage des anciens backups (> 30 jours)..."
    find "$BACKUP_DIR" -name "aigle_royale_*.sql.gz" -mtime +30 -delete
    
    # Afficher le nombre de backups restants
    COUNT=$(find "$BACKUP_DIR" -name "aigle_royale_*.sql.gz" | wc -l)
    echo "📊 Nombre de backups disponibles: $COUNT"
    
    echo "========================================"
    echo "🎉 Backup terminé avec succès!"
else
    echo "❌ Erreur lors du backup!"
    exit 1
fi
