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
  const {
    eventTypes,
    configured: calendlyConfigured,
    authError: eventTypesAuthError,
    schedulingUrl,
  }: { eventTypes: CalendlyEventType[]; configured: boolean; authError: boolean; schedulingUrl: string | null } =
    await eventTypesRes.json();
  const {
    events: scheduledEvents,
    authError: scheduledEventsAuthError,
  }: { events: CalendlyScheduledEvent[]; authError: boolean } = await scheduledEventsRes.json();
  const calendlyAuthError = eventTypesAuthError || scheduledEventsAuthError;
  // The account's own scheduling page (needs `users:read`, which this app's
  // PAT may not have) is the reliable source — fall back to deriving one from
  // an event type's URL only when that call isn't available, so the card is
  // still clickable even before the users:read scope is granted.
  const calendlyProfileUrl = schedulingUrl ?? eventTypes[0]?.schedulingUrl.replace(/\/[^/]+\/?$/, "");

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

        <Card className={`relative sm:col-span-2 ${calendlyProfileUrl ? "transition-colors hover:bg-muted/40" : ""}`}>
          {/* Stretched-link pattern: clicking anywhere on the card's
              background opens Calendly to book, while the specific
              per-event-type buttons below still work as their own targets
              (they sit above this in stacking order). */}
          {calendlyProfileUrl && (
            <a
              href={calendlyProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 z-0 rounded-2xl"
              aria-label="Book a meeting on Calendly"
            />
          )}
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays aria-hidden="true" className="h-4 w-4 text-accent" />
              Meetings
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10 flex flex-col gap-5">
            {!calendlyConfigured ? (
              <p className="text-sm text-muted-foreground">Meeting booking isn&apos;t configured yet.</p>
            ) : calendlyAuthError ? (
              <p className="text-sm text-destructive">
                Calendly rejected the connection — the API key on the backend may be stale, wrong, or
                missing the required scopes. Check <code className="text-xs">CALENDLY_API_KEY</code> in the
                backend&apos;s environment and confirm it matches an active Personal Access Token.
              </p>
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

                <div className="relative z-10">
                  <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Book a meeting
                  </p>
                  {eventTypes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No event types set up yet.{" "}
                      {calendlyProfileUrl
                        ? "Click anywhere on this card to open Calendly and create one."
                        : "Create one in Calendly to start taking bookings."}
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {eventTypes.map((eventType) => (
                        <Button
                          key={eventType.uri}
                          size="sm"
                          variant="outline"
                          nativeButton={false}
                          className="relative z-10"
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
