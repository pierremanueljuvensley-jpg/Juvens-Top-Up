-- JuvensTopUp — durcissement wallet / ledger / admin
-- Migration NON destructive : aucune donnée supprimée. Rien n'est appliqué automatiquement.
-- Schéma réel conservé : customers.wallet_balance (solde), transactions (ledger), wallet_topups, orders, payments,
-- admin_users (source des rôles), audit_logs. Aucune table dupliquée.
-- Prérequis : sauvegarde et test sur une base de développement.
-- IMPORTANT : cette migration n'a PAS été appliquée à la production. Les vérifications disponibles
-- sur le projet connecté sont en lecture seule ; exécuter les tests SQL sur une base de développement
-- avant tout déploiement. Le bloc ci-dessous arrête la migration si le schéma ou les données ne conviennent pas.

begin;

-- ---------------------------------------------------------------------------
-- 0. Préflight : dépendances de schéma et données existantes
-- ---------------------------------------------------------------------------
do $preflight$
declare
  v_missing text;
begin
  select string_agg(x.relname, ', ' order by x.relname) into v_missing
  from unnest(array[
    'public.customers','public.admin_users','public.products','public.orders',
    'public.payments','public.transactions','public.wallet_topups',
    'public.payment_methods','public.audit_logs'
  ]) as x(relname)
  where to_regclass(x.relname) is null;
  if v_missing is not null then
    raise exception 'migration_preflight_missing_tables: %', v_missing;
  end if;

  select string_agg(c.table_name || '.' || c.column_name, ', ' order by c.table_name, c.column_name)
    into v_missing
  from (values
    ('customers','id'),('customers','auth_user_id'),('customers','wallet_balance'),('customers','is_active'),('customers','updated_at'),
    ('admin_users','auth_user_id'),('admin_users','role'),('admin_users','is_active'),
    ('products','id'),('products','name'),('products','selling_price'),('products','currency'),('products','is_active'),('products','min_quantity'),('products','max_quantity'),('products','region'),('products','updated_at'),('products','supplier_product'),('products','cost_price'),('products','metadata'),
    ('orders','id'),('orders','customer_id'),('orders','product_id'),('orders','player_id'),('orders','server_id'),('orders','region'),('orders','quantity'),('orders','unit_price'),('orders','total_amount'),('orders','currency'),('orders','status'),('orders','buyer_ref'),('orders','paid_at'),('orders','metadata'),
    ('payments','order_id'),('payments','customer_id'),('payments','provider'),('payments','provider_reference'),('payments','amount'),('payments','currency'),('payments','status'),('payments','raw_response'),('payments','paid_at'),
    ('transactions','customer_id'),('transactions','order_id'),('transactions','type'),('transactions','amount'),('transactions','currency'),('transactions','balance_before'),('transactions','balance_after'),('transactions','description'),('transactions','reference'),
    ('wallet_topups','customer_id'),('wallet_topups','provider'),('wallet_topups','provider_reference'),('wallet_topups','amount'),('wallet_topups','currency'),('wallet_topups','status'),
    ('payment_methods','code'),('payment_methods','currency'),('payment_methods','is_active'),('payment_methods','min_amount'),('payment_methods','max_amount'),
    ('audit_logs','action'),('audit_logs','actor_uid'),('audit_logs','data')
  ) as c(table_name,column_name)
  where not exists (
    select 1 from information_schema.columns ic
    where ic.table_schema='public' and ic.table_name=c.table_name and ic.column_name=c.column_name
  );
  if v_missing is not null then
    raise exception 'migration_preflight_missing_columns: %', v_missing;
  end if;

  if exists (select 1 from public.transactions where amount <= 0) then
    raise exception 'migration_preflight_transactions_amount_not_positive';
  end if;
  if exists (select 1 from public.transactions where balance_before is not null and balance_after is not null
             and (balance_after < 0 or abs(balance_after - balance_before) <> amount)) then
    raise exception 'migration_preflight_transaction_balances_inconsistent';
  end if;
  if exists (select 1 from public.orders where buyer_ref is not null
             group by customer_id, buyer_ref having count(*) > 1) then
    raise exception 'migration_preflight_duplicate_customer_buyer_ref';
  end if;
  if exists (select 1 from public.products where is_active and currency <> 'HTG') then
    raise exception 'migration_preflight_active_products_must_use_HTG_for_wallet';
  end if;
  if not exists (select 1 from public.payment_methods where code='natcash' and currency='HTG' and is_active) then
    raise exception 'migration_preflight_natcash_HTG_not_active';
  end if;
