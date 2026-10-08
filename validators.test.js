import test from "node:test";
import assert from "node:assert/strict";
import { validatePurchase, validateUid, validateTopup, validateOrderAction, validateProductAction } from "../src/validators.js";

const U = "123e4567-e89b-42d3-a456-426614174000";

test("achat valide : buyer_ref transmis sans modification", () => {
  const x = validatePurchase({ product_id: U, player_id: "12345678", buyer_ref: "  ref-1 " });
  assert.equal(x.quantity, 1);
  assert.equal(x.buyer_ref, "  ref-1 ");
});

test("server_id numérique : converti en texte, pas de plantage", () => {
  const x = validatePurchase({ product_id: U, player_id: "1", server_id: 1234 });
  assert.equal(x.server_id, "1234");
});

test("types invalides -> 400 (jamais de TypeError/500)", () => {
  for (const bad of [{ server_id: {} }, { region: [] }, { server_id: true }, { buyer_ref: 5 }, { quantity: 0 }, { quantity: 1.5 }]) {
    assert.throws(() => validatePurchase({ product_id: U, player_id: "1", ...bad }), (e) => e.status === 400);
  }
  assert.throws(() => validatePurchase(null), (e) => e.status === 400);
  assert.throws(() => validatePurchase({ product_id: U }), (e) => e.status === 400);
  assert.throws(() => validatePurchase({ product_id: "x", player_id: "1" }), (e) => e.status === 400);
});

test("verify-uid", () => {
  assert.equal(validateUid({ game: "Free Fire", player_id: "123" }).game, "Free Fire");
  assert.throws(() => validateUid({ player_id: "1" }), (e) => e.status === 400);
});

test("recharge : montant, provider, devise", () => {
  assert.deepEqual(validateTopup({ amount: 500 }), { p_amount: 500, p_provider: "natcash", p_currency: "HTG" });
  for (const bad of [{}, { amount: -1 }, { amount: 10.123 }, { amount: 9999999 }, { amount: 100, provider: "paypal" }, { amount: 100, currency: "USD" }]) {
    assert.throws(() => validateTopup(bad), (e) => e.status === 400);
  }
});

test("admin : fail exige une note, product-action accepte plusieurs champs", () => {
  assert.throws(() => validateOrderAction({ order_id: U, action: "fail" }), (e) => e.status === 400);
  assert.equal(validateOrderAction({ order_id: U, action: "complete" }).note, null);
  assert.deepEqual(validateProductAction({ product_id: U, selling_price: 5, is_active: true }), { product_id: U, selling_price: 5, is_active: true });
  assert.throws(() => validateProductAction({ product_id: U }), (e) => e.status === 400);
});
