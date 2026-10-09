import { AppError } from "./errors.js";
import { logger } from "./logger.js";

const fail = (res, status, code, message) =>
  res.status(status).json({ success: false, error: { code, message } });

// Gestion centralisée. Le client ne reçoit jamais de détail interne ; les erreurs 5xx sont
// écrites dans les logs (sans headers, token ni corps de requête).
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof AppError) {
    if (err.status >= 500) {
      logger.error("upstream_failure", { method: req.method, path: req.path, status: err.status, code: err.code });
    }
    return fail(res, err.status, err.code, err.message);
  }
  if (err?.type === "entity.too.large") return fail(res, 413, "PAYLOAD_TOO_LARGE", "Request body is too large");
  if (err?.type === "entity.parse.failed" || (err instanceof SyntaxError && "body" in err)) {
    return fail(res, 400, "INVALID_JSON", "Invalid JSON body");
  }
  if (err?.message === "CORS origin not allowed") return fail(res, 403, "CORS_DENIED", "Origin not allowed");
  if (Number.isInteger(err?.status) && err.status >= 400 && err.status < 500) {
    return fail(res, 400, "BAD_REQUEST", "Invalid request");
  }

  logger.error("unhandled_error", {
    method: req.method, path: req.path, name: err?.name, message: err?.message, stack: err?.stack
  });
  return fail(res, 500, "INTERNAL_ERROR", "Internal server error");
}