end;
$preflight$;

-- ---------------------------------------------------------------------------
-- 0. Aide : contrôle admin réel (source de vérité = admin_users, modifiable uniquement par service_role)
-- ---------------------------------------------------------------------------
create or replace function public.is_admin_user(p_uid uuid, p_super boolean default false)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.admin_users a
    where a.auth_user_id = p_uid and a.is_active
      and (not p_super or a.role = 'super_admin')
  );
$$;

-- ---------------------------------------------------------------------------
-- 1. Ledger immuable (transactions) + audit_logs immuable
-- ---------------------------------------------------------------------------
alter table public.transactions add column if not exists actor_uid uuid references auth.users(id);
alter table public.transactions add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.transactions drop constraint if exists transactions_amount_positive;
alter table public.transactions add constraint transactions_amount_positive check (amount > 0) not valid;
alter table public.transactions validate constraint transactions_amount_positive;

alter table public.transactions drop constraint if exists transactions_balance_consistent;
alter table public.transactions add constraint transactions_balance_consistent
  check (balance_before is null or balance_after is null
         or (balance_after >= 0 and abs(balance_after - balance_before) = amount)) not valid;
alter table public.transactions validate constraint transactions_balance_consistent;

create or replace function public.block_ledger_mutation()
returns trigger language plpgsql set search_path = public
as $$
begin
  raise exception 'ledger_is_immutable' using errcode = '42501';
end;
$$;

drop trigger if exists transactions_no_update_delete on public.transactions;
create trigger transactions_no_update_delete before update or delete on public.transactions
  for each row execute function public.block_ledger_mutation();
drop trigger if exists transactions_no_truncate on public.transactions;
create trigger transactions_no_truncate before truncate on public.transactions
  for each statement execute function public.block_ledger_mutation();

drop trigger if exists audit_logs_no_update_delete on public.audit_logs;
create trigger audit_logs_no_update_delete before update or delete on public.audit_logs
  for each row execute function public.block_ledger_mutation();
drop trigger if exists audit_logs_no_truncate on public.audit_logs;
create trigger audit_logs_no_truncate before truncate on public.audit_logs
  for each statement execute function public.block_ledger_mutation();

-- ---------------------------------------------------------------------------
-- 2. Moindre privilège sur les tables (RLS reste en place ; TRUNCATE contournait RLS)
--    Constat : anon et authenticated avaient ALL (dont TRUNCATE) sur toutes les tables publiques.
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;

grant select on public.games, public.products, public.payment_methods to anon;
grant select on public.games, public.products, public.payment_methods,
                public.customers, public.orders, public.payments,
                public.transactions, public.wallet_topups to authenticated;
grant insert on public.customers to authenticated;      -- policy customers_insert_own (solde 0 imposé)
grant insert on public.wallet_topups to authenticated;  -- policy wallet_topups_insert_own (status pending imposé)

-- ---------------------------------------------------------------------------
-- 3. Idempotence par client (au lieu d'une unicité globale exploitable pour bloquer les références d'autrui)
-- ---------------------------------------------------------------------------
create unique index if not exists orders_customer_buyer_ref_key
  on public.orders (customer_id, buyer_ref) where buyer_ref is not null;

-- Supprime toute contrainte UNIQUE globale qui ne porte que sur buyer_ref, même si son nom
-- diffère du nom PostgreSQL habituel. Cela permet la même référence chez deux clients différents.
do $drop_global_buyer_ref$
declare v_constraint record;
begin
  for v_constraint in
    select conname from pg_constraint
    where conrelid = 'public.orders'::regclass and contype = 'u'
      and pg_get_constraintdef(oid) = 'UNIQUE (buyer_ref)'
  loop
    execute format('alter table public.orders drop constraint %I', v_constraint.conname);
  end loop;
