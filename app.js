import express from "express";
import helmet from "helmet";
import { env } from "./env.js";
import { globalLimiter } from "./rateLimit.js";
import { requestLogger } from "./requestLogger.js";
import { errorHandler } from "./errorHandler.js";
import { customerRouter } from "./customer.js";
import { adminRouter } from "./admin.js";
import { publicRouter, systemRouter } from "./system.js";
import { legacyRouter } from "./legacy.js";
import { corsMiddleware } from "./cors.js";

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
