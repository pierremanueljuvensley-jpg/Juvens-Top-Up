const bool = (v) => String(v).toLowerCase() === "true";
const int = (v, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
};


// Refuse de démarrer si une clé secrète / service_role est collée à la place de la clé anon.
function assertNotServiceRoleKey(key) {
  const message = "A service-role/secret key must never be used as SUPABASE_ANON_KEY";
  if (key.startsWith("sb_secret_")) throw new Error(message);
  const parts = key.split(".");
  if (parts.length === 3) {
    let role;
    try { role = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"))?.role; } catch { role = undefined; }
    if (role === "service_role") throw new Error(message);
  }
}

const NODE_ENV = process.env.NODE_ENV || "development";
const PORT = int(process.env.PORT, 10000);
// Accepte CORS_ORIGINS (nom du cahier des charges) ou CORS_ORIGIN ; plusieurs origines séparées par des virgules
const CORS_ORIGIN = (process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || "")
  .split(",").map((x) => x.trim().replace(/\/+$/, "")).filter(Boolean).join(",");

if (NODE_ENV === "production" && !CORS_ORIGIN) {
  throw new Error("CORS_ORIGINS is required in production (e.g. https://juvenstopup.pages.dev)");
}
if (CORS_ORIGIN.split(",").includes("*")) {
  throw new Error("Wildcard CORS is not allowed");
}

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";
const SUPABASE_FUNCTIONS_URL =
  process.env.SUPABASE_FUNCTIONS_URL ||
  (SUPABASE_URL ? `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1` : "");

if (NODE_ENV === "production") {
  if (!SUPABASE_URL.startsWith("https://")) {
    throw new Error("SUPABASE_URL must use HTTPS in production");
  }
  if (!SUPABASE_ANON_KEY) {
    throw new Error("SUPABASE_ANON_KEY is required in production");
  }
  assertNotServiceRoleKey(SUPABASE_ANON_KEY);
}

export const env = {
  NODE_ENV, PORT, CORS_ORIGIN,
  SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_FUNCTIONS_URL,
  JSON_BODY_LIMIT: process.env.JSON_BODY_LIMIT || "100kb",
  UPSTREAM_TIMEOUT_MS: int(process.env.UPSTREAM_TIMEOUT_MS, 15000),
  GLOBAL_RATE_LIMIT_WINDOW_MS: int(process.env.GLOBAL_RATE_LIMIT_WINDOW_MS, 900000),
  GLOBAL_RATE_LIMIT_MAX: int(process.env.GLOBAL_RATE_LIMIT_MAX, 300),
  SENSITIVE_RATE_LIMIT_WINDOW_MS: int(process.env.SENSITIVE_RATE_LIMIT_WINDOW_MS, 60000),
  SENSITIVE_RATE_LIMIT_MAX: int(process.env.SENSITIVE_RATE_LIMIT_MAX, 20),
  ADMIN_RATE_LIMIT_WINDOW_MS: int(process.env.ADMIN_RATE_LIMIT_WINDOW_MS, 60000),
  ADMIN_RATE_LIMIT_MAX: int(process.env.ADMIN_RATE_LIMIT_MAX, 60),
  TOPUP_PROVIDERS: (process.env.TOPUP_PROVIDERS || "natcash")
    .split(",").map(x => x.trim().toLowerCase()).filter(Boolean),
  TOPUP_MIN_AMOUNT: Number(process.env.TOPUP_MIN_AMOUNT || 1),
  TOPUP_MAX_AMOUNT: Number(process.env.TOPUP_MAX_AMOUNT || 500000),
  ENABLE_LEGACY_ROUTES: bool(process.env.ENABLE_LEGACY_ROUTES)
};
