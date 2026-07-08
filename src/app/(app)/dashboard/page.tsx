import Link from "next/link";
import { redirect } from "next/navigation";
import { ListTodo, Bell, ArrowRight, CalendarDays } from "lucide-react";
import { backendFetch } from "@/lib/backend";
import { Card, CardHeader, CardTitle, CardContent, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Task = { id: string; title: string; status: string; dueDate: string | null };
type Reminder = { id: string; title: string; remindAt: string; sent: boolean };
type CalendlyEventType = { uri: string; name: string; schedulingUrl: string; durationMinutes: number };
type CalendlyScheduledEvent = { uri: string; name: string; startTime: string };

export default async function DashboardPage() {
  const [meRes, tasksRes, remindersRes, memoriesRes, eventTypesRes, scheduledEventsRes] = await Promise.all([
    backendFetch("/api/auth/me"),
    backendFetch("/api/tasks"),
    backendFetch("/api/reminders"),
    backendFetch("/api/memories"),
    backendFetch("/api/calendly/event-types"),
    backendFetch("/api/calendly/scheduled-events"),
  ]);

  if (meRes.status === 401) redirect("/api/auth/logout");

  const { user } = await meRes.json();
  const { tasks }: { tasks: Task[] } = await tasksRes.json();
  const { reminders }: { reminders: Reminder[] } = await remindersRes.json();
  const { memories } = await memoriesRes.json();
  const { eventTypes, configured: calendlyConfigured }: { eventTypes: CalendlyEventType[]; configured: boolean } =
    await eventTypesRes.json();
  const { events: scheduledEvents }: { events: CalendlyScheduledEvent[] } = await scheduledEventsRes.json();

  const openTasks = tasks
    .filter((t) => t.status === "PENDING" || t.status === "IN_PROGRESS")
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
    .slice(0, 5);
  const now = new Date().toISOString();
  const upcomingReminders = reminders
    .filter((r) => !r.sent && r.remindAt >= now)
    .sort((a, b) => a.remindAt.localeCompare(b.remindAt))
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 sm:px-8">
      <h1 className="font-display text-2xl font-medium text-foreground">
        Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}.
      </h1>
      <p className="mt-1 text-sm tabular-nums text-muted-foreground">
        {openTasks.length} open task{openTasks.length === 1 ? "" : "s"} · {upcomingReminders.length}{" "}
        upcoming reminder{upcomingReminders.length === 1 ? "" : "s"} · {memories.length} memories saved
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListTodo aria-hidden="true" className="h-4 w-4 text-accent" />
              Open tasks
            </CardTitle>
            <CardAction>
              <Link href="/tasks" className="text-xs font-medium text-muted-foreground hover:text-accent hover:underline">
                View all
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            {openTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing pending. Say &ldquo;add task…&rdquo; in chat.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {openTasks.map((t) => (
                  <li key={t.id} className="text-sm text-foreground">
                    {t.title}
                    {t.dueDate && (
                      <span className="ml-2 text-xs tabular-nums text-muted-foreground">
                        {new Date(t.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell aria-hidden="true" className="h-4 w-4 text-accent" />
              Upcoming reminders
            </CardTitle>
            <CardAction>
              <Link href="/reminders" className="text-xs font-medium text-muted-foreground hover:text-accent hover:underline">
                View all
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            {upcomingReminders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reminders scheduled.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {upcomingReminders.map((r) => (
                  <li key={r.id} className="text-sm text-foreground">
                    {r.title}
                    <span className="ml-2 text-xs tabular-nums text-muted-foreground">
                      {new Date(r.remindAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="sm:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays aria-hidden="true" className="h-4 w-4 text-accent" />
              Meetings
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {!calendlyConfigured ? (
              <p className="text-sm text-muted-foreground">Meeting booking isn&apos;t configured yet.</p>
            ) : (
              <>
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Upcoming
                  </p>
                  {scheduledEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No upcoming meetings.</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {scheduledEvents.map((event) => (
                        <li key={event.uri} className="text-sm text-foreground">
                          {event.name}
                          <span className="ml-2 text-xs tabular-nums text-muted-foreground">
                            {new Date(event.startTime).toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Book a meeting
                  </p>
                  {eventTypes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No bookable event types available.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {eventTypes.map((eventType) => (
                        <Button
                          key={eventType.uri}
                          size="sm"
                          variant="outline"
                          nativeButton={false}
                          render={<a href={eventType.schedulingUrl} target="_blank" rel="noopener noreferrer" />}
                        >
                          {eventType.name} ({eventType.durationMinutes}m)
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Button className="mt-8" nativeButton={false} render={<Link href="/chat" />}>
        Open chat
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Button>
    </div>
  );
}
