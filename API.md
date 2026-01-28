# Documentation des API Routes

## Authentification

### POST `/api/auth/register`
Créer un nouveau compte utilisateur

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

## Réservations

### POST `/api/bookings`
Créer une ou plusieurs réservations (avec regroupement automatique)

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
  "hasDisability": "boolean (optionnel, défaut: false)",
  "boardingStopId": "string (optionnel, pour arrêts intermédiaires)",
  "alightingStopId": "string (optionnel, pour arrêts intermédiaires)"
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
- Le système récupère la règle de tarification selon `passengerType`
- `basePrice` = prix du trajet
- `discountAmount` = `basePrice * (discountPercent / 100)`
- `totalPrice` = `basePrice - discountAmount + extrasTotal`

**Response:**
```json
{
  "bookingGroupId": "string (nouveau - ID du groupe de réservations)",
  "bookingId": "string (ID de la première réservation)",
  "ticketNumber": "string (Numéro du premier billet)",
  "bookingIds": ["string", "string", ...],
  "ticketNumbers": ["string", "string", ...]
}
```

**Note importante:** Lors de réservations multiples, toutes les réservations sont regroupées dans un `BookingGroup` unique. Cela permet un **paiement unique** pour tous les billets, réduisant ainsi les frais de commission.

### POST `/api/bookings/[id]/payment`
Effectuer le paiement d'une réservation individuelle (ancien système)

**Body:**
```json
{
  "method": "MOBILE_MONEY" | "CARD" | "CASH"
}
```

## Groupes de Réservations (Nouveau)

### POST `/api/booking-groups/[id]/payment`
Effectuer le paiement groupé pour plusieurs billets

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

**Avantages du paiement groupé:**
- ✅ Un seul paiement pour tous les billets
- ✅ Une seule commission prélevée
- ✅ Récapitulatif complet de tous les passagers
- ✅ Gestion simplifiée pour les familles/groupes

## Trajets

### GET `/api/trips/search`
Rechercher des trajets

**Query Parameters:**
- `origin`: Ville de départ
- `destination`: Ville d'arrivée
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
Créer une commande de fret

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
Lister toutes les règles de tarification (Admin uniquement)

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
Mettre à jour une règle de tarification (Admin uniquement)

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

**Exemples de règles:**
- **ADULT**: 0% de réduction, 12-59 ans
- **CHILD**: 50% de réduction, 2-11 ans
- **INFANT**: 80% de réduction, 0-1 an
- **SENIOR**: 30% de réduction, 60+ ans
- **DISABLED**: 40% de réduction, tous âges (justificatif requis)

## Publicités

### GET `/api/advertisements`
Lister les publicités

**Query Parameters:**
- `type`: Type de bannière (BANNER_HOMEPAGE, BANNER_RESULTS, BANNER_CONFIRMATION)
- `status`: Statut (ACTIVE, INACTIVE, EXPIRED)

### POST `/api/advertisements`
Créer une publicité (Admin uniquement)

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
Obtenir une publicité spécifique (incrémente les impressions)

### PUT `/api/advertisements/[id]`
Mettre à jour une publicité (Admin uniquement)

### DELETE `/api/advertisements/[id]`
Supprimer une publicité (Admin uniquement)

### POST `/api/advertisements/[id]/click`
Enregistrer un clic sur une publicité

## Paramètres Système

### GET `/api/settings`
Récupérer un paramètre système (public)

**Query Parameters:**
- `key`: Clé du paramètre (ex: `seatSelectionKey`)

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
Récupérer les paramètres système (Admin uniquement)

**Query Parameters:**
- `key`: Clé du paramètre (optionnel)

### POST `/api/admin/settings`
Créer ou mettre à jour un paramètre système (Admin uniquement)

**Body:**
```json
{
  "key": "string",
  "value": "string"
}
```

## Arrêts de Ville

### GET `/api/admin/city-stops`
Lister les arrêts de ville actifs (Admin uniquement)

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
Créer un nouvel arrêt de ville (Admin uniquement)

**Body:**
```json
{
  "cityId": "string",
  "name": "string",
  "address": "string (optionnel)"
}
```

### PUT `/api/admin/city-stops/[id]`
Modifier un arrêt de ville (Admin uniquement)

**Body:**
```json
{
  "name": "string",
  "address": "string (optionnel)"
}
```

### DELETE `/api/admin/city-stops/[id]`
Désactiver un arrêt de ville (Admin uniquement)

## Arrêts de Route

### GET `/api/admin/routes/[id]`
Récupérer les détails d'une route (Admin uniquement)

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
Lister les arrêts d'une route (Admin uniquement)

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
Ajouter un arrêt à une route (Admin uniquement)

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
Supprimer un arrêt d'une route (Admin uniquement)

### PATCH `/api/admin/routes/[id]/stops/[routeStopId]/reorder`
Réorganiser l'ordre des arrêts (Admin uniquement)

**Body:**
```json
{
  "direction": "up | down"
}
```

## Gestion de la Visibilité des Sièges

### PUT `/api/admin/buses/[busId]/seats/[seatId]`
Mettre à jour la visibilité d'un siège (Admin uniquement)

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
    "seatNumber": "string", // Format alphanumérique: A1, B1, etc.
    "seatType": "string",
    "isAvailable": "boolean",
    "isHidden": "boolean",
    "createdAt": "datetime",
    "updatedAt": "datetime"
  }
}
```

**Erreurs possibles:**
- `401`: Non authentifié
- `403`: Accès non autorisé (admin requis)
- `404`: Siège introuvable
- `400`: Le siège n'appartient pas à ce bus ou données invalides

**Notes:**
- Les sièges cachés (`isHidden: true`) ne sont pas affichés dans les formulaires de réservation
- Le filtrage automatique est appliqué dans toutes les requêtes de réservation
- Utile pour gérer des sièges en maintenance ou réservés pour des usages spécifiques

### PATCH `/api/admin/buses/[busId]/seats/[seatId]`
Basculer la disponibilité d'un siège (Admin uniquement)

**Body:**
```json
{
  "isAvailable": "boolean"
}
```

## Notes

- Toutes les routes nécessitent une authentification sauf `/api/auth/*` et certaines routes publiques
- Les rôles sont vérifiés pour les routes administratives
- Les erreurs retournent un format JSON avec un champ `error`
- **Numérotation des sièges**: Format alphanumérique standardisé (A1, A2, B1, B2, etc.)
