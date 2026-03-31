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
    server 127.0.0.1:3001;
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
