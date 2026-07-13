import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await backendFetch(`/api/chat/messages/${id}/regenerate`, { method: "POST" });
  return new NextResponse(res.body, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}
