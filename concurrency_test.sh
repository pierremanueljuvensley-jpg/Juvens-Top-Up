#!/usr/bin/env bash
# Test de concurrence RÉEL (2 connexions). À lancer sur une base de DÉVELOPPEMENT uniquement.
#   DEV_DATABASE_URL=postgres://... ./supabase/tests/concurrency_test.sh
# Principe : le client a 100 HTG ; deux achats de 100 HTG partent en même temps avec des buyer_ref différents.
# Résultat attendu : exactement 1 achat réussi, 1 refus insufficient_wallet_balance, solde final 0, jamais négatif.
set -euo pipefail
: "${DEV_DATABASE_URL:?DEV_DATABASE_URL requis}"
Q() { psql "$DEV_DATABASE_URL" -v ON_ERROR_STOP=1 -At -c "$1"; }
UID1=$(uuidgen | tr A-Z a-z)
Q "insert into auth.users(id,email) values ('$UID1','conc-$UID1@test.local')"
CID=$(Q "select id from public.customers where auth_user_id='$UID1'")
GID=$(Q "insert into public.games(name,slug) values ('Conc $UID1','conc-$UID1') returning id")
PID=$(Q "insert into public.products(game_id,name,selling_price,currency) values ('$GID','Conc',100,'HTG') returning id")
ADM=$(uuidgen | tr A-Z a-z); Q "insert into auth.users(id,email) values ('$ADM','adm-$ADM@test.local')"
Q "insert into public.admin_users(auth_user_id,role) values ('$ADM','super_admin')"
Q "select public.admin_adjust_wallet('$ADM','$CID','credit',100,'seed concurrence','seed-$UID1')" >/dev/null
buy() { psql "$DEV_DATABASE_URL" -At -c "select id from public.create_wallet_order('$CID','$PID','player',null,null,1,'$1')" 2>&1 | tail -1; }
buy "conc-a-$UID1" > /tmp/conc_a.out & buy "conc-b-$UID1" > /tmp/conc_b.out & wait
echo "A: $(cat /tmp/conc_a.out)"; echo "B: $(cat /tmp/conc_b.out)"
BAL=$(Q "select wallet_balance from public.customers where id='$CID'")
ORD=$(Q "select count(*) from public.orders where customer_id='$CID'")
echo "solde final=$BAL commandes=$ORD"
[ "$BAL" = "0.00" ] || [ "$BAL" = "0" ] || { echo "ECHEC: solde inattendu"; exit 1; }
[ "$ORD" = "1" ] || { echo "ECHEC: attendu 1 commande"; exit 1; }
echo "OK : un seul achat accepté, pas de solde négatif"
# nettoyage des données de test : ledger/audit immuables => à supprimer en recréant la branche de dev (reset_branch)
