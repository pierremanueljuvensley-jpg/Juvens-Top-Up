import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { adminLimiter } from "../middleware/rateLimit.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { callFunction } from "../services/supabase.js";
import { relay } from "../services/relay.js";
import { validateOrderAction, validateWalletApproval, validateProductAction } from "../validators.js";

export const adminRouter = Router();
adminRouter.use(requireAuth, adminLimiter);

adminRouter.get("/dashboard", asyncHandler(async (req, res) => {
  relay(res, await callFunction("admin-dashboard", {
    token: req.accessToken, method: "GET"
  }));
}));

adminRouter.get("/orders", asyncHandler(async (req, res) => {
  relay(res, await callFunction("admin-orders", {
    token: req.accessToken, method: "GET"
  }));
}));

adminRouter.post("/order-action", asyncHandler(async (req, res) => {
  const input = validateOrderAction(req.body);
  relay(res, await callFunction("admin-order-action", {
    token: req.accessToken, method: "POST", body: input
  }));
}));

adminRouter.post("/wallet-topup", asyncHandler(async (req, res) => {
  const input = validateWalletApproval(req.body);
  relay(res, await callFunction("admin-wallet-topup", {
    token: req.accessToken, method: "POST", body: input
  }));
}));

adminRouter.post("/product-action", asyncHandler(async (req, res) => {
  const input = validateProductAction(req.body);
  relay(res, await callFunction("admin-product-action", {
    token: req.accessToken, method: "POST", body: input
  }));
}));
