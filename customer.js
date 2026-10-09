import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { sensitiveLimiter } from "../middleware/rateLimit.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { callFunction, callRpc } from "../services/supabase.js";
import { relay } from "../services/relay.js";
import { validatePurchase, validateUid, validateTopup } from "../validators.js";

export const customerRouter = Router();
customerRouter.use(requireAuth);

customerRouter.get("/dashboard", asyncHandler(async (req, res) => {
  const result = await callFunction("customer-dashboard", {
    token: req.accessToken, method: "GET"
  });
  relay(res, result);
}));

customerRouter.post("/dashboard", asyncHandler(async (req, res) => {
  const result = await callFunction("customer-dashboard", {
    token: req.accessToken, method: "GET"
  });
  relay(res, result);
}));

customerRouter.post("/purchase", sensitiveLimiter, asyncHandler(async (req, res) => {
  const input = validatePurchase(req.body);
  const result = await callFunction("purchase-wallet", {
    token: req.accessToken, method: "POST", body: input
  });
  relay(res, result);
}));

customerRouter.post("/topup", sensitiveLimiter, asyncHandler(async (req, res) => {
  const input = validateTopup(req.body);
  const result = await callRpc("create_wallet_topup", {
    token: req.accessToken, params: input
  });
  relay(res, result);
}));

customerRouter.post("/verify-uid", sensitiveLimiter, asyncHandler(async (req, res) => {
  const input = validateUid(req.body);
  const result = await callFunction("verify-uid", {
    token: req.accessToken, method: "POST", body: input
  });
  relay(res, result);
}));
