import { redirect } from "next/navigation";
import { backendFetch } from "@/lib/backend";
import { getSessionToken } from "@/lib/session";
import { SidebarNav } from "@/components/sidebar-nav";
import { GlobalSearch } from "@/components/global-search";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const token = await getSessionToken();
  if (token) {
    const res = await backendFetch("/api/auth/me");
    // A JWT the backend rejects (deleted user, expired, tampered) means the
    // cookie is stale — clear it and force a clean re-login instead of
    // letting every downstream page crash trying to use it.
    if (res.status === 401) redirect("/api/auth/logout");
    const { user } = await res.json();
    if (!user.onboardedAt) redirect("/onboarding");
  }

  return (
    <div className="flex flex-1">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-accent-foreground"
      >
        Skip to main content
      </a>
      <SidebarNav />
      <GlobalSearch />
      <main id="main-content" className="min-w-0 flex-1 overflow-y-auto bg-muted/40 pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
