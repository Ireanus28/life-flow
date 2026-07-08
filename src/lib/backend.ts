import { getSessionToken } from "@/lib/session";

/**
 * Server-side proxy (BFF) call site — every Server Component page and API
 * route proxy goes through this instead of talking to Prisma directly. The
 * Next.js server forwards the session token to the backend; the browser
 * never talks to the backend at all.
 */
export async function backendFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await getSessionToken();
  return fetch(`${process.env.BACKEND_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });
}
