import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function GET() {
  const res = await backendFetch("/api/tasks");
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: Request) {
  const body = await req.text();
  const res = await backendFetch("/api/tasks", { method: "POST", body });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
