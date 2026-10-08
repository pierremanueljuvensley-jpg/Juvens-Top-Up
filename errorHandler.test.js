import test from "node:test";
import assert from "node:assert/strict";
import { errorHandler } from "../src/middleware/errorHandler.js";
import { AppError } from "../src/utils/errors.js";

function run(err) {
  const out = {};
  const res = { headersSent: false, status(c) { out.status = c; return this; }, json(b) { out.body = b; return this; } };
  const logs = [];
  const orig = console.error;
  console.error = (l) => logs.push(l);
  try { errorHandler(err, { method: "POST", path: "/api/customer/purchase" }, res, () => {}); } finally { console.error = orig; }
  return { ...out, logs };
}

test("erreur interne : 500 générique, détail écrit dans les logs seulement", () => {
  const r = run(new Error("secret interne"));
  assert.equal(r.status, 500);
  assert.ok(!JSON.stringify(r.body).includes("secret"));
  assert.ok(r.logs.join("").includes("secret interne"));
});

test("JSON invalide -> 400, trop gros -> 413, CORS -> 403, 502 journalisé", () => {
  assert.equal(run(Object.assign(new Error("x"), { type: "entity.parse.failed" })).status, 400);
  assert.equal(run(Object.assign(new Error("x"), { type: "entity.too.large" })).status, 413);
  assert.equal(run(new Error("CORS origin not allowed")).status, 403);
  const r = run(new AppError(502, "SUPABASE_UNREACHABLE", "Supabase is unreachable"));
  assert.equal(r.status, 502);
  assert.equal(r.logs.length, 1);
});
