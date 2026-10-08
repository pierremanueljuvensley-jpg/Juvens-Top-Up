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