end;
$drop_global_buyer_ref$;

-- ---------------------------------------------------------------------------
-- 4. Achat atomique par wallet (même signature : purchase-wallet continue de fonctionner)
-- ---------------------------------------------------------------------------
create or replace function public.create_wallet_order(
  p_customer_id uuid, p_product_id uuid, p_player_id text,
  p_server_id text default null, p_region text default null,
  p_quantity integer default 1, p_buyer_ref text default null)
returns public.orders
language plpgsql security definer set search_path = public
as $$
declare
  v_customer public.customers;
  v_product  public.products;
  v_order    public.orders;
  v_total    numeric;
  v_before   numeric;
  v_ref      text := nullif(btrim(coalesce(p_buyer_ref, '')), '');
  v_player   text := nullif(btrim(coalesce(p_player_id, '')), '');
begin
  if p_customer_id is null or p_product_id is null then raise exception 'invalid_request'; end if;
  if v_ref is null then raise exception 'buyer_ref_required'; end if;
  if length(v_ref) > 120 then raise exception 'buyer_ref_invalid'; end if;
  if v_player is null then raise exception 'player_id_required'; end if;
  if length(v_player) > 120 then raise exception 'player_id_invalid'; end if;
  if p_quantity is null or p_quantity < 1 then raise exception 'quantity_out_of_range'; end if;

  -- Verrou du client : sérialise tous ses achats (évite double débit / solde négatif concurrents)
  select * into v_customer from public.customers where id = p_customer_id for update;
  if not found or not v_customer.is_active then raise exception 'customer_not_found'; end if;

  -- Rejeu idempotent : même client + même buyer_ref => même commande, aucun nouveau débit
  select * into v_order from public.orders where customer_id = p_customer_id and buyer_ref = v_ref;
  if found then
    if v_order.product_id <> p_product_id or v_order.quantity <> p_quantity
       or v_order.player_id is distinct from v_player then
      raise exception 'idempotency_key_reuse';
    end if;
    return v_order;
  end if;

  select * into v_product from public.products where id = p_product_id and is_active = true for share;
  if not found then raise exception 'product_not_found'; end if;
  if p_quantity < v_product.min_quantity or p_quantity > v_product.max_quantity then
    raise exception 'quantity_out_of_range';
  end if;
  if v_product.selling_price is null or v_product.selling_price <= 0 then
    raise exception 'product_price_not_configured';
  end if;
  if v_product.currency <> 'HTG' then raise exception 'product_currency_not_supported_for_wallet'; end if;

  v_total := v_product.selling_price * p_quantity;      -- prix lu en base, jamais fourni par le client
  v_before := v_customer.wallet_balance;
  if v_before < v_total then raise exception 'insufficient_wallet_balance'; end if;

  insert into public.orders(customer_id, product_id, player_id, server_id, region, quantity,
                            unit_price, total_amount, currency, status, buyer_ref, paid_at, metadata)
  values (v_customer.id, v_product.id, v_player,
          nullif(btrim(coalesce(p_server_id, '')), ''),
          coalesce(nullif(btrim(coalesce(p_region, '')), ''), v_product.region),
          p_quantity, v_product.selling_price, v_total, v_product.currency, 'pending', v_ref, now(),
          jsonb_build_object('payment_source', 'wallet'))
  returning * into v_order;

  update public.customers set wallet_balance = wallet_balance - v_total, updated_at = now()
  where id = v_customer.id;

  insert into public.transactions(customer_id, order_id, type, amount, currency,
                                  balance_before, balance_after, description, reference)
  values (v_customer.id, v_order.id, 'debit', v_total, v_product.currency,
          v_before, v_before - v_total, 'Purchase: ' || v_product.name, 'ORDER-' || v_order.id::text);

  insert into public.payments(order_id, customer_id, provider, provider_reference, amount, currency,
                              status, raw_response, paid_at)
  values (v_order.id, v_customer.id, 'wallet', 'WALLET-' || v_order.id::text, v_total,
          v_product.currency, 'paid', jsonb_build_object('source', 'customer_wallet'), now());

  return v_order;   -- tout ou rien : une erreur annule commande, débit, ledger et paiement
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Création de recharge : toujours 'pending', bornes issues de payment_methods, plafond de recharges en attente
-- ---------------------------------------------------------------------------
create or replace function public.create_wallet_topup(p_amount numeric, p_provider text, p_currency text default 'HTG')
returns public.wallet_topups
language plpgsql set search_path = public
as $$
declare
  v_customer_id uuid;
  v_method public.payment_methods;
  v_topup public.wallet_topups;
  v_provider text := lower(btrim(coalesce(p_provider, '')));
