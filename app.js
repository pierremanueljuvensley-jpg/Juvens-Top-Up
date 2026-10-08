import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { globalLimiter } from "./middleware/rateLimit.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { customerRouter } from "./routes/customer.js";
import { adminRouter } from "./routes/admin.js";
import { publicRouter, systemRouter } from "./routes/system.js";
import { legacyRouter } from "./routes/legacy.js";
import { corsMiddleware } from "./middleware/cors.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1); // Render place un proxy devant le service

app.use(requestLogger);
app.use(helmet());
app.use(corsMiddleware);

app.use("/", publicRouter); // "/" et "/health" : jamais bloqués par le rate limit

app.use(globalLimiter);
app.use("/", systemRouter);
app.use("/api", (_req, res, next) => {
  res.set("Cache-Control", "no-store"); // soldes, commandes : pas de cache
  next();
});
app.use(express.json({ limit: env.JSON_BODY_LIMIT, strict: true }));

app.use("/api/customer", customerRouter);
app.use("/api/admin", adminRouter);

if (env.ENABLE_LEGACY_ROUTES) {
  app.use("/api/payment", legacyRouter);
}

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: "Route not found" }
  });
});

app.use(errorHandler);

export default app;
