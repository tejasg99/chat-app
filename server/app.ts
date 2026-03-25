import express from "express";
import type { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import passport from "passport";
import "dotenv/config";

import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { configurePassport } from "./config/passport";
import apiRouter from "./routes/index";

const app: Application = express();

// Security Middlewares

/**
 * Helmet sets HTTP headers to secure the app
 */
app.use(helmet());

/**
 * CORS — only allow requests from the client URL defined in .env
 */
app.use(
  cors({
    origin: process.env.CLIENT_URL ?? "http://localhost:3000",
    credentials: true, // Allow cookies to be sent
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

/**
 * Global rate limiter — 100 requests per 15 minutes per IP.
 * Auth-specific rate limits will be added in Iteration 2.
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes.",
  },
});

app.use(globalLimiter);

// Body and cookie parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Passport initialization
configurePassport();
app.use(passport.initialize());

// API routes
app.use("/api", apiRouter);

// Error Handling

/**
 * IMPORTANT: notFoundHandler must come AFTER all routes.
 * errorHandler must come LAST (after notFoundHandler).
 */
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
