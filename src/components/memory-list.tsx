"use client";

import { useState } from "react";
import { Brain, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Category = "PREFERENCE" | "FACT" | "RELATIONSHIP" | "CONTEXT";

type Memory = {
  id: string;
  content: string;
  category: Category;
  confidence: number;
};

const categoryColor: Record<Category, string> = {
  PREFERENCE: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
  FACT: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  RELATIONSHIP: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-400",
  CONTEXT: "bg-muted text-muted-foreground",
};

export function MemoryList({ initialMemories }: { initialMemories: Memory[] }) {
  const [memories, setMemories] = useState(initialMemories);
  const [editing, setEditing] = useState<Memory | null>(null);
  const [draftContent, setDraftContent] = useState("");
  const [draftCategory, setDraftCategory] = useState<Category>("FACT");
  const [saving, setSaving] = useState(false);

  async function remove(id: string) {
    setMemories((prev) => prev.filter((m) => m.id !== id));
    await fetch(`/api/memories/${id}`, { method: "DELETE" });
  }

  function openEdit(memory: Memory) {
    setEditing(memory);
    setDraftContent(memory.content);
    setDraftCategory(memory.category);
  }

  async function saveEdit() {
    if (!editing || !draftContent.trim() || saving) return;
    setSaving(true);
    const res = await fetch(`/api/memories/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: draftContent.trim(), category: draftCategory }),
    });
    setSaving(false);
    if (res.ok) {
      const { memory } = await res.json();
      setMemories((prev) => prev.map((m) => (m.id === memory.id ? memory : m)));
      toast.success("Memory updated");
      setEditing(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 sm:px-8">
      <h1 className="font-display text-2xl font-medium text-foreground">Memory</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        What LifeFlow has learned about you. Edit or delete anything that&apos;s wrong.
      </p>

      <ul className="mt-6 flex flex-col gap-2">
        {memories.length === 0 && (
          <Card className="items-center gap-2 border-dashed py-10 text-center">
            <Brain aria-hidden="true" className="mx-auto h-6 w-6 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No memories yet. Try telling chat something like &ldquo;I prefer afternoon meetings&rdquo;.
            </p>
          </Card>
        )}
        {memories.map((m) => (
          <li
            key={m.id}
            className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
          >
            <Badge className={categoryColor[m.category]}>{m.category}</Badge>
            <span className="min-w-0 flex-1 basis-40 text-sm wrap-break-word text-foreground">{m.content}</span>
            <Button variant="ghost" size="icon-sm" aria-label={`Edit memory: ${m.content}`} onClick={() => openEdit(m)}>
              <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Delete memory: ${m.content}`}
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={() => remove(m.id)}
            >
              <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
            </Button>
          </li>
        ))}
      </ul>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit memory</DialogTitle>
          </DialogHeader>
          <Textarea value={draftContent} onChange={(e) => setDraftContent(e.target.value)} rows={3} />
          <Select value={draftCategory} onValueChange={(value) => setDraftCategory(value as Category)}>
            <SelectTrigger aria-label="Memory category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PREFERENCE">Preference</SelectItem>
              <SelectItem value="FACT">Fact</SelectItem>
              <SelectItem value="RELATIONSHIP">Relationship</SelectItem>
              <SelectItem value="CONTEXT">Context</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button type="button" disabled={saving || !draftContent.trim()} onClick={saveEdit}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
