import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.text();
  const res = await backendFetch("/api/chat", { method: "POST", body });
  return new NextResponse(res.body, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const conversationId = url.searchParams.get("conversationId");
  const before = url.searchParams.get("before");
  const take = url.searchParams.get("take");

  const params = new URLSearchParams();
  if (conversationId) params.set("conversationId", conversationId);
  if (before) params.set("before", before);
  if (take) params.set("take", take);

  const path = params.toString() ? `/api/chat?${params.toString()}` : "/api/chat";
  const res = await backendFetch(path);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
