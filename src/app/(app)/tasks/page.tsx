import { redirect } from "next/navigation";
import { backendFetch } from "@/lib/backend";
import { TaskBoard } from "@/components/task-board";

export default async function TasksPage() {
  const res = await backendFetch("/api/tasks");
  if (res.status === 401) redirect("/api/auth/logout");
  const { tasks } = await res.json();

  return (
    <TaskBoard
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialTasks={tasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        parentId: t.parentId,
        recurrenceInterval: t.recurrenceInterval,
        shareToken: t.shareToken,
      }))}
    />
  );
}
