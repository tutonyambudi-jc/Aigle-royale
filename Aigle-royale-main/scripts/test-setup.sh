#!/bin/bash

# Script de test automatisé pour la plateforme Aigle Royale

echo "🧪 Démarrage des tests..."

# Couleurs pour les messages
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les résultats
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
    print_error "Node.js n'est pas installé"
    exit 1
fi
print_success "Node.js est installé ($(node --version))"

# Vérifier que PostgreSQL est accessible
if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL n'est pas installé ou psql n'est pas dans le PATH"
    exit 1
fi
print_success "PostgreSQL est installé"

# Vérifier que .env existe
if [ ! -f .env ]; then
    print_error "Le fichier .env n'existe pas. Créez-le à partir de .env.example"
    exit 1
fi
print_success "Fichier .env trouvé"

# Installer les dépendances si node_modules n'existe pas
if [ ! -d "node_modules" ]; then
    print_info "Installation des dépendances..."
    npm install
    if [ $? -eq 0 ]; then
        print_success "Dépendances installées"
    else
        print_error "Échec de l'installation des dépendances"
        exit 1
    fi
else
    print_success "Dépendances déjà installées"
fi

# Générer le client Prisma
print_info "Génération du client Prisma..."
npm run db:generate
if [ $? -eq 0 ]; then
    print_success "Client Prisma généré"
else
    print_error "Échec de la génération du client Prisma"
    exit 1
fi

# Pousser le schéma vers la base de données
print_info "Création des tables dans la base de données..."
npm run db:push
if [ $? -eq 0 ]; then
    print_success "Tables créées"
else
    print_error "Échec de la création des tables"
    exit 1
fi

# Peupler la base de données
print_info "Peuplement de la base de données avec des données de test..."
npm run db:seed
if [ $? -eq 0 ]; then
    print_success "Base de données peuplée"
else
    print_warning "Échec du peuplement (peut être normal si déjà peuplé)"
fi

echo ""
echo -e "${GREEN}🎉 Configuration terminée avec succès!${NC}"
echo ""
echo "Prochaines étapes:"
echo "1. Lancez le serveur: npm run dev"
echo "2. Ouvrez http://localhost:3000"
echo "3. Connectez-vous avec:"
echo "   - Admin: admin@aigleroyale.com / admin123"
echo "   - Agent: agent@aigleroyale.com / agent123"
echo ""
