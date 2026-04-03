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

// Google OAuth
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
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
