# Production notes

This ZIP recreates the backend architecture from the supplied JuvensTopUp backend.

Before going live, verify these Supabase resources exist and match the payloads:
- Edge Function: purchase-wallet
- Edge Function: customer-dashboard
- Edge Function: verify-uid
- Edge Function: admin-dashboard
- Edge Function: admin-orders
- Edge Function: admin-order-action
- Edge Function: admin-wallet-topup
- Edge Function: admin-product-action
- RPC: create_wallet_topup
- PostgreSQL wallet/order transaction used by purchase-wallet

The backend intentionally does not fabricate a NatCash API integration or supplier API credentials.
Those integrations require the actual provider documentation, credentials, callback/webhook rules and product mapping.

## À vérifier côté Supabase (non vérifiable depuis ce dépôt)
- `purchase-wallet` : verrou de ligne wallet (`SELECT ... FOR UPDATE`) ou RPC unique, commande + débit + écriture ledger dans la même transaction, contrainte UNIQUE sur `buyer_ref` (par utilisateur), prix lu en base, montants en `numeric`.
- Fonctions `admin-*` : refuser tout non-admin (le backend ne fait que relayer le JWT validé).
- `create_wallet_topup` : crée uniquement une ligne `pending` ; le crédit n'a lieu qu'après confirmation (admin ou webhook vérifié).
- Aucun adaptateur Natcash / fournisseur n'est actif : aucune API officielle n'a été fournie.

## Migration Supabase — correction importante

- La migration comporte maintenant un préflight transactionnel des tables, colonnes, écritures ledger, doublons de `buyer_ref`, devise des produits actifs et méthode NatCash HTG active. Si un contrôle échoue, PostgreSQL annule toute la migration et affiche une erreur `migration_preflight_*`.
- La contrainte globale `UNIQUE (buyer_ref)` est retirée par détection de sa définition, sans dépendre de son nom exact ; l'index unique par client est conservé.
- Contrôles en lecture seule du projet connecté le 2026-10-09 : 0 commande, 0 transaction ledger, 0 ligne audit, aucun doublon client/référence, aucun montant ledger invalide, aucun produit actif hors HTG, NatCash HTG actif.
- **La migration n'a pas été exécutée sur la base connectée.** Ces contrôles ne remplacent pas les tests complets sur une base de développement.
