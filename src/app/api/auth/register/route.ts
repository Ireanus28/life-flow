import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";
import { setSessionCookie } from "@/lib/session";

export async function POST(req: Request) {
  const body = await req.text();
  const res = await backendFetch("/api/auth/register", { method: "POST", body });
  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  await setSessionCookie(data.token);
  return NextResponse.json({ user: data.user }, { status: res.status });
}
