import { Router } from "express";
import type { Request, Response } from "express";
import { sendSuccess } from "@utils/ApiResponse";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";

const router = Router();

/**
 * GET /api/health
 * Health check endpoint - test
 */
router.get("/health", (_req: Request, res: Response) => {
  sendSuccess(
    res,
    "Server is up and running",
    {
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV ?? "development",
    },
    200,
  );
});

// Feature routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);

export default router;