begin
  if p_amount is null or p_amount <= 0 then raise exception 'amount_must_be_positive'; end if;
  if scale(p_amount) > 2 then raise exception 'amount_invalid_precision'; end if;
  if p_currency is distinct from 'HTG' then raise exception 'unsupported_currency'; end if;

  select * into v_method from public.payment_methods
  where code = v_provider and is_active = true and currency = p_currency;
  if not found then raise exception 'provider_not_available'; end if;
  if p_amount < v_method.min_amount or (v_method.max_amount is not null and p_amount > v_method.max_amount) then
    raise exception 'amount_out_of_range';
  end if;

  select id into v_customer_id from public.customers
  where auth_user_id = auth.uid() and is_active = true limit 1;
  if v_customer_id is null then raise exception 'customer_not_found'; end if;

  if (select count(*) from public.wallet_topups where customer_id = v_customer_id and status = 'pending') >= 5 then
    raise exception 'too_many_pending_topups';
  end if;

  insert into public.wallet_topups(customer_id, provider, amount, currency)
  values (v_customer_id, v_provider, p_amount, p_currency)
  returning * into v_topup;
  return v_topup;     -- le wallet n'est PAS crédité ici
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Fonctions admin : autorisation + audit DANS la même transaction que l'opération
-- ---------------------------------------------------------------------------
create or replace function public.admin_approve_topup(p_actor uuid, p_topup_id uuid, p_provider_reference text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare v_result jsonb; v_ref text := nullif(btrim(coalesce(p_provider_reference, '')), '');
begin
  if not public.is_admin_user(p_actor) then raise exception 'admin_required' using errcode = '42501'; end if;
  if v_ref is null then raise exception 'provider_reference_required'; end if;
  if length(v_ref) > 120 then raise exception 'provider_reference_invalid'; end if;

  v_result := public.admin_credit_wallet_topup(p_topup_id, v_ref);   -- verrou topup + client, idempotent

  insert into public.audit_logs(action, actor_uid, data)
  values ('wallet_topup_approved', p_actor,
          jsonb_build_object('topup_id', p_topup_id, 'provider_reference', v_ref, 'result', v_result));
  return v_result;
end;
$$;

create or replace function public.admin_order_action(
  p_actor uuid, p_order_id uuid, p_action text, p_note text default null, p_supplier_order_id text default null)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare v_order public.orders; v_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if not public.is_admin_user(p_actor) then raise exception 'admin_required' using errcode = '42501'; end if;
  if p_action not in ('start', 'complete', 'fail') then raise exception 'invalid_action'; end if;
  if p_action = 'fail' and v_note is null then raise exception 'failure_reason_required'; end if;
  if length(coalesce(v_note, '')) > 1000 then raise exception 'note_too_long'; end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'order_not_found'; end if;

  if p_action = 'start' then
    v_order := public.mark_order_processing(p_order_id, 'MANUAL', p_supplier_order_id, 'manual_processing');
  elsif p_action = 'complete' then
    if v_order.status <> 'processing' then raise exception 'order_not_processing'; end if;
    v_order := public.mark_order_delivered(p_order_id, p_supplier_order_id, v_note, 'manual_delivered');
  else
    v_order := public.fail_order_and_refund(p_order_id, v_note, p_supplier_order_id, 'manual_failed');
  end if;

  insert into public.audit_logs(action, actor_uid, data)
  values ('order_' || p_action, p_actor,
          jsonb_build_object('order_id', p_order_id, 'note', v_note,
                             'supplier_order_id', p_supplier_order_id, 'status_after', v_order.status));
  return to_jsonb(v_order);
end;
$$;

-- Ajustement administratif : super_admin uniquement, jamais sur son propre compte, idempotent par référence.
create or replace function public.admin_adjust_wallet(
  p_actor uuid, p_customer_id uuid, p_direction text, p_amount numeric, p_reason text, p_reference text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_customer public.customers; v_before numeric; v_after numeric;
  v_ref text := 'ADJ-' || nullif(btrim(coalesce(p_reference, '')), '');
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
  v_existing public.transactions;
begin
  if not public.is_admin_user(p_actor, true) then raise exception 'super_admin_required' using errcode = '42501'; end if;
  if p_direction not in ('credit', 'debit') then raise exception 'invalid_direction'; end if;
  if p_amount is null or p_amount <= 0 or scale(p_amount) > 2 then raise exception 'invalid_amount'; end if;
  if v_reason is null or length(v_reason) < 5 or length(v_reason) > 500 then raise exception 'reason_required'; end if;
  if p_reference is null or length(btrim(p_reference)) < 8 or length(p_reference) > 100 then
    raise exception 'reference_required';
  end if;

  select * into v_customer from public.customers where id = p_customer_id for update;
  if not found then raise exception 'customer_not_found'; end if;
  if v_customer.auth_user_id = p_actor then raise exception 'self_adjustment_forbidden'; end if;

  select * into v_existing from public.transactions where reference = v_ref;
  if found then
    return jsonb_build_object('success', true, 'duplicate', true, 'balance_after', v_existing.balance_after);
  end if;

  v_before := v_customer.wallet_balance;
  v_after := case when p_direction = 'credit' then v_before + p_amount else v_before - p_amount end;
  if v_after < 0 then raise exception 'insufficient_wallet_balance'; end if;

  update public.customers set wallet_balance = v_after, updated_at = now() where id = v_customer.id;

  insert into public.transactions(customer_id, type, amount, currency, balance_before, balance_after,
                                  description, reference, actor_uid, metadata)
  values (v_customer.id, 'adjustment', p_amount, 'HTG', v_before, v_after,
          'Admin adjustment: ' || v_reason, v_ref, p_actor,
          jsonb_build_object('direction', p_direction, 'reason', v_reason));

  insert into public.audit_logs(action, actor_uid, data)
  values ('wallet_adjustment', p_actor,
          jsonb_build_object('customer_id', p_customer_id, 'direction', p_direction, 'amount', p_amount,
                             'reason', v_reason, 'reference', v_ref, 'balance_before', v_before, 'balance_after', v_after));

  return jsonb_build_object('success', true, 'duplicate', false, 'balance_after', v_after);
end;
$$;

create or replace function public.admin_update_product(p_actor uuid, p_product_id uuid, p_patch jsonb)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_old public.products; v_new public.products; k text;
  v_allowed text[] := array['selling_price', 'cost_price', 'is_active', 'supplier_product', 'metadata'];
begin
  if not public.is_admin_user(p_actor) then raise exception 'admin_required' using errcode = '42501'; end if;
  if p_patch is null or jsonb_typeof(p_patch) <> 'object' or p_patch = '{}'::jsonb then raise exception 'no_editable_fields'; end if;
  for k in select jsonb_object_keys(p_patch) loop
    if not (k = any (v_allowed)) then raise exception 'unknown_field'; end if;
  end loop;
  if p_patch ? 'selling_price' and (jsonb_typeof(p_patch->'selling_price') <> 'number'
     or (p_patch->>'selling_price')::numeric <= 0 or (p_patch->>'selling_price')::numeric > 100000000) then
    raise exception 'invalid_selling_price'; end if;
  if p_patch ? 'cost_price' and (jsonb_typeof(p_patch->'cost_price') <> 'number'
     or (p_patch->>'cost_price')::numeric < 0 or (p_patch->>'cost_price')::numeric > 100000000) then
    raise exception 'invalid_cost_price'; end if;
  if p_patch ? 'is_active' and jsonb_typeof(p_patch->'is_active') <> 'boolean' then raise exception 'invalid_is_active'; end if;
  if p_patch ? 'supplier_product' and jsonb_typeof(p_patch->'supplier_product') not in ('string', 'null') then
    raise exception 'invalid_supplier_product'; end if;
  if p_patch ? 'metadata' and jsonb_typeof(p_patch->'metadata') <> 'object' then raise exception 'invalid_metadata'; end if;

  select * into v_old from public.products where id = p_product_id for update;
  if not found then raise exception 'product_not_found'; end if;

  update public.products set
    selling_price    = case when p_patch ? 'selling_price' then (p_patch->>'selling_price')::numeric else selling_price end,
    cost_price       = case when p_patch ? 'cost_price' then (p_patch->>'cost_price')::numeric else cost_price end,
    is_active        = case when p_patch ? 'is_active' then (p_patch->>'is_active')::boolean else is_active end,
    supplier_product = case when p_patch ? 'supplier_product' then p_patch->>'supplier_product' else supplier_product end,
    metadata         = case when p_patch ? 'metadata' then p_patch->'metadata' else metadata end,
    updated_at = now()
  where id = p_product_id returning * into v_new;

  insert into public.audit_logs(action, actor_uid, data)
  values ('product_update', p_actor,
          jsonb_build_object('product_id', p_product_id, 'patch', p_patch,
            'before', jsonb_build_object('selling_price', v_old.selling_price, 'cost_price', v_old.cost_price,
                                         'is_active', v_old.is_active, 'supplier_product', v_old.supplier_product)));
  return to_jsonb(v_new);
end;
$$;

-- Le remboursement "cancel" passait par la surcharge 2 arguments (sans mise à jour de payments) : on route vers la version complète.
create or replace function public.cancel_order_and_refund(p_order_id uuid, p_reason text default 'Order cancelled')
returns public.orders
language plpgsql security definer set search_path = public
as $$
begin
  return public.fail_order_and_refund(p_order_id, p_reason, null::text, null::text);
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Droits d'exécution : service_role uniquement (le client ne peut appeler aucune fonction financière/admin)
-- ---------------------------------------------------------------------------
revoke all on function public.is_admin_user(uuid, boolean) from public, anon, authenticated;
revoke all on function public.create_wallet_order(uuid, uuid, text, text, text, integer, text) from public, anon, authenticated;
revoke all on function public.admin_approve_topup(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.admin_order_action(uuid, uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.admin_adjust_wallet(uuid, uuid, text, numeric, text, text) from public, anon, authenticated;
revoke all on function public.admin_update_product(uuid, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.cancel_order_and_refund(uuid, text) from public, anon, authenticated;
revoke all on function public.block_ledger_mutation() from public, anon, authenticated;
grant execute on function public.is_admin_user(uuid, boolean) to service_role;
grant execute on function public.create_wallet_order(uuid, uuid, text, text, text, integer, text) to service_role;
grant execute on function public.admin_approve_topup(uuid, uuid, text) to service_role;
grant execute on function public.admin_order_action(uuid, uuid, text, text, text) to service_role;
grant execute on function public.admin_adjust_wallet(uuid, uuid, text, numeric, text, text) to service_role;
grant execute on function public.admin_update_product(uuid, uuid, jsonb) to service_role;
grant execute on function public.cancel_order_and_refund(uuid, text) to service_role;
-- create_wallet_topup reste exécutable par 'authenticated' (identité = auth.uid(), RLS appliquée).
revoke all on function public.create_wallet_topup(numeric, text, text) from public, anon;
grant execute on function public.create_wallet_topup(numeric, text, text) to authenticated, service_role;

commit;
