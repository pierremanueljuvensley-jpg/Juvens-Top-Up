import { AppError } from "./utils/errors.js";
import { env } from "./config/env.js";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const bad = (code, message) => new AppError(400, code, message);

export function ensureObject(body) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw bad("INVALID_BODY", "Request body must be a JSON object");
  }
  return body;
}

export function requiredUuid(value, field) {
  if (typeof value !== "string" || !uuid.test(value)) {
    throw bad("INVALID_FIELD", `${field} must be a valid UUID`);
  }
  return value;
}

function requiredText(value, field, max = 120) {
  if (typeof value !== "string" || !value.trim()) throw bad("INVALID_FIELD", `${field} is required`);
  if (value.length > max) throw bad("INVALID_FIELD", `${field} is too long (max ${max})`);
  return value.trim();
}

// Texte optionnel : accepte une chaîne, ou un nombre (ex: server_id 1234) converti en chaîne.
// Tout autre type (objet, tableau, booléen) -> 400 au lieu d'un plantage 500.
function optionalText(value, field, max = 120) {
  if (value === undefined || value === null) return null;
  let text;
  if (typeof value === "string") text = value;
  else if (typeof value === "number" && Number.isFinite(value)) text = String(value);
  else throw bad("INVALID_FIELD", `${field} must be text`);
  text = text.trim();
  if (text.length > max) throw bad("INVALID_FIELD", `${field} is too long (max ${max})`);
  return text || null;
}

export function validatePurchase(raw) {
  const body = ensureObject(raw);
  requiredUuid(body.product_id, "product_id");
  const playerId = requiredText(body.player_id, "player_id");

  const quantity = body.quantity === undefined || body.quantity === null ? 1 : Number(body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10000) {
    throw bad("INVALID_FIELD", "quantity must be an integer between 1 and 10000");
  }

  let buyerRef = null;
  if (body.buyer_ref !== undefined && body.buyer_ref !== null) {
    if (typeof body.buyer_ref !== "string") throw bad("INVALID_FIELD", "buyer_ref must be text");
    if (body.buyer_ref.length > 120) throw bad("INVALID_FIELD", "buyer_ref is too long (max 120)");
    buyerRef = body.buyer_ref; // transmis tel quel (idempotence)
  }

  return {
    product_id: body.product_id,
    player_id: playerId,
    server_id: optionalText(body.server_id, "server_id"),
    region: optionalText(body.region, "region", 30),
    buyer_ref: buyerRef,
    quantity
  };
}

export function validateUid(raw) {
  const body = ensureObject(raw);
  return {
    game: requiredText(body.game, "game", 80),
    player_id: requiredText(body.player_id, "player_id"),
    server_id: optionalText(body.server_id, "server_id"),
    region: optionalText(body.region, "region", 30)
  };
}

export function validateTopup(raw) {
  const body = ensureObject(raw);
  const amount = typeof body.amount === "string" && body.amount.trim() === "" ? NaN : Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0 || Math.round(amount * 100) / 100 !== amount) {
    throw bad("INVALID_AMOUNT", "Invalid amount (positive number, max 2 decimals)");
  }
  if (amount < env.TOPUP_MIN_AMOUNT || amount > env.TOPUP_MAX_AMOUNT) {
    throw bad("INVALID_AMOUNT", "Amount is outside the allowed range");
  }
  const provider = String(body.provider ?? "natcash").trim().toLowerCase();
  if (!env.TOPUP_PROVIDERS.includes(provider)) {
    throw bad("INVALID_PROVIDER", "Unsupported top-up provider");
  }
  if (body.currency !== undefined && body.currency !== null && body.currency !== "HTG") {
    throw bad("INVALID_FIELD", "Only HTG is supported");
  }
  return { p_amount: amount, p_provider: provider, p_currency: "HTG" };
}

export function validateOrderAction(raw) {
  const body = ensureObject(raw);
  requiredUuid(body.order_id, "order_id");
  if (!["start", "complete", "fail"].includes(body.action)) {
    throw bad("INVALID_ACTION", "Invalid order action");
  }
  const note = optionalText(body.note, "note", 1000);
  if (body.action === "fail" && !note) throw bad("INVALID_FIELD", "A note is required when failing an order");
  return {
    order_id: body.order_id,
    action: body.action,
    note,
    supplier_order_id: optionalText(body.supplier_order_id, "supplier_order_id")
  };
}

export function validateWalletApproval(raw) {
  const body = ensureObject(raw);
  requiredUuid(body.topup_id, "topup_id");
  return {
    topup_id: body.topup_id,
    provider_reference: optionalText(body.provider_reference, "provider_reference", 200)
  };
}

export function validateProductAction(raw) {
  const body = ensureObject(raw);
  requiredUuid(body.product_id, "product_id");
  const fields = ["selling_price", "cost_price", "is_active", "supplier_product", "metadata"];
  const supplied = fields.filter((f) => body[f] !== undefined);
  if (supplied.length === 0) throw bad("INVALID_FIELD", `Provide at least one field: ${fields.join(", ")}`);
  const out = { product_id: body.product_id };
  for (const f of supplied) out[f] = body[f]; // types validés en détail par admin-product-action
  return out;
}
