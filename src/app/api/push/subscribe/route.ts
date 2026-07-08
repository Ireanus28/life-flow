import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function POST(req: Request) {
  const body = await req.text();
  const res = await backendFetch("/api/push/subscribe", { method: "POST", body });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(req: Request) {
  const body = await req.text();
  const res = await backendFetch("/api/push/subscribe", { method: "DELETE", body });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
