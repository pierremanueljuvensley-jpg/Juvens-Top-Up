import cors from "cors";
import { env } from "./env.js";

const allowed = new Set(
  env.CORS_ORIGIN.split(",").map(x => x.trim().toLowerCase()).filter(Boolean)
);

export const corsMiddleware = cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowed.has(origin.toLowerCase())) return callback(null, true);
    return callback(new Error("CORS origin not allowed"));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
  maxAge: 600
});
