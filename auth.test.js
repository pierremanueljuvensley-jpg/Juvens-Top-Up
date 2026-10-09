import test from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "development";
process.env.SUPABASE_URL = "https://fake.supabase.test";
process.env.SUPABASE_ANON_KEY = "sb_publishable_test";

const { requireAuth } = await import("../src/middleware/auth.js");

const realFetch = globalThis.fetch;
const mockSupabase = (status, body) => {
  globalThis.fetch = async () => ({ status, ok: status >= 200 && status < 300, text: async () => JSON.stringify(body) });
};
test.after(() => { globalThis.fetch = realFetch; });

const run = (headers) => new Promise((resolve) => {
  const req = { headers };
  requireAuth(req, {}, (err) => resolve({ err, req }));
});

test("token absent -> 401 AUTH_REQUIRED", async () => {
  const { err } = await run({});
  assert.equal(err.status, 401);
  assert.equal(err.code, "AUTH_REQUIRED");
});

test("faux JWT à 3 segments refusé par Supabase -> 401 INVALID_TOKEN", async () => {
  mockSupabase(401, { message: "invalid JWT" });
  const { err } = await run({ authorization: "Bearer aaa.bbb.ccc" });
  assert.equal(err.status, 401);
  assert.equal(err.code, "INVALID_TOKEN");
});

test("token expiré (403 amont) -> 401", async () => {
  mockSupabase(403, { message: "token is expired" });
  const { err } = await run({ authorization: "Bearer aaa.bbb.ccc" });
  assert.equal(err.status, 401);
});

test("token valide -> req.user renseigné, pas d'erreur", async () => {
  mockSupabase(200, { id: "123e4567-e89b-42d3-a456-426614174000", email: "a@b.co", app_metadata: {} });
  const { err, req } = await run({ authorization: "Bearer aaa.bbb.ccc" });
  assert.equal(err, undefined);
  assert.equal(req.user.id, "123e4567-e89b-42d3-a456-426614174000");
  assert.equal(req.accessToken, "aaa.bbb.ccc");
});

test("Supabase en panne (500) -> 502, pas d'accès accordé", async () => {
  mockSupabase(500, {});
  const { err, req } = await run({ authorization: "Bearer aaa.bbb.ccc" });
  assert.equal(err.status, 502);
  assert.equal(req.user, undefined);
});

test("réponse 200 sans id -> refusé", async () => {
  mockSupabase(200, {});
  const { err } = await run({ authorization: "Bearer aaa.bbb.ccc" });
  assert.equal(err.status, 401);
});
