import type { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { ApiError } from "../utils/ApiError";

/**
 * Generic Zod validation middleware factory.
 *
 * Validates req.body, req.params, req.query, and req.cookies
 * based on the provided Zod schema shape.
 *
 * Usage:
 *   router.post("/signup", validate(signupSchema), authController.signup);
 */
export const validate =
  (schema: ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
        cookies: req.cookies,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((err) => ({
          field: err.path.filter((p) => p !== "body" && p !== "params" && p !== "query").join("."),
          message: err.message,
        }));

        next(ApiError.badRequest("Validation failed", formattedErrors));
        return;
      }
      next(error);
    }
  };
