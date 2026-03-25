import { Router } from "express";
import passport from "passport";
import rateLimit from "express-rate-limit";
import { authController } from "../controllers/auth.controller";
import { protect } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { signupSchema, loginSchema } from "../validations/auth.validation";

const router = Router();

// Auth-specific Rate Limiters

/**
 * Strict limiter for login/signup — prevent brute force.
 * 10 requests per 15 minutes per IP.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Please try again after 15 minutes.",
  },
});

// Local Auth Routes

// POST /api/auth/signup
router.post(
  "/signup",
  authLimiter,
  validate(signupSchema),
  authController.signup.bind(authController),
);

// POST /api/auth/login
router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  authController.login.bind(authController),
);

// POST /api/auth/refresh-token
router.post("/refresh-token", authController.refreshToken.bind(authController));

// POST /api/auth/logout  (protected)
router.post("/logout", protect, authController.logout.bind(authController));

// POST /api/auth/logout-all  (protected)
router.post("/logout-all", protect, authController.logoutAll.bind(authController));

// GET /api/auth/me  (protected)
router.get("/me", protect, authController.getMe.bind(authController));

// Google OAuth Routes

// GET /api/auth/google — redirects to Google consent screen
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

// GET /api/auth/google/callback — Google redirects here after consent
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/auth/login?error=google_auth_failed`,
  }),
  authController.googleCallback.bind(authController),
);

export default router;
