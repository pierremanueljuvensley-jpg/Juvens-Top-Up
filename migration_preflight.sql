-- Lecture seule : à lancer avant la migration pour repérer les blocages connus.
-- Exemple : psql "$DEV_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/migration_preflight.sql
select 'orders' as check_name, count(*)::bigint as row_count from public.orders
union all select 'transactions', count(*) from public.transactions
union all select 'audit_logs', count(*) from public.audit_logs;

select 'duplicate_customer_buyer_ref' as check_name, customer_id::text, buyer_ref, count(*)::bigint as occurrences
from public.orders where buyer_ref is not null
group by customer_id, buyer_ref having count(*) > 1;

select 'invalid_transaction_amount' as check_name, id::text, amount::text
from public.transactions where amount <= 0;

select 'inconsistent_transaction_balance' as check_name, id::text, balance_before::text, balance_after::text, amount::text
from public.transactions
where balance_before is not null and balance_after is not null
  and (balance_after < 0 or abs(balance_after - balance_before) <> amount);

select 'active_product_not_HTG' as check_name, id::text, currency
from public.products where is_active and currency <> 'HTG';

select 'natcash_HTG_active' as check_name, code, currency, is_active
from public.payment_methods where code='natcash' and currency='HTG';
