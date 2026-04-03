import { Request, Response, NextFunction, RequestHandler } from "express";

// Generic asyncHandler — TRequest defaults to Request but can be narrowed
// to AuthenticatedRequest for protected routes without causing type errors
export const asyncHandler =
  <TRequest extends Request = Request>(
    fn: (req: TRequest, res: Response, next: NextFunction) => Promise<void>,
  ): RequestHandler =>
  (req, res, next) => {
    // Safe cast: we know the route is only reachable with the correct req shape
    Promise.resolve(fn(req as TRequest, res, next)).catch(next);
  };
