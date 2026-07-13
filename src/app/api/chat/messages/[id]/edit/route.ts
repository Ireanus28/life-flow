import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.text();
  const res = await backendFetch(`/api/chat/messages/${id}/edit`, { method: "POST", body });
  return new NextResponse(res.body, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}
