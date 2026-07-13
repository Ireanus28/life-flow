"use client";

import { useState } from "react";
import { Bell, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { confirmDelete } from "@/lib/confirm-delete";

type Channel = "IN_APP" | "EMAIL" | "SMS" | "PUSH";

type Reminder = {
  id: string;
  title: string;
  remindAt: string;
  channel: Channel;
};

const channelLabel: Record<Channel, string> = {
  IN_APP: "In-app",
  EMAIL: "Email",
  SMS: "SMS",
  PUSH: "Push",
};

export function ReminderList({ initialReminders }: { initialReminders: Reminder[] }) {
  const [reminders, setReminders] = useState(initialReminders);
  const [title, setTitle] = useState("");
  const [remindAt, setRemindAt] = useState("");
  const [channel, setChannel] = useState<Channel>("IN_APP");
  const [creating, setCreating] = useState(false);

  async function remove(id: string) {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    await fetch(`/api/reminders/${id}`, { method: "DELETE" });
    toast.success("Reminder deleted");
  }

  async function createReminder(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !remindAt || creating) return;
    setCreating(true);
    const res = await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), remindAt: new Date(remindAt).toISOString(), channel }),
    });
    setCreating(false);
    if (res.ok) {
      const { reminder } = await res.json();
      setReminders((prev) => [...prev, reminder].sort((a, b) => a.remindAt.localeCompare(b.remindAt)));
      setTitle("");
      setRemindAt("");
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 sm:px-8">
      <h1 className="font-display text-2xl font-medium text-foreground">Reminders</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Say &ldquo;remind me to…&rdquo; in chat, or add one below.
      </p>

      <form onSubmit={createReminder} className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <label htmlFor="reminder-title" className="sr-only">
          Reminder title
        </label>
        <Input
          id="reminder-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Remind me to…"
          className="w-full sm:flex-1 sm:basis-40"
        />
        <div className="flex flex-wrap gap-2">
          <label htmlFor="reminder-time" className="sr-only">
            Remind at
          </label>
          <Input
            id="reminder-time"
            type="datetime-local"
            value={remindAt}
            onChange={(e) => setRemindAt(e.target.value)}
            className="flex-1 sm:basis-48"
          />
          <Select value={channel} onValueChange={(value) => setChannel(value as Channel)}>
            <SelectTrigger aria-label="Reminder channel">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IN_APP">In-app</SelectItem>
              <SelectItem value="PUSH">Push</SelectItem>
              <SelectItem value="EMAIL">Email</SelectItem>
              <SelectItem value="SMS">SMS</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" disabled={creating || !title.trim() || !remindAt}>
            Add
          </Button>
        </div>
      </form>

      <ul className="mt-6 flex flex-col gap-2">
        {reminders.length === 0 && (
          <Card className="items-center gap-2 border-dashed py-10 text-center">
            <Bell aria-hidden="true" className="mx-auto h-6 w-6 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No reminders scheduled.</p>
          </Card>
        )}
        {reminders.map((r) => (
          <li
            key={r.id}
            className="flex flex-col gap-2 rounded-2xl border border-border bg-card px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3"
          >
            <span className="min-w-0 truncate text-sm text-foreground sm:flex-1">{r.title}</span>
            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
              <span className="text-xs tabular-nums text-muted-foreground">
                {new Date(r.remindAt).toLocaleString()}
              </span>
              <Badge variant="secondary">{channelLabel[r.channel]}</Badge>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete reminder "${r.title}"`}
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                onClick={() => confirmDelete(r.title, () => remove(r.id))}
              >
                <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
