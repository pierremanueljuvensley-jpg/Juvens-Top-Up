import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

const limited = {
  success: false,
  error: { code: "RATE_LIMITED", message: "Too many requests, please retry shortly" }
};

const make = (windowMs, limit) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: (req) => req.method === "OPTIONS",
    message: limited
  });

export const globalLimiter = make(env.GLOBAL_RATE_LIMIT_WINDOW_MS, env.GLOBAL_RATE_LIMIT_MAX);
export const sensitiveLimiter = make(env.SENSITIVE_RATE_LIMIT_WINDOW_MS, env.SENSITIVE_RATE_LIMIT_MAX);
export const adminLimiter = make(env.ADMIN_RATE_LIMIT_WINDOW_MS, env.ADMIN_RATE_LIMIT_MAX);
