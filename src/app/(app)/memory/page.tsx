import { redirect } from "next/navigation";
import { backendFetch } from "@/lib/backend";
import { MemoryList } from "@/components/memory-list";

export default async function MemoryPage() {
  const res = await backendFetch("/api/memories");
  if (res.status === 401) redirect("/api/auth/logout");
  const { memories } = await res.json();

  return (
    <MemoryList
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialMemories={memories.map((m: any) => ({
        id: m.id,
        content: m.content,
        category: m.category,
        confidence: m.confidence,
      }))}
    />
  );
}
