"use client";

import { useMemo, useState } from "react";
import { ListTodo, Trash2, Share2, Copy, Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type Task = {
  id: string;
  title: string;
  status: "PENDING" | "IN_PROGRESS" | "DONE" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string | null;
  parentId: string | null;
  recurrenceInterval: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | null;
  shareToken: string | null;
};

const priorityColor: Record<Task["priority"], string> = {
  LOW: "bg-muted text-muted-foreground",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  HIGH: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  URGENT: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

const recurrenceLabel: Record<NonNullable<Task["recurrenceInterval"]>, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

function TaskRow({
  task,
  nested = false,
  onToggleDone,
  onDelete,
  onRecurrenceChange,
  onShare,
}: {
  task: Task;
  nested?: boolean;
  onToggleDone: (task: Task) => void;
  onDelete: (id: string) => void;
  onRecurrenceChange: (task: Task, interval: Task["recurrenceInterval"]) => void;
  onShare: (task: Task) => void;
}) {
  return (
    <li
      className={`flex flex-col gap-2 rounded-2xl border border-border bg-card px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 ${
        nested ? "ml-4 border-dashed sm:ml-6" : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Checkbox
          checked={task.status === "DONE"}
          onCheckedChange={() => onToggleDone(task)}
          aria-label={`Mark "${task.title}" as ${task.status === "DONE" ? "not done" : "done"}`}
        />
        <span
          className={`min-w-0 flex-1 truncate text-sm sm:flex-initial ${task.status === "DONE" ? "text-muted-foreground line-through" : "text-foreground"}`}
        >
          {task.title}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 pl-7 sm:ml-auto sm:flex-1 sm:justify-end sm:pl-0">
        {task.dueDate && (
          <span className="text-xs tabular-nums text-muted-foreground">
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
        <Badge className={priorityColor[task.priority]}>{task.priority}</Badge>
        {!nested && (
          <Select
            value={task.recurrenceInterval ?? "none"}
            onValueChange={(value) => onRecurrenceChange(task, value === "none" ? null : (value as Task["recurrenceInterval"]))}
          >
            <SelectTrigger size="sm" aria-label={`Recurrence for "${task.title}"`}>
              <SelectValue placeholder="Repeat">
                {task.recurrenceInterval ? recurrenceLabel[task.recurrenceInterval] : "One-off"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">One-off</SelectItem>
              <SelectItem value="DAILY">Daily</SelectItem>
              <SelectItem value="WEEKLY">Weekly</SelectItem>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="YEARLY">Yearly</SelectItem>
            </SelectContent>
          </Select>
        )}
        {!nested && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Share "${task.title}"`}
            onClick={() => onShare(task)}
          >
            <Share2 aria-hidden="true" className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Delete "${task.title}"`}
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onDelete(task.id)}
        >
          <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
        </Button>
      </div>
    </li>
  );
}

export function TaskBoard({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [subtaskDrafts, setSubtaskDrafts] = useState<Record<string, string>>({});
  const [shareTask, setShareTask] = useState<Task | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const topLevel = useMemo(() => tasks.filter((t) => !t.parentId), [tasks]);
  const subtasksOf = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.parentId) continue;
      map.set(t.parentId, [...(map.get(t.parentId) ?? []), t]);
    }
    return map;
  }, [tasks]);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || adding) return;
    setAdding(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    });
    setAdding(false);
    if (res.ok) {
      const { task } = await res.json();
      setTasks((prev) => [task, ...prev]);
      setTitle("");
    }
  }

  async function addSubtask(parentId: string) {
    const draft = subtaskDrafts[parentId]?.trim();
    if (!draft) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: draft, parentId }),
    });
    if (res.ok) {
      const { task } = await res.json();
      setTasks((prev) => [...prev, task]);
      setSubtaskDrafts((prev) => ({ ...prev, [parentId]: "" }));
    }
  }

  async function toggleDone(task: Task) {
    const nextStatus = task.status === "DONE" ? "PENDING" : "DONE";
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)));
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok && nextStatus === "DONE" && task.recurrenceInterval) {
      toast.success("Task complete — next occurrence scheduled");
      const refreshed = await fetch("/api/tasks");
      if (refreshed.ok) setTasks((await refreshed.json()).tasks);
    }
  }

  async function removeTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id && t.parentId !== id));
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  }

  async function changeRecurrence(task: Task, interval: Task["recurrenceInterval"]) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, recurrenceInterval: interval } : t)));
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recurrenceInterval: interval }),
    });
  }

  async function openShare(task: Task) {
    setShareTask(task);
    setCopied(false);
    if (task.shareToken) {
      setShareUrl(`${window.location.origin}/share/task/${task.shareToken}`);
      return;
    }
    const res = await fetch(`/api/tasks/${task.id}/share`, { method: "POST" });
    if (res.ok) {
      const { shareToken } = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, shareToken } : t)));
      setShareUrl(`${window.location.origin}/share/task/${shareToken}`);
    }
  }

  async function revokeShare() {
    if (!shareTask) return;
    await fetch(`/api/tasks/${shareTask.id}/share`, { method: "DELETE" });
    setTasks((prev) => prev.map((t) => (t.id === shareTask.id ? { ...t, shareToken: null } : t)));
    setShareTask(null);
    setShareUrl(null);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 sm:px-8">
      <h1 className="font-display text-2xl font-medium text-foreground">Tasks</h1>

      <form onSubmit={addTask} className="mt-6 flex gap-2">
        <label htmlFor="new-task" className="sr-only">
          Add a task
        </label>
        <Input
          id="new-task"
          name="title"
          autoComplete="off"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task…"
          className="flex-1 rounded-full! focus-visible:rounded-full!"
        />
        <Button type="submit" disabled={adding || !title.trim()} className="rounded-full!">
          Add
        </Button>
      </form>

      <ul className="mt-6 flex flex-col gap-2">
        {topLevel.length === 0 && (
          <Card className="items-center gap-2 border-dashed py-10 text-center">
            <ListTodo aria-hidden="true" className="mx-auto h-6 w-6 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No tasks yet. Add one above or ask in chat.</p>
          </Card>
        )}
        {topLevel.map((task) => (
          <li key={task.id} className="flex flex-col gap-2">
            <ul className="flex flex-col gap-2">
              <TaskRow
                task={task}
                onToggleDone={toggleDone}
                onDelete={removeTask}
                onRecurrenceChange={changeRecurrence}
                onShare={openShare}
              />
              {(subtasksOf.get(task.id) ?? []).map((sub) => (
                <TaskRow
                  key={sub.id}
                  task={sub}
                  nested
                  onToggleDone={toggleDone}
                  onDelete={removeTask}
                  onRecurrenceChange={changeRecurrence}
                  onShare={openShare}
                />
              ))}
            </ul>
            {!task.parentId && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addSubtask(task.id);
                }}
                className="ml-6 flex items-center gap-2"
              >
                <Plus aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <Input
                  value={subtaskDrafts[task.id] ?? ""}
                  onChange={(e) => setSubtaskDrafts((prev) => ({ ...prev, [task.id]: e.target.value }))}
                  placeholder="Add subtask…"
                  className="h-7 flex-1 text-xs"
                  aria-label={`Add subtask to "${task.title}"`}
                />
              </form>
            )}
          </li>
        ))}
      </ul>

      <Dialog open={!!shareTask} onOpenChange={(open) => !open && setShareTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share task</DialogTitle>
            <DialogDescription>
              Anyone with this link can view &ldquo;{shareTask?.title}&rdquo; — no account needed.
            </DialogDescription>
          </DialogHeader>
          {shareUrl && (
            <div className="flex items-center gap-2">
              <Input readOnly value={shareUrl} className="flex-1 text-xs" />
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label="Copy link"
                onClick={async () => {
                  await navigator.clipboard.writeText(shareUrl);
                  setCopied(true);
                  toast.success("Link copied");
                }}
              >
                {copied ? <Check aria-hidden="true" className="h-4 w-4" /> : <Copy aria-hidden="true" className="h-4 w-4" />}
              </Button>
            </div>
          )}
          <Button type="button" variant="destructive" onClick={revokeShare}>
            Revoke link
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
