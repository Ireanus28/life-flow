import { notFound } from "next/navigation";
import { Brain, ListChecks } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statusLabel: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  DONE: "Done",
  CANCELLED: "Cancelled",
};

export default async function SharedTaskPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // Public, unauthenticated lookup — no session cookie to forward, so this
  // calls the backend directly rather than going through backendFetch.
  const res = await fetch(`${process.env.BACKEND_URL}/api/public/tasks/share/${token}`, { cache: "no-store" });
  if (!res.ok) notFound();
  const { task } = await res.json();

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-muted/40 px-6 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Brain aria-hidden="true" className="h-4 w-4 text-accent" />
            Shared from LifeFlow{task.user.name ? ` by ${task.user.name}` : ""}
          </div>
          <CardTitle className="flex items-center gap-2 text-xl">
            <ListChecks aria-hidden="true" className="h-5 w-5 text-accent" />
            {task.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{statusLabel[task.status]}</Badge>
            <Badge variant="outline">{task.priority}</Badge>
            {task.dueDate && (
              <span className="text-xs tabular-nums text-muted-foreground">
                Due {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
