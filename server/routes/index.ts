import { Router } from "express";
import type { Request, Response } from "express";
import { sendSuccess } from "@utils/ApiResponse";

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

export default router;
