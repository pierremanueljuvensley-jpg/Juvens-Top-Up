import { AppError } from "../utils/errors.js";

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();

  if (!token || token.split(".").length !== 3) {
    return next(new AppError(401, "AUTH_REQUIRED", "Authentication required"));
  }

  req.accessToken = token;
  next();
}
