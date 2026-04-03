import rateLimit from "express-rate-limit";
import { createApiResponse } from "../utils/ApiResponse.ts";

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: createApiResponse(429, "Too many requests, please try again later"),
});

export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: createApiResponse(429, "Too many requests, please try again later"),
});
