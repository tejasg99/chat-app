import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { ApiError } from "../utils/ApiError.ts";
import type { IUser } from "../types/index.ts";

// Uses Request (not AuthenticatedRequest) to satisfy Express's middleware
// signature — req.user is correctly typed as IUser via namespace augmentation
export const protect = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate("jwt", { session: false }, (err: Error | null, user: IUser | false) => {
    if (err) return next(err);
    if (!user) return next(new ApiError(401, "Unauthorized — please log in"));
    if (user.isBlocked) return next(new ApiError(403, "Your account has been blocked"));

    req.user = user;
    next();
  })(req, res, next);
};
