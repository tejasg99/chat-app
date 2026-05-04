import { Router } from "express";
import passport from "passport";
import {
  signup,
  login,
  refreshToken,
  logout,
  googleCallback,
} from "../controllers/auth.controller.ts";
import { protect } from "../middlewares/auth.middleware.ts";
import { authRateLimiter } from "../middlewares/rateLimiter.middleware.ts";

const router = Router();

router.post("/signup", authRateLimiter, signup);
router.post("/login", authRateLimiter, login);
router.post("/refresh-token", refreshToken);
router.post("/logout", protect, logout);

// Google OAuth — ?platform=mobile triggers deep-link callback for native app
router.get(
  "/google",
  (req, res, next) => {
    const platform = req.query.platform === "mobile" ? "mobile" : "web";
    passport.authenticate("google", {
      scope: ["profile", "email"],
      session: false,
      state: platform,
    })(req, res, next);
  },
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/api/auth/google/failure",
  }),
  googleCallback,
);

router.get("/google/failure", (_req, res) => {
  res.status(401).json({ success: false, message: "Google authentication failed" });
});

export default router;
