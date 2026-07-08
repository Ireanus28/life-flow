import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session";

/**
 * Clears the session cookie — used both for explicit sign-out and for the
 * stale-session case (a JWT whose user no longer exists; the backend's
 * requireAuth middleware 401s and callers redirect here to clean up).
 */
export async function GET(req: Request) {
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/login", req.url));
}
