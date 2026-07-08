import { cookies } from "next/headers";

const COOKIE_NAME = "lifeflow_session";
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days, matches the backend JWT's expiry

/**
 * The session is a JWT issued by the backend, held in a normal same-origin
 * first-party httpOnly cookie set by this Next.js server (the backend never
 * sets cookies itself — only the browser-facing frontend does). No CORS or
 * cross-site cookie concerns: the browser only ever talks to this frontend.
 */
export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
