-- Tests SQL du wallet (à exécuter sur une BRANCHE / base de développement, jamais directement en production).
--   psql "$DEV_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/wallet_tests.sql
-- Tout s'exécute dans une transaction annulée à la fin (ROLLBACK) : aucune donnée conservée.
-- Un échec lève une exception et interrompt le script ; chaque succès affiche "PASS".
begin;

create function pg_temp.assert(p_ok boolean, p_name text) returns void language plpgsql as $f$
begin
  if not coalesce(p_ok, false) then raise exception 'FAIL: %', p_name; end if;
  raise notice 'PASS: %', p_name;
end $f$;

-- Exécute p_sql sous p_role (ou le rôle courant si null) et exige une erreur contenant p_expected.
create function pg_temp.expect_error(p_sql text, p_expected text, p_name text, p_role text default null) returns void language plpgsql as $f$
declare v_msg text;
begin
  begin
    if p_role is not null then execute 'set local role ' || p_role; end if;
    execute p_sql;
    v_msg := null;
  exception when others then
    v_msg := sqlerrm;
  end;
  if p_role is not null then execute 'reset role'; end if;
  if v_msg is null then raise exception 'FAIL: % (aucune erreur levée)', p_name; end if;
  if v_msg not ilike '%' || p_expected || '%' then raise exception 'FAIL: % (erreur reçue: %)', p_name, v_msg; end if;
  raise notice 'PASS: % [%]', p_name, v_msg;
end $f$;

do $t$
declare
  u1 uuid := gen_random_uuid(); u2 uuid := gen_random_uuid();      -- clients
  ua uuid := gen_random_uuid(); us uuid := gen_random_uuid();      -- admin, super_admin
  c1 uuid; c2 uuid; g uuid; p100 uuid; p300 uuid; pinactive uuid; pzero uuid;
  tp uuid; tp2 uuid; o1 uuid; o2 uuid; o3 uuid; ord public.orders; r jsonb;
  bal numeric; n int; i int;
