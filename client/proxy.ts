import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Auth route prefixes
const AUTH_ROUTES = ["/login", "/signup"];
// Protected route matcher — everything under /(main)/
const PROTECTED_ROUTES = ["/chats"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for access token cookie (set by backend)
  const accessToken = request.cookies.get("accessToken")?.value;

  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isProtectedRoute =
    PROTECTED_ROUTES.some((route) => pathname.startsWith(route)) ||
    pathname === "/";

  // Already logged in → redirect away from auth pages
  if (isAuthRoute && accessToken) {
    return NextResponse.redirect(new URL("/chats", request.url));
  }

  // Not logged in → redirect protected routes to login
  if (isProtectedRoute && !accessToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder
     * - auth/success (Google OAuth callback landing)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|auth/success).*)",
  ],
};
