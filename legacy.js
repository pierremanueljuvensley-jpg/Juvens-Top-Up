import { Router } from "express";
import { requireAuth } from "./auth.js";
import { asyncHandler } from "./asyncHandler.js";
import { callFunction } from "./supabase.js";
import { relay } from "./relay.js";
import { AppError } from "./errors.js";

export const legacyRouter = Router();
legacyRouter.use(requireAuth);

legacyRouter.post("/create", asyncHandler(async () => {
  throw new AppError(410, "LEGACY_DISABLED", "Legacy payment flow is disabled");
}));

legacyRouter.get("/status", asyncHandler(async () => {
  throw new AppError(410, "LEGACY_DISABLED", "Legacy payment flow is disabled");
}));
