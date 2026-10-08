import { logger } from "../utils/logger.js";

export function requestLogger(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    if (req.path === "/health") return;
    logger.info("request", {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: Date.now() - start
    });
  });
  next();
}
