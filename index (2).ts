import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// CORS : liste blanche (ALLOWED_ORIGINS, défaut = frontend Cloudflare Pages). Jamais "*".
const ALLOWED = (Deno.env.get("ALLOWED_ORIGINS") ?? "https://juvenstopup.pages.dev")
  .split(",").map((s) => s.trim()).filter(Boolean);
const headersFor = (req: Request) => {
  const h: Record<string, string> = {
    "Content-Type": "application/json", "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
  const o = req.headers.get("origin");
  if (o && ALLOWED.includes(o)) h["Access-Control-Allow-Origin"] = o;
  return h;
};

// Erreurs métier connues -> [statut HTTP, message public]. Tout le reste = 500 générique (aucun détail SQL exposé).
const KNOWN: Record<string, [number, string]> = {
  insufficient_wallet_balance: [409, "Insufficient wallet balance"],
  product_not_found: [404, "Product is unavailable"],
  product_price_not_configured: [409, "Product price is not configured"],
  product_currency_not_supported_for_wallet: [409, "Product cannot be paid with the wallet"],
  quantity_out_of_range: [400, "Quantity is outside the allowed range"],
  buyer_ref_required: [400, "buyer_ref is required"],
  buyer_ref_invalid: [400, "buyer_ref is invalid"],
  idempotency_key_reuse: [409, "buyer_ref was already used for a different purchase"],
  player_id_required: [400, "Player ID is required"],
  player_id_invalid: [400, "Player ID is invalid"],
  customer_not_found: [403, "Customer account is not active"],
  admin_required: [403, "Admin access required"],
  super_admin_required: [403, "Super admin access required"],
  provider_reference_required: [400, "provider_reference is required"],
  provider_reference_invalid: [400, "provider_reference is invalid"],
  wallet_topup_not_found: [404, "Top-up not found"],
  wallet_topup_not_approvable: [409, "Top-up cannot be approved in its current state"],
  order_not_found: [404, "Order not found"],
  order_not_processing: [409, "Order must be processing"],
  invalid_order_state: [409, "Order state does not allow this action"],
  delivered_order_cannot_refund: [409, "Delivered order cannot be refunded"],
  order_already_closed: [409, "Order is already closed"],
  failure_reason_required: [400, "A failure reason is required"],
  note_too_long: [400, "Note is too long"],
  invalid_action: [400, "Invalid action"],
  self_adjustment_forbidden: [403, "Adjusting your own wallet is forbidden"],
  invalid_amount: [400, "Invalid amount"],
  invalid_direction: [400, "Invalid direction"],
  reason_required: [400, "A reason of at least 5 characters is required"],
  reference_required: [400, "A unique reference of at least 8 characters is required"],
  product_not_found_admin: [404, "Product not found"],
  unknown_field: [400, "Unknown field"],
  no_editable_fields: [400, "No editable fields supplied"],
  invalid_selling_price: [400, "selling_price is invalid"],
  invalid_cost_price: [400, "cost_price is invalid"],
  invalid_is_active: [400, "is_active must be boolean"],
  invalid_supplier_product: [400, "supplier_product is invalid"],
  invalid_metadata: [400, "metadata must be an object"],
};

const fail = (req: Request, code: string, message: string, status: number) =>
  new Response(JSON.stringify({ success: false, error: { code: code.toUpperCase(), message } }),
    { status, headers: headersFor(req) });
const ok = (req: Request, body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: headersFor(req) });

async function authenticate(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return { error: fail(req, "auth_required", "Authentication required", 401) };
  const url = Deno.env.get("SUPABASE_URL");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const pub = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (!url || !service || !pub) return { error: fail(req, "server_misconfigured", "Service unavailable", 500) };
  const r = await fetch(`${url}/auth/v1/user`, { headers: { apikey: pub, Authorization: auth } });
  if (!r.ok) return { error: fail(req, "invalid_token", "Invalid or expired session", 401) };
  const user = await r.json();
  if (!user?.id) return { error: fail(req, "invalid_token", "Invalid or expired session", 401) };
  const svc = { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json" };
  return { user, url, svc };
}

async function rpc(url: string, svc: Record<string, string>, name: string, params: Record<string, unknown>) {
  const r = await fetch(`${url}/rest/v1/rpc/${name}`, { method: "POST", headers: svc, body: JSON.stringify(params) });
  const text = await r.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { ok: r.ok, data };
}

function rpcFailure(req: Request, data: unknown) {
  const msg = typeof (data as any)?.message === "string" ? (data as any).message : "";
  const key = msg.trim();
  const known = KNOWN[key];
  if (known) return fail(req, key, known[1], known[0]);
  console.error("rpc_failure", msg.slice(0, 300));          // détail uniquement dans les logs serveur
  return fail(req, "operation_failed", "Operation failed", 500);
}

async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const b = await req.json();
    return b && typeof b === "object" && !Array.isArray(b) ? b : null;
  } catch { return null; }
}
const text = (v: unknown, max = 120) => (typeof v === "string" && v.trim() && v.length <= max ? v.trim() : null);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: headersFor(req) });
  if (req.method !== "POST") return fail(req, "method_not_allowed", "Method not allowed", 405);
  const a = await authenticate(req);
  if (a.error) return a.error;
  const { user, url, svc } = a;
  const b = await readJson(req);
  if (!b) return fail(req, "invalid_json", "Invalid JSON body", 400);

  const productId = text(b.product_id, 64);
  const playerId = text(b.player_id);
  const buyerRef = text(b.buyer_ref);
  if (!productId || !UUID.test(productId)) return fail(req, "invalid_field", "product_id must be a UUID", 400);
  if (!playerId) return fail(req, "invalid_field", "player_id is required", 400);
  if (!buyerRef) return fail(req, "invalid_field", "buyer_ref is required", 400);
  const q = b.quantity === undefined || b.quantity === null ? 1 : b.quantity;
  if (typeof q !== "number" || !Number.isInteger(q) || q < 1 || q > 10000) return fail(req, "invalid_field", "quantity must be a positive integer", 400);
  const optional = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 120) : null);

  // Identité = JWT validé. user_id, prix, solde et rôle envoyés par le client sont ignorés.
  const cr = await fetch(`${url}/rest/v1/customers?select=id,is_active&auth_user_id=eq.${encodeURIComponent(user.id)}&limit=1`, { headers: svc });
  if (!cr.ok) return fail(req, "operation_failed", "Operation failed", 500);
  const customers = await cr.json();
  if (!Array.isArray(customers) || customers.length !== 1 || customers[0].is_active !== true) {
    return fail(req, "customer_not_found", "Customer account is not active", 403);
  }
  const r = await rpc(url, svc, "create_wallet_order", {
    p_customer_id: customers[0].id, p_product_id: productId, p_player_id: playerId,
    p_server_id: optional(b.server_id), p_region: optional(b.region), p_quantity: q, p_buyer_ref: buyerRef,
  });
  if (!r.ok) return rpcFailure(req, r.data);
  return ok(req, { success: true, order: r.data });   // un rejeu (même buyer_ref) renvoie la même commande, sans nouveau débit
});
