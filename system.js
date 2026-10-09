import { Router } from "express";
import { ping } from "./supabase.js";
import { asyncHandler } from "./asyncHandler.js";

// Routes publiques SANS rate limit (health check Render)
export const publicRouter = Router();

publicRouter.get("/", (_req, res) => {
  res.json({ success: true, name: "JuvensTopUp API", version: "1.0.0", status: "ok" });
});

publicRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "juvenstopup-backend" });
});

// Vérification Supabase : soumise au rate limit global
export const systemRouter = Router();

systemRouter.get("/health/supabase", asyncHandler(async (_req, res) => {
  const ok = await ping();
  res.status(ok ? 200 : 502).json({
    success: ok,
    supabase: ok ? "reachable" : "unreachable"
  });
}));
