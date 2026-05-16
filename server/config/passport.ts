import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { env } from "./env.ts";
import { googleAuthService } from "../services/auth.service.ts";
import { findUserById } from "../repositories/auth.repository.ts";
import type { JwtAccessPayload } from "../types/index.ts";

// ─── JWT Strategy ─────────────────────────────────────────────────────────────
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req?.cookies?.accessToken ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: env.jwtAccessSecret,
    },
    async (payload: JwtAccessPayload, done) => {
      try {
        const user = await findUserById(payload.userId);
        if (!user) return done(null, false);
        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    },
  ),
);

// ─── Google OAuth Strategy ────────────────────────────────────────────────────
passport.use(
  new GoogleStrategy(
    {
      clientID: env.googleClientId,
      clientSecret: env.googleClientSecret,
      callbackURL: env.googleCallbackUrl,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error("No email from Google"), false);

        const { user, tokens } = await googleAuthService({
          googleId: profile.id,
          email,
          name: profile.displayName,
          avatar: profile.photos?.[0]?.value,
        });

        // Pass tokens along for the callback to use
        return done(null, user, { tokens });
      } catch (error) {
        return done(error as Error, false);
      }
    },
  ),
);

export default passport;
