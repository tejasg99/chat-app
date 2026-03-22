import type { Response } from "express";

/**
 * Standardized API Response structure.
 */
interface ApiResponseBody<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: unknown;
}

/**
 * Sends a standardized success JSON response.
 */
export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = 200,
): Response<ApiResponseBody<T>> => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Sends a standardized error JSON response.
 */
export const sendError = (
  res: Response,
  message: string,
  error?: unknown,
  statusCode: number = 500,
): Response<ApiResponseBody<never>> => {
  return res.status(statusCode).json({
    success: false,
    message,
    error,
  });
};

/**
 * Alias class-style usage if preferred (optional).
 * Follows the same standardized format.
 */
export class ApiResponse<T> {
  public readonly success: boolean;
  public readonly message: string;
  public readonly data?: T;
  public readonly statusCode: number;

  constructor(statusCode: number, message: string, data?: T) {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
  }

  send(res: Response): Response {
    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      data: this.data,
    });
  }
}
