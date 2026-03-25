import type { AuthUser } from "./auth.types";

declare module "express" {
  interface Request {
    user?: AuthUser;
  }
}

export {};