begin
  -- ---------- Jeu de données ----------
  insert into auth.users(id, email) values (u1,'c1@test.local'),(u2,'c2@test.local'),(ua,'a@test.local'),(us,'s@test.local');
  select id into c1 from public.customers where auth_user_id = u1;
  select id into c2 from public.customers where auth_user_id = u2;
  perform pg_temp.assert(c1 is not null and c2 is not null, 'clients créés par le trigger Auth');
  insert into public.admin_users(auth_user_id, role) values (ua,'admin'),(us,'super_admin');
  insert into public.games(name, slug) values ('Test Game','test-game-'||u1) returning id into g;
  insert into public.products(game_id,name,selling_price,currency,min_quantity,max_quantity) values (g,'P100',100,'HTG',1,10) returning id into p100;
  insert into public.products(game_id,name,selling_price,currency,min_quantity,max_quantity) values (g,'P300',300,'HTG',1,10) returning id into p300;
  insert into public.products(game_id,name,selling_price,currency,is_active) values (g,'Off',100,'HTG',false) returning id into pinactive;
  insert into public.products(game_id,name,selling_price,currency) values (g,'Zero',0,'HTG') returning id into pzero;

  -- ---------- RECHARGE : pending, pas de crédit ----------
  perform set_config('request.jwt.claims', json_build_object('sub',u1,'role','authenticated')::text, true);
  execute 'set local role authenticated';
  select id into tp from public.create_wallet_topup(500,'natcash','HTG');
  execute 'reset role';
  select wallet_balance into bal from public.customers where id=c1;
  perform pg_temp.assert(bal = 0 and (select status from public.wallet_topups where id=tp)='pending', 'recharge créée en pending, wallet NON crédité');
  perform pg_temp.assert((select count(*) from public.transactions where customer_id=c1)=0, 'aucune écriture ledger pour une recharge pending');

  perform pg_temp.expect_error(format('select public.create_wallet_topup(10,%L,%L)','natcash','HTG'), 'amount_out_of_range', 'recharge sous le minimum refusée', 'authenticated');
  perform pg_temp.expect_error(format('select public.create_wallet_topup(100,%L,%L)','moncash','HTG'), 'provider_not_available', 'provider inactif refusé', 'authenticated');
  perform pg_temp.expect_error(format('select public.create_wallet_topup(-5,%L,%L)','natcash','HTG'), 'amount_must_be_positive', 'montant négatif refusé', 'authenticated');
  perform pg_temp.expect_error(format('select public.create_wallet_topup(100.123,%L,%L)','natcash','HTG'), 'amount_invalid_precision', 'précision > 2 décimales refusée', 'authenticated');

  -- ---------- AUTORISATION ----------
  perform pg_temp.expect_error(format('select public.admin_approve_topup(%L,%L,%L)',u1,tp,'NC-REF-0001'), 'permission denied', 'client ne peut pas appeler admin_approve_topup', 'authenticated');
  perform pg_temp.expect_error(format('select public.admin_approve_topup(%L,%L,%L)',u1,tp,'NC-REF-0001'), 'admin_required', 'non-admin refusé (même via service_role)');
  perform pg_temp.expect_error(format('select public.admin_approve_topup(%L,%L,%L)',ua,tp,'  '), 'provider_reference_required', 'approbation sans référence refusée');
  perform pg_temp.expect_error(format('update public.customers set wallet_balance=1000000 where id=%L',c1), 'permission denied', 'client ne peut pas modifier son solde', 'authenticated');
  perform pg_temp.expect_error('truncate public.transactions', 'permission denied', 'client ne peut pas TRUNCATE le ledger', 'authenticated');
  perform pg_temp.expect_error(format('select public.create_wallet_order(%L,%L,%L)',c1,p100,'x'), 'permission denied', 'client ne peut pas appeler create_wallet_order', 'authenticated');

  -- ---------- APPROBATION + double confirmation ----------
  r := public.admin_approve_topup(ua, tp, 'NC-REF-0001');
  select wallet_balance into bal from public.customers where id=c1;
  perform pg_temp.assert(bal = 500, 'recharge approuvée : +500');
  r := public.admin_approve_topup(ua, tp, 'NC-REF-0001');
  select wallet_balance into bal from public.customers where id=c1;
  perform pg_temp.assert(bal = 500 and (select count(*) from public.transactions where customer_id=c1 and type='credit')=1, 'confirmation répétée : un seul crédit');
  perform pg_temp.assert((select count(*) from public.audit_logs where action='wallet_topup_approved' and actor_uid=ua)=2, 'approbations auditées');
  execute 'set local role authenticated';
  select id into tp2 from public.create_wallet_topup(100,'natcash','HTG');
  execute 'reset role';
  perform pg_temp.expect_error(format('select public.admin_approve_topup(%L,%L,%L)',ua,tp2,'NC-REF-0001'), 'duplicate key', 'même référence Natcash sur 2 recharges refusée');
  for i in 1..4 loop
    execute 'set local role authenticated'; perform public.create_wallet_topup(100,'natcash','HTG'); execute 'reset role';
  end loop;
  perform pg_temp.expect_error(format('select public.create_wallet_topup(100,%L,%L)','natcash','HTG'), 'too_many_pending_topups', 'plafond de recharges pending', 'authenticated');
  -- (ci-dessus, set_config reste u1)

  -- ---------- ACHAT ----------
  o1 := (public.create_wallet_order(c1,p100,'player-1',null,null,2,'ref-purchase-0001')).id;
  select wallet_balance into bal from public.customers where id=c1;
  perform pg_temp.assert(bal = 300, 'achat 2x100 : solde 500 -> 300 (prix lu en base)');
  perform pg_temp.assert((select total_amount from public.orders where id=o1)=200 and (select status from public.orders where id=o1)='pending', 'commande créée, total calculé serveur');
  perform pg_temp.assert((select balance_before||'>'||balance_after from public.transactions where reference='ORDER-'||o1)='500.00>300.00' or
                         (select balance_before from public.transactions where reference='ORDER-'||o1)=500, 'ledger PURCHASE_DEBIT balance_before/after');
  perform pg_temp.assert(exists(select 1 from public.payments where order_id=o1 and status='paid' and provider='wallet'), 'paiement wallet enregistré');

  -- idempotence : même clé, aucun double débit
  o2 := (public.create_wallet_order(c1,p100,'player-1',null,null,2,'ref-purchase-0001')).id;
  select wallet_balance into bal from public.customers where id=c1;
  perform pg_temp.assert(o2 = o1 and bal = 300 and (select count(*) from public.orders where customer_id=c1)=1, 'même buyer_ref x2 : même commande, un seul débit');
  perform pg_temp.expect_error(format('select public.create_wallet_order(%L,%L,%L,null,null,3,%L)',c1,p100,'player-1','ref-purchase-0001'), 'idempotency_key_reuse', 'buyer_ref réutilisé avec autre quantité refusé');
  perform pg_temp.expect_error(format('select public.create_wallet_order(%L,%L,%L,null,null,1,null)',c1,p100,'player-1'), 'buyer_ref_required', 'buyer_ref obligatoire');
  -- un autre client peut utiliser la même chaîne (idempotence par client)
  perform public.admin_adjust_wallet(us, c2, 'credit', 100, 'seed test client 2', 'seed-c2-00001');
  o3 := (public.create_wallet_order(c2,p100,'player-2',null,null,1,'ref-purchase-0001')).id;
  perform pg_temp.assert(o3 <> o1, 'buyer_ref identique chez un autre client : commande distincte');

  -- solde insuffisant / exactement égal
  perform pg_temp.expect_error(format('select public.create_wallet_order(%L,%L,%L,null,null,2,%L)',c1,p300,'player-1','ref-purchase-0002'), 'insufficient_wallet_balance', 'solde insuffisant (600 > 300) refusé');
  perform pg_temp.assert((select wallet_balance from public.customers where id=c1)=300 and (select count(*) from public.orders where customer_id=c1)=1, 'échec : solde et commandes inchangés');
  perform public.create_wallet_order(c1,p300,'player-1',null,null,1,'ref-purchase-0003');
  perform pg_temp.assert((select wallet_balance from public.customers where id=c1)=0, 'solde exactement égal au prix : achat accepté, solde 0');
  perform pg_temp.expect_error(format('select public.create_wallet_order(%L,%L,%L,null,null,1,%L)',c1,p100,'player-1','ref-purchase-0004'), 'insufficient_wallet_balance', 'solde 0 : achat refusé, pas de solde négatif');

  -- produit
  perform pg_temp.expect_error(format('select public.create_wallet_order(%L,%L,%L,null,null,1,%L)',c2,pinactive,'p','ref-inactive-001'), 'product_not_found', 'produit désactivé refusé');
  perform pg_temp.expect_error(format('select public.create_wallet_order(%L,%L,%L,null,null,1,%L)',c2,gen_random_uuid(),'p','ref-unknown-001'), 'product_not_found', 'produit inexistant refusé');
  perform pg_temp.expect_error(format('select public.create_wallet_order(%L,%L,%L,null,null,1,%L)',c2,pzero,'p','ref-zero-0001'), 'product_price_not_configured', 'prix 0 refusé');
  perform pg_temp.expect_error(format('select public.create_wallet_order(%L,%L,%L,null,null,0,%L)',c2,p100,'p','ref-qty0-0001'), 'quantity_out_of_range', 'quantité 0 refusée');
  perform pg_temp.expect_error(format('select public.create_wallet_order(%L,%L,%L,null,null,11,%L)',c2,p100,'p','ref-qty11-001'), 'quantity_out_of_range', 'quantité > max refusée');

  -- ---------- ROLLBACK COMPLET après erreur tardive ----------
  perform public.admin_adjust_wallet(us, c2, 'credit', 100, 'seed rollback test', 'seed-c2-00002');
  n := (select count(*) from public.transactions where customer_id = c2);
  create function pg_temp.boom() returns trigger language plpgsql as $f$ begin raise exception 'simulated_failure'; end $f$;
  create trigger boom before insert on public.payments for each row execute function pg_temp.boom();
  perform pg_temp.expect_error(format('select public.create_wallet_order(%L,%L,%L,null,null,1,%L)',c2,p100,'p','ref-rollback-01'), 'simulated_failure', 'échec injecté à la dernière étape (paiement)');
  drop trigger boom on public.payments;
  perform pg_temp.assert((select wallet_balance from public.customers where id=c2)=100
    and not exists(select 1 from public.orders where buyer_ref='ref-rollback-01')
    and (select count(*) from public.transactions where customer_id=c2)=n, 'rollback : ni débit, ni commande, ni ligne de ledger');

  -- ---------- REMBOURSEMENT / cycle de vie ----------
  o1 := (public.create_wallet_order(c2,p100,'player-2',null,null,1,'ref-refund-0001')).id;
  perform pg_temp.assert((select wallet_balance from public.customers where id=c2)=0, 'achat avant remboursement : solde 0');
  perform pg_temp.expect_error(format('select public.admin_order_action(%L,%L,%L,null,null)',u1,o1,'fail'), 'admin_required', 'client ne peut pas agir sur une commande');
  perform pg_temp.expect_error(format('select public.admin_order_action(%L,%L,%L,null,null)',ua,o1,'fail'), 'failure_reason_required', 'échec sans motif refusé');
  perform pg_temp.expect_error(format('select public.admin_order_action(%L,%L,%L,null,null)',ua,o1,'complete'), 'order_not_processing', 'complete exige processing');
  r := public.admin_order_action(ua, o1, 'fail', 'fournisseur indisponible', null);
  perform pg_temp.assert((select wallet_balance from public.customers where id=c2)=100 and (select status from public.orders where id=o1)='refunded', 'fail : commande remboursée, solde restauré');
  perform pg_temp.assert((select count(*) from public.transactions where reference='REFUND-ORDER-'||o1 and type='refund')=1
    and exists(select 1 from public.payments where order_id=o1 and status='refunded'), 'remboursement = nouvelle écriture ledger + paiement marqué refunded');
  r := public.admin_order_action(ua, o1, 'fail', 'rejeu', null);
  perform pg_temp.assert((select wallet_balance from public.customers where id=c2)=100 and (select count(*) from public.transactions where type='refund' and order_id=o1)=1, 'remboursement répété : pas de double crédit');
  o2 := (public.create_wallet_order(c2,p100,'player-2',null,null,1,'ref-refund-0002')).id;
  perform public.admin_order_action(ua, o2, 'start', null, 'MAN-1');
  perform public.admin_order_action(ua, o2, 'complete', 'livré', 'MAN-1');
  perform pg_temp.expect_error(format('select public.admin_order_action(%L,%L,%L,%L,null)',ua,o2,'fail','tardif'), 'delivered_order_cannot_refund', 'commande livrée non remboursable');
  perform pg_temp.assert((select count(*) from public.audit_logs where action like 'order_%' and actor_uid=ua)>=4, 'actions commande auditées');

  -- ---------- AJUSTEMENTS ADMIN ----------
  perform pg_temp.expect_error(format('select public.admin_adjust_wallet(%L,%L,%L,10,%L,%L)',ua,c1,'credit','raison valable','adj-ref-0001'), 'super_admin_required', 'admin simple ne peut pas ajuster');
  perform pg_temp.expect_error(format('select public.admin_adjust_wallet(%L,%L,%L,10,%L,%L)',us,(select id from public.customers where auth_user_id=us),'credit','raison valable','adj-ref-0002'), 'self_adjustment_forbidden', 'auto-ajustement interdit');
  perform pg_temp.expect_error(format('select public.admin_adjust_wallet(%L,%L,%L,10,%L,%L)',us,c1,'credit','','adj-ref-0003'), 'reason_required', 'motif obligatoire');
  perform pg_temp.expect_error(format('select public.admin_adjust_wallet(%L,%L,%L,1000,%L,%L)',us,c1,'debit','raison valable','adj-ref-0004'), 'insufficient_wallet_balance', 'ajustement débiteur ne crée pas de solde négatif');
  perform public.admin_adjust_wallet(us, c1, 'credit', 50, 'geste commercial', 'adj-ref-0005');
  r := public.admin_adjust_wallet(us, c1, 'credit', 50, 'geste commercial', 'adj-ref-0005');
  perform pg_temp.assert((select wallet_balance from public.customers where id=c1)=50 and (r->>'duplicate')='true', 'ajustement répété (même référence) : appliqué une seule fois');
  perform pg_temp.assert(exists(select 1 from public.transactions where type='adjustment' and actor_uid=us and customer_id=c1) and exists(select 1 from public.audit_logs where action='wallet_adjustment' and actor_uid=us), 'ajustement tracé dans le ledger et l''audit');

  -- ---------- LEDGER IMMUABLE ----------
  perform pg_temp.expect_error('update public.transactions set amount = amount + 1', 'ledger_is_immutable', 'UPDATE du ledger interdit (même propriétaire)');
  perform pg_temp.expect_error('delete from public.transactions', 'ledger_is_immutable', 'DELETE du ledger interdit');
  perform pg_temp.expect_error('truncate public.transactions', 'ledger_is_immutable', 'TRUNCATE du ledger interdit');
  perform pg_temp.expect_error('update public.audit_logs set action = action', 'ledger_is_immutable', 'audit_logs immuable');

  -- ---------- PRODUITS ----------
  r := public.admin_update_product(ua, p100, '{"selling_price":120}'::jsonb);
  perform pg_temp.assert((select (data->'before'->>'selling_price')::numeric from public.audit_logs where action='product_update' order by created_at desc limit 1)=100, 'changement de prix audité (avant/après)');
  perform pg_temp.expect_error(format('select public.admin_update_product(%L,%L,%L::jsonb)',ua,p100,'{"wallet_balance":1}'), 'unknown_field', 'champ inconnu refusé');
  perform pg_temp.expect_error(format('select public.admin_update_product(%L,%L,%L::jsonb)',ua,p100,'{"selling_price":0}'), 'invalid_selling_price', 'prix 0 refusé');
  perform pg_temp.expect_error(format('select public.admin_update_product(%L,%L,%L::jsonb)',u1,p100,'{"is_active":false}'), 'admin_required', 'client ne peut pas modifier un produit');

  -- ---------- COHÉRENCE GLOBALE solde = ledger ----------
  perform pg_temp.assert(not exists (
    select 1 from public.customers c
    where c.id in (c1, c2)
      and c.wallet_balance <> coalesce((select sum(case
            when t.type in ('credit','refund') then t.amount
            when t.type = 'debit' then -t.amount
            when t.type = 'adjustment' and t.metadata->>'direction' = 'credit' then t.amount
            when t.type = 'adjustment' then -t.amount end)
          from public.transactions t where t.customer_id = c.id), 0)), 'solde de chaque client = somme du ledger');
  perform pg_temp.assert(not exists(select 1 from public.customers where wallet_balance < 0), 'aucun solde négatif');
end $t$;

rollback;
