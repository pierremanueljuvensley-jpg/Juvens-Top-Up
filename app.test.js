// Tests d'intégration HTTP (nécessitent `npm install`). Ignorés automatiquement si Express est absent.
import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

process.env.NODE_ENV = "development";
process.env.SUPABASE_URL = "https://fake.supabase.test";
process.env.SUPABASE_ANON_KEY = "sb_publishable_test";
process.env.SUPABASE_FUNCTIONS_URL = "https://fake.supabase.test/functions/v1";
process.env.CORS_ORIGINS = "https://juvenstopup.pages.dev";
process.env.JSON_BODY_LIMIT = "1kb";
process.env.SENSITIVE_RATE_LIMIT_MAX = "3";

let app;
try { app = (await import("../src/app.js")).default; } catch (e) {
  if (e.code !== "ERR_MODULE_NOT_FOUND") throw e;
}
const skip = app ? false : "dépendances non installées (npm install)";

const U = "123e4567-e89b-42d3-a456-426614174000";
const realFetch = globalThis.fetch;
let upstream = [];
globalThis.fetch = async (url, opts) => {
  if (!String(url).startsWith("https://fake.supabase.test")) return realFetch(url, opts);
  const u = String(url);
  upstream.push({ url: u, opts });
  const send = (status, body) => ({ status, ok: status < 300, text: async () => JSON.stringify(body) });
  if (u.endsWith("/auth/v1/user")) {
    const t = opts.headers.Authorization;
    if (t === "Bearer good.good.good") return send(200, { id: U, email: "c@x.co", app_metadata: {} });
    return send(401, { message: "invalid" });
  }
  if (u.endsWith("/functions/v1/purchase-wallet")) return send(409, { success: false, error: { code: "INSUFFICIENT_BALANCE", message: "Insufficient wallet balance" } });
  if (u.endsWith("/functions/v1/admin-dashboard")) return send(403, { success: false, error: { code: "FORBIDDEN", message: "Admin only" } });
  return send(200, { success: true });
};

let server, base;
test.before(async () => {
  if (!app) return;
  server = http.createServer(app);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => { server?.close(); globalThis.fetch = realFetch; });

const call = (path, { method = "GET", token, body, headers = {} } = {}) =>
  realFetch(base + path, {
    method,
    headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    body: typeof body === "string" ? body : body ? JSON.stringify(body) : undefined
  });

test("GET /health", { skip }, async () => {
  const r = await call("/health");
  assert.deepEqual(await r.json(), { status: "ok", service: "juvenstopup-backend" });
});

test("404 au format standard", { skip }, async () => {
  const r = await call("/nope");
  assert.equal(r.status, 404);
  assert.equal((await r.json()).error.code, "NOT_FOUND");
});

test("route protégée sans token -> 401 ; faux token -> 401", { skip }, async () => {
  assert.equal((await call("/api/customer/dashboard")).status, 401);
  assert.equal((await call("/api/customer/dashboard", { token: "aaa.bbb.ccc" })).status, 401);
});

test("JSON invalide -> 400 INVALID_JSON ; payload trop gros -> 413", { skip }, async () => {
  const r1 = await call("/api/customer/verify-uid", { method: "POST", token: "good.good.good", body: "{bad" , headers: { "Content-Type": "application/json" } });
  assert.equal(r1.status, 400);
  const r2 = await call("/api/customer/verify-uid", { method: "POST", token: "good.good.good", body: { game: "x".repeat(3000) } });
  assert.equal(r2.status, 413);
});

test("CORS : origine autorisée OK, inconnue refusée, jamais '*'", { skip }, async () => {
  const ok = await call("/health", { headers: { Origin: "https://juvenstopup.pages.dev" } });
  assert.equal(ok.headers.get("access-control-allow-origin"), "https://juvenstopup.pages.dev");
  const ko = await call("/health", { headers: { Origin: "https://evil.example" } });
  assert.equal(ko.status, 403);
});

test("achat : validation avant tout appel amont, solde insuffisant relayé", { skip }, async () => {
  const bad = await call("/api/customer/purchase", { method: "POST", token: "good.good.good", body: { product_id: "x", player_id: "1", buyer_ref: "ref-12345" } });
  assert.equal(bad.status, 400);
  upstream = [];
  const r = await call("/api/customer/purchase", { method: "POST", token: "good.good.good", body: { product_id: U, player_id: "1", buyer_ref: "ref-12345" } });
  assert.equal(r.status, 409);
  assert.equal((await r.json()).error.code, "INSUFFICIENT_BALANCE");
  const sent = JSON.parse(upstream.find((x) => x.url.endsWith("purchase-wallet")).opts.body);
  assert.equal("price" in sent || "amount" in sent || "total" in sent, false); // le prix n'est jamais fourni par le client
});

test("admin : refus amont (customer) relayé en 403", { skip }, async () => {
  const r = await call("/api/admin/dashboard", { token: "good.good.good" });
  assert.equal(r.status, 403);
});

test("rate limiting sensible : 4e requête -> 429", { skip }, async () => {
  let last;
  for (let i = 0; i < 4; i++) last = await call("/api/customer/verify-uid", { method: "POST", token: "good.good.good", body: { game: "ff", player_id: "1" } });
  assert.equal(last.status, 429);
});

test("routes legacy désactivées par défaut", { skip }, async () => {
  assert.equal((await call("/api/payment/create", { method: "POST", token: "good.good.good", body: {} })).status, 404);
});
