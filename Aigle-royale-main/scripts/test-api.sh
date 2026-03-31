#!/bin/bash

# Script pour tester les API endpoints

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_test() {
    echo -e "${YELLOW}🧪 Test: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier que le serveur est en cours d'exécution
if ! curl -s "$BASE_URL" > /dev/null; then
    print_error "Le serveur n'est pas en cours d'exécution. Lancez 'npm run dev' d'abord."
    exit 1
fi

echo "🚀 Démarrage des tests API..."
echo ""

# Test 1: Recherche de trajets
print_test "Recherche de trajets"
RESPONSE=$(curl -s "$BASE_URL/api/trips/search?origin=Abidjan&destination=Yamoussoukro&date=$(date -d '+1 day' +%Y-%m-%d)")
if echo "$RESPONSE" | grep -q "id"; then
    print_success "Recherche de trajets fonctionne"
else
    print_error "Recherche de trajets échouée"
fi
echo ""

# Test 2: Liste des publicités
print_test "Liste des publicités"
RESPONSE=$(curl -s "$BASE_URL/api/advertisements")
if echo "$RESPONSE" | grep -q "id\|\[\]"; then
    print_success "API publicités accessible"
else
    print_error "API publicités échouée"
fi
echo ""

# Test 3: Page d'accueil
print_test "Page d'accueil"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL")
if [ "$STATUS" -eq 200 ]; then
    print_success "Page d'accueil accessible (HTTP $STATUS)"
else
    print_error "Page d'accueil inaccessible (HTTP $STATUS)"
fi
echo ""

# Test 4: Page de connexion
print_test "Page de connexion"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/login")
if [ "$STATUS" -eq 200 ]; then
    print_success "Page de connexion accessible (HTTP $STATUS)"
else
    print_error "Page de connexion inaccessible (HTTP $STATUS)"
fi
echo ""

echo "📊 Résumé des tests API terminé"
echo ""
echo "Note: Pour tester les endpoints authentifiés, vous devez:"
echo "1. Vous connecter via l'interface web"
echo "2. Copier le cookie 'next-auth.session-token'"
echo "3. L'utiliser dans vos requêtes curl avec l'option -H 'Cookie: ...'"
