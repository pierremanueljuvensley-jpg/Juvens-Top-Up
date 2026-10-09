import rateLimit from "express-rate-limit";
import { env } from "./env.js";

const limited = {
  success: false,
  error: { code: "RATE_LIMITED", message: "Too many requests, please retry shortly" }
};

// Limiteurs sensibles : clé = utilisateur authentifié (requireAuth passe avant), sinon IP.
const make = (windowMs, limit, perUser = false) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: (req) => req.method === "OPTIONS",
    ...(perUser ? { keyGenerator: (req) => (req.user?.id ? `u:${req.user.id}` : `ip:${req.ip}`) } : {}),
    message: limited
  });

export const globalLimiter = make(env.GLOBAL_RATE_LIMIT_WINDOW_MS, env.GLOBAL_RATE_LIMIT_MAX);
export const sensitiveLimiter = make(env.SENSITIVE_RATE_LIMIT_WINDOW_MS, env.SENSITIVE_RATE_LIMIT_MAX, true);
export const adminLimiter = make(env.ADMIN_RATE_LIMIT_WINDOW_MS, env.ADMIN_RATE_LIMIT_MAX, true);
