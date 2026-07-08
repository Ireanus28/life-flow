import { redirect } from "next/navigation";
import { backendFetch } from "@/lib/backend";
import { NotificationSettings } from "@/components/notification-settings";

export default async function NotificationSettingsPage() {
  const res = await backendFetch("/api/settings/notifications");
  if (res.status === 401) redirect("/api/auth/logout");
  const { preferences } = await res.json();

  return <NotificationSettings initialPreferences={preferences} />;
}
