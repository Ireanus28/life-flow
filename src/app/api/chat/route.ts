import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function POST(req: Request) {
  const body = await req.text();
  const res = await backendFetch("/api/chat", { method: "POST", body });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function GET(req: Request) {
  const conversationId = new URL(req.url).searchParams.get("conversationId");
  const path = conversationId ? `/api/chat?conversationId=${encodeURIComponent(conversationId)}` : "/api/chat";
  const res = await backendFetch(path);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
