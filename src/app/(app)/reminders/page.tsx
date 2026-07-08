import { redirect } from "next/navigation";
import { backendFetch } from "@/lib/backend";
import { ReminderList } from "@/components/reminder-list";

export default async function RemindersPage() {
  const res = await backendFetch("/api/reminders");
  if (res.status === 401) redirect("/api/auth/logout");
  const { reminders } = await res.json();

  return (
    <ReminderList
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialReminders={reminders.map((r: any) => ({
        id: r.id,
        title: r.title,
        remindAt: r.remindAt,
        channel: r.channel,
      }))}
    />
  );
}
