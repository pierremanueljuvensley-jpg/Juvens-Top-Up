# JuvensTopUp Backend

Backend Node.js/Express pour JuvensTopUp.

## Architecture

Frontend (Cloudflare Pages/Vercel)
→ Render
→ Supabase Auth / Edge Functions / PostgreSQL.

## Fonctionnalités

- Authentification par Bearer JWT **validé par Supabase Auth** (`/auth/v1/user`) : signature, expiration et utilisateur vérifiés à chaque requête (401 `AUTH_REQUIRED` / `INVALID_TOKEN`).
- Dashboard client.
- Achat avec wallet.
- Déduction atomique côté Supabase.
- Protection contre double débit avec `buyer_ref`.
- Création de demande de recharge wallet.
- Vérification UID.
- Dashboard/admin commandes.
- Validation et actions admin.
- Gestion des produits.
- CORS strict.
- Helmet.
- Rate limiting.
- Gestion centralisée des erreurs.
- Health checks.
- Logs sans tokens ni corps sensibles.

## Contrat d'API

- Erreurs : toujours `{ "success": false, "error": { "code", "message" } }` (les erreurs amont sont normalisées ; `details`, `hint`, erreurs SQL jamais exposés).
- `POST /api/customer/purchase` : `buyer_ref` est **obligatoire** (clé d'idempotence). Le frontend le génère une fois par tentative d'achat et le réutilise tel quel en cas de retry (timeout, coupure réseau). Le prix n'est jamais lu depuis le client.
- Rate limiting : global par IP ; routes sensibles et admin par utilisateur authentifié.

## Important

Le backend ne doit jamais contenir de `service_role` Supabase.
L'autorisation admin et la validation cryptographique du JWT doivent être faites par Supabase Edge Functions/RLS.

Le flux d'achat attendu est:

1. Client connecté.
2. Frontend appelle `POST /api/customer/purchase`.
3. Render transmet le JWT à `purchase-wallet`.
4. La fonction Supabase vérifie le produit et le wallet.
5. La transaction PostgreSQL verrouille le wallet.
6. Si le solde est insuffisant, aucun débit.
7. Si le solde est suffisant, le montant est débité et la commande créée.
8. `buyer_ref` permet de rendre les retries idempotents.

## Recharge wallet

`POST /api/customer/topup` crée une demande `pending` via `create_wallet_topup`.

La validation manuelle par admin passe par:

`POST /api/admin/wallet-topup`

L'automatisation NatCash nécessite encore un vrai endpoint/webhook/API NatCash et sa vérification de signature. Ne pas inventer de credentials ou de webhook.

## Variables Render

Voir `.env.example`.

Pour la production:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_FUNCTIONS_URL`
- `CORS_ORIGINS` (ex: `https://juvenstopup.pages.dev`, plusieurs origines séparées par des virgules)

Ne jamais mettre une clé `service_role` dans `SUPABASE_ANON_KEY`.

## Installation

```bash
npm install
npm start
```

Développement:

```bash
npm run dev
```

## Endpoints principaux

GET `/`
GET `/health`
GET `/health/supabase`

GET ou POST `/api/customer/dashboard`
POST `/api/customer/purchase`
POST `/api/customer/topup`
POST `/api/customer/verify-uid`

GET `/api/admin/dashboard`
GET `/api/admin/orders`
POST `/api/admin/order-action`
POST `/api/admin/wallet-topup`
POST `/api/admin/product-action`

## Frontend purchase example

```js
const response = await fetch(`${API_URL}/api/customer/purchase`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session.access_token}`
  },
  body: JSON.stringify({
    product_id,
    player_id,
    server_id,
    region,
    quantity: 1,
    buyer_ref: crypto.randomUUID()
  })
});

const result = await response.json();
```

En cas d'erreur réseau après l'envoi, le frontend doit réutiliser le même `buyer_ref` pour le retry au lieu d'en créer un nouveau.

## Production checklist

- Configurer les Edge Functions Supabase.
- Vérifier RLS et les fonctions PostgreSQL.
- Tester wallet suffisant/insuffisant.
- Tester l'idempotence `buyer_ref`.
- Tester UID réel.
- Connecter le fournisseur de jeux.
- Ajouter NatCash officiel si une API/webhook est disponible.
- Tester le parcours complet frontend → Render → Supabase → fournisseur.
- Configurer un domaine API dédié.

## Limites connues (à traiter côté Supabase)

Ce dépôt est une passerelle : l'atomicité du débit, le ledger, l'idempotence `buyer_ref` (contrainte unique) et l'autorisation admin vivent dans les Edge Functions / RPC Supabase, **absentes de ce dépôt** et donc non vérifiées ici. Voir PRODUCTION_NOTES.md.
