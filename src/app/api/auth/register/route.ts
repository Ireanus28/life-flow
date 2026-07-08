import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function POST(req: Request) {
  const body = await req.text();
  const res = await backendFetch("/api/auth/register", { method: "POST", body });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
