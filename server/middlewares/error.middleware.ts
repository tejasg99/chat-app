import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError.ts";
import { createApiResponse } from "../utils/ApiResponse.ts";
import { logger } from "../utils/logger.ts";
import { env } from "../config/env.ts";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.issues.map((e) => `${e.path.join(".")}: ${e.message}`);
    res.status(422).json(createApiResponse(422, "Validation failed", { errors }));
    return;
  }

  // Known operational errors
  if (err instanceof ApiError) {
    res
      .status(err.statusCode)
      .json(
        createApiResponse(
          err.statusCode,
          err.message,
          err.errors.length ? { errors: err.errors } : null,
        ),
      );
    return;
  }

  // Mongoose duplicate key
  if (
    (err as NodeJS.ErrnoException).name === "MongoServerError" &&
    (err as NodeJS.ErrnoException & { code?: number }).code === 11000
  ) {
    res.status(409).json(createApiResponse(409, "Resource already exists"));
    return;
  }

  // Unknown errors
  logger.error(err);
  res
    .status(500)
    .json(
      createApiResponse(500, env.nodeEnv === "production" ? "Internal server error" : err.message),
    );
};

export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json(createApiResponse(404, "Route not found"));
};
