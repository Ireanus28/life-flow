import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "lifeflow_session";

// Coarse gate only — presence of the cookie, not JWT validity (the backend
// is the real authority; every proxied route/page handles a 401 by
// redirecting to /api/auth/logout). Good enough to keep a logged-out user
// from ever seeing an authed page flash before redirecting.
export default function middleware(req: NextRequest) {
  const isLoggedIn = !!req.cookies.get(SESSION_COOKIE);
  const isAppRoute = [
    "/dashboard",
    "/chat",
    "/tasks",
    "/reminders",
    "/memory",
    "/onboarding",
    "/settings",
  ].some((p) => req.nextUrl.pathname.startsWith(p));

  if (isAppRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/chat/:path*",
    "/tasks/:path*",
    "/reminders/:path*",
    "/memory/:path*",
    "/onboarding/:path*",
    "/settings/:path*",
  ],
};
