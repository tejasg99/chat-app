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
app.use(
  cors({
    origin: env.clientUrl,
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
