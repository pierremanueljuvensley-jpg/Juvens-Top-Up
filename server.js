import http from "node:http";
import app from "./app.js";
import { env } from "./env.js";
import { logger } from "./logger.js";

const server = http.createServer(app);

server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;

server.listen(env.PORT, "0.0.0.0", () => {
  logger.info("server_started", { port: env.PORT, environment: env.NODE_ENV });
});

const shutdown = (signal) => {
  logger.info("shutdown_started", { signal });
  server.close(() => {
    logger.info("shutdown_complete");
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error("unhandled_rejection", { message: reason?.message || String(reason) });
});

process.on("uncaughtException", (error) => {
  logger.error("uncaught_exception", { message: error.message });
  process.exit(1);
});
