import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import passport from "./config/passport.ts";
import { env } from "./config/env.ts";
import { generalRateLimiter } from "./middlewares/rateLimiter.middleware.ts";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.ts";
import router from "./routes/index.ts";

const app = express();

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet());

// Build allowed origins list from CLIENT_URL + optional MOBILE_ORIGINS (comma-separated)
const allowedOrigins: (string | RegExp)[] = [env.clientUrl];
if (env.mobileOrigins) {
  env.mobileOrigins.split(",").forEach((o) => {
    const trimmed = o.trim();
    if (trimmed) allowedOrigins.push(trimmed);
  });
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ─── Body & Cookie Parsing ────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Passport ─────────────────────────────────────────────────────────────────
app.use(passport.initialize());

// ─── Rate Limiting ────────────────────────────────────────────────────────────
app.use("/api", generalRateLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api", router);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
