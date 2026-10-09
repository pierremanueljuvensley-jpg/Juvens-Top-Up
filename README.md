# Supabase — migrations, fonctions, tests

Projet audité en lecture seule le 2026-10-09 (schéma réel, 12 migrations existantes, Edge Functions, fonctions SQL, RLS et privilèges).
**Rien de ce dossier n'a été appliqué à la production.** La migration corrigée ajoute un préflight qui annule immédiatement l'opération si les tables/colonnes attendues ou les données préexistantes ne correspondent pas.

## Contenu
- `migrations/20261008120000_wallet_ledger_hardening.sql` — ledger immuable, moindre privilège, idempotence par client, achat atomique, recharge bornée, fonctions admin (autorisation + audit atomiques), ajustement admin.
- `functions/` — `purchase-wallet`, `admin-wallet-topup`, `admin-order-action`, `admin-product-action`, `admin-wallet-adjust` (nouvelle), `create-topup` (retirée : elle débitait le wallet).
- `tests/wallet_tests.sql` (transaction annulée) et `tests/concurrency_test.sh` (2 connexions réelles).
- `ROLLBACK.txt` — retour arrière manuel.

## Ordre de déploiement (toujours branche/dev d'abord)
1. **Sauvegarde** : Dashboard Supabase > Database > Backups (ou `pg_dump "$DATABASE_URL" -Fc -f backup.dump`). La vérification en lecture seule du 2026-10-09 a trouvé 0 commande, 0 écriture ledger et 0 ligne audit ; refais ces contrôles avant déploiement.
2. Le branch Supabase n'est pas disponible sur le plan actuel. Utilise un projet Supabase de développement séparé ou une base locale Supabase CLI ; ne remplace pas `DEV_DATABASE_URL` par l'URL de production.
3. Sur la base de développement, appliquer la migration puis lancer `psql "$DEV_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/wallet_tests.sql` et `./supabase/tests/concurrency_test.sh`. Tous les tests doivent afficher PASS / OK.
4. Vérifier les fonctions Edge concernées, puis appliquer la migration SQL et déployer les fonctions dans l'ordre prévu uniquement après réussite des tests.
5. Déployer le backend Node (Render) en dernier.

## Points à décider / surveiller
- `buyer_ref` devient obligatoire (frontend : un identifiant unique par tentative d'achat, réutilisé tel quel en cas de retry).
- `admin-wallet-topup` exige désormais `provider_reference` (référence de la transaction Natcash ; unique en base).
- Ajustements wallet : rôle `super_admin` uniquement, jamais sur son propre compte.
- CORS des Edge Functions : liste blanche `ALLOWED_ORIGINS` (défaut `https://juvenstopup.pages.dev`). Si le frontend appelle encore les fonctions directement depuis un autre domaine, l'ajouter.
- Colonnes `products` : `anon` lit toutes les colonnes (policy publique). `cost_price` est NULL partout aujourd'hui ; avant de le renseigner, exposer une vue publique sans coût/fournisseur.
- Les produits actifs observés le 2026-10-09 sont en HTG. Les produits avec prix nul ou négatif restent refusés par `create_wallet_order` (`product_price_not_configured`) ; vérifier/corriger leurs prix avant activation.
- Fonctions héritées non utilisées par les Edge Functions actuelles (service_role uniquement) : `purchase_with_wallet`, `create_order_secure`, `create_order_backend`, `wallet_credit_backend`, `wallet_debit_backend`, `refund_order_to_wallet`, `create-payment`. À supprimer après vérification de non-usage côté frontend (non fait ici).
