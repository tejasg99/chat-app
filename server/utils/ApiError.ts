/**
 * Custom API Error class that extends the built-in Error class.
 * Used for consistent, structured error handling across the application.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly success: boolean;
  public readonly errors: unknown[];
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    errors: unknown[] = [],
    isOperational: boolean = true,
    stack: string = "",
  ) {
    super(message);

    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;
    this.isOperational = isOperational;

    // Capture stack trace (exclude constructor from trace)
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }

    // Set prototype explicitly for proper instanceof checks
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  // ── Static Factory Methods ──────────────────────────────────────────

  static badRequest(message: string, errors: unknown[] = []): ApiError {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message: string = "Unauthorized"): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message: string = "Forbidden"): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message: string = "Resource not found"): ApiError {
    return new ApiError(404, message);
  }

  static conflict(message: string, errors: unknown[] = []): ApiError {
    return new ApiError(409, message, errors);
  }

  static tooManyRequests(message: string = "Too many requests"): ApiError {
    return new ApiError(429, message);
  }

  static internal(message: string = "Internal Server Error"): ApiError {
    return new ApiError(500, message, [], false);
  }
}
