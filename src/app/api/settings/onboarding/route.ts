import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function PATCH(req: Request) {
  const body = await req.text();
  const res = await backendFetch("/api/settings/onboarding", { method: "PATCH", body });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
