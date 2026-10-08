import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { callFunction } from "../services/supabase.js";
import { relay } from "../services/relay.js";
import { AppError } from "../utils/errors.js";

export const legacyRouter = Router();
legacyRouter.use(requireAuth);

legacyRouter.post("/create", asyncHandler(async () => {
  throw new AppError(410, "LEGACY_DISABLED", "Legacy payment flow is disabled");
}));

legacyRouter.get("/status", asyncHandler(async () => {
  throw new AppError(410, "LEGACY_DISABLED", "Legacy payment flow is disabled");
}));
