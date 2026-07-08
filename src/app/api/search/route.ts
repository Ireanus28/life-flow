import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  const res = await backendFetch(`/api/search?q=${encodeURIComponent(q)}`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
