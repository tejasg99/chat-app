import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { sendError } from "../utils/ApiResponse";
import { logger } from "../utils/logger";

/**
 * Global Error Handling Middleware.
 * Must be registered LAST in Express middleware chain.
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  // Log the error
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  // Handle known operational errors (ApiError)
  if (err instanceof ApiError) {
    sendError(res, err.message, err.errors.length > 0 ? err.errors : undefined, err.statusCode);
    return;
  }

  // Handle Mongoose Validation Errors
  if (err.name === "ValidationError") {
    sendError(res, "Validation failed", err.message, 400);
    return;
  }

  // Handle Mongoose Duplicate Key Error
  if ("code" in err && (err as NodeJS.ErrnoException).code === "11000") {
    sendError(res, "Duplicate field value", err.message, 409);
    return;
  }

  // Handle JWT Errors
  if (err.name === "JsonWebTokenError") {
    sendError(res, "Invalid token", undefined, 401);
    return;
  }

  if (err.name === "TokenExpiredError") {
    sendError(res, "Token has expired", undefined, 401);
    return;
  }

  // Unhandled/Unknown errors → don't leak internals in production
  const isDevelopment = process.env.NODE_ENV === "development";

  sendError(res, "Internal Server Error", isDevelopment ? err.message : undefined, 500);
};

/**
 * 404 Not Found handler — register before errorHandler.
 */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(ApiError.notFound(`Route '${req.originalUrl}' not found`));
};
