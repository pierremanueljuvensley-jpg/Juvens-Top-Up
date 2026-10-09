import test from "node:test";
import assert from "node:assert/strict";
import { relay, normalizeError } from "../src/services/relay.js";

const mkRes = () => { const r = {}; return Object.assign(r, { status(c) { r.s = c; return r; }, json(b) { r.b = b; return r; } }); };

test("erreur métier conservée au format standard", () => {
  const res = mkRes();
  relay(res, { status: 409, body: { success: false, error: { code: "INSUFFICIENT_BALANCE", message: "Insufficient wallet balance" } } });
  assert.equal(res.s, 409);
  assert.deepEqual(res.b, { success: false, error: { code: "INSUFFICIENT_BALANCE", message: "Insufficient wallet balance" } });
});

test("erreur PostgREST/SQL : détails et message interne non exposés", () => {
  const out = normalizeError(400, { code: "23514", message: 'violates check constraint "wallets_balance_check"', details: "x", hint: "y" });
  assert.equal(out.error.code, "BAD_REQUEST");
  assert.ok(!JSON.stringify(out).includes("wallets_balance_check"));
  assert.ok(!JSON.stringify(out).includes("details"));
});

test("erreur en forme libre {error:'texte'} -> format standard", () => {
  const out = normalizeError(404, { error: "Product not found" });
  assert.deepEqual(out, { success: false, error: { code: "NOT_FOUND", message: "Product not found" } });
});

test("5xx amont non listé -> AppError 502", () => {
  assert.throws(() => relay(mkRes(), { status: 500, body: {} }), (e) => e.status === 502);
});

test("502/503 amont : message générique", () => {
  assert.equal(normalizeError(503, { message: "db host 10.0.0.1 down" }).error.message, "Request could not be completed");
});

test("erreur SQL métier (RPC) -> code stable en majuscules", () => {
  const out = normalizeError(400, { code: "P0001", message: "amount_out_of_range", details: null, hint: null });
  assert.deepEqual(out, { success: false, error: { code: "AMOUNT_OUT_OF_RANGE", message: "amount out of range" } });
});
