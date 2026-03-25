import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { userRepository } from "../repositories/user.repository";
import { authRepository } from "../repositories/auth.repository";
import { logger } from "../utils/logger";
import type { IUser } from "../models/user.model";

/**
 * Configure Passport with Google OAuth strategy.
 * Called once during app initialization.
 */
export const configurePassport = (): void => {
  // ── Serialize / Deserialize ─────────────────────────────────────────────
  // Used for session management (we use JWT, but passport still needs these)

  passport.serializeUser((user, done) => {
    done(null, (user as IUser)._id.toString());
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await userRepository.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // ── Google OAuth Strategy ───────────────────────────────────────────────
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL;

  if (!clientID || !clientSecret || !callbackURL) {
    logger.warn("Google OAuth credentials not configured. Google login will be unavailable.");
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
        scope: ["profile", "email"],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;

          if (!email) {
            return done(new Error("No email found in Google profile"), undefined);
          }

          const { user } = await authRepository.findOrCreateGoogleUser({
            googleId: profile.id,
            email,
            name: profile.displayName,
            avatar: profile.photos?.[0]?.value,
          });

          return done(null, user);
        } catch (error) {
          logger.error({ error }, "Google OAuth strategy error");
          return done(error as Error, undefined);
        }
      },
    ),
  );

  logger.info("✅ Passport Google OAuth strategy configured.");
};
