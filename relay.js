import { AppError } from "../utils/errors.js";

const CODE_BY_STATUS = {
  400: "BAD_REQUEST", 401: "INVALID_TOKEN", 403: "FORBIDDEN", 404: "NOT_FOUND",
  409: "CONFLICT", 422: "UNPROCESSABLE", 429: "RATE_LIMITED", 502: "UPSTREAM_ERROR", 503: "UPSTREAM_UNAVAILABLE"
};
const RELAYED = Object.keys(CODE_BY_STATUS).map(Number);
const SAFE_CODE = /^[A-Z][A-Z0-9_]{1,63}$/;

// Normalise une erreur amont vers { success:false, error:{ code, message } }.
// - on conserve le code/message métier (ex. INSUFFICIENT_BALANCE) quand l'amont les fournit proprement ;
// - on n'expose jamais details / hint / stack / erreurs SQL brutes (codes SQLSTATE numériques).
export function normalizeError(status, body) {
  const b = body && typeof body === "object" ? body : {};
  const nested = b.error && typeof b.error === "object" ? b.error : null;
  const rawCode = nested?.code ?? (typeof b.code === "string" ? b.code : undefined);
  const rawMessage =
    typeof nested?.message === "string" ? nested.message
    : typeof b.error === "string" ? b.error
    : typeof b.message === "string" ? b.message
    : undefined;

  // Erreur métier levée par une fonction SQL (ex. "amount_out_of_range") : code stable, message lisible.
  const sqlKey = typeof rawMessage === "string" && /^[a-z][a-z0-9_]{2,60}$/.test(rawMessage) ? rawMessage : null;
  if (sqlKey && status >= 400 && status < 500) {
    return { success: false, error: { code: sqlKey.toUpperCase(), message: sqlKey.replace(/_/g, " ") } };
  }

  const code = typeof rawCode === "string" && SAFE_CODE.test(rawCode) ? rawCode : CODE_BY_STATUS[status];
  const businessSafe = status < 500 && status !== 502 && status !== 503 && typeof rawMessage === "string"
    && rawMessage.length <= 200 && !/^\d/.test(String(rawCode ?? ""));
  const message = businessSafe ? rawMessage : "Request could not be completed";
  return { success: false, error: { code, message } };
}

export function relay(res, upstream) {
  const { status, body } = upstream;

  if (status >= 200 && status < 300) {
    return res.status(status).json(body ?? { success: true });
  }

  if (RELAYED.includes(status)) {
    return res.status(status).json(normalizeError(status, body));
  }

  throw new AppError(502, "UPSTREAM_REJECTED", "Upstream service rejected the request");
}
