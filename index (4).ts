import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// Retirée : cette fonction portait le nom "create-topup" mais exécutait un achat par wallet (débit).
// Les recharges se créent via la RPC create_wallet_topup (voir README). Réponse 410 pour tout appel résiduel.
Deno.serve(() => new Response(JSON.stringify({ success: false, error: { code: "GONE", message: "Use /api/customer/topup" } }),
  { status: 410, headers: { "Content-Type": "application/json" } }));
