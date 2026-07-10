"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageCircle, ListTodo, Bell, Brain, Settings, LogOut, Menu, SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useChatSidebarToggle } from "@/lib/chat-sidebar-store";

const links = [
  { href: "/chat?new=1", label: "New chat", icon: SquarePen },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/reminders", label: "Reminders", icon: Bell },
  { href: "/memory", label: "Memory", icon: Brain },
];

function BrandMark({ trailing, iconOnly }: { trailing?: ReactNode; iconOnly?: boolean }) {
  return (
    <div className="mb-8 flex items-center justify-between gap-2 px-2">
      <Link href="/dashboard" aria-label="LifeFlow" className="font-display flex items-center gap-2 text-lg font-medium text-foreground">
        <Brain aria-hidden="true" className="h-5 w-5 text-accent" />
        {!iconOnly && "LifeFlow"}
      </Link>
      {trailing}
    </div>
  );
}

function NavLinks({
  pathname,
  onNavigate,
  items = links,
}: {
  pathname: string;
  onNavigate?: () => void;
  items?: typeof links;
}) {
  return (
    <div className="flex flex-1 flex-col gap-1">
      {items.map((link) => {
        const active = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <link.icon aria-hidden="true" className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}

function NavFooter({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="border-t border-border pt-2">
      <Link
        href="/settings/notifications"
        onClick={onNavigate}
        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Settings aria-hidden="true" className="h-4 w-4" />
        Settings
      </Link>
      <a
        href="/api/auth/logout"
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <LogOut aria-hidden="true" className="h-4 w-4" />
        Sign out
      </a>
    </div>
  );
}

export function SidebarNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const chatSidebar = useChatSidebarToggle();
  // The chat page has its own inline header (hamburger + "LifeFlow ⌄" plan
  // dropdown, which folds in these same nav links) — showing this mobile bar
  // there too would be a second, redundant "LifeFlow" header stacked on top.
  const onChatPage = pathname === "/chat";

  return (
    <>
      {/* Mobile top bar */}
      {!onChatPage && (
        <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background px-4 md:hidden">
          <Link href="/dashboard" className="font-display flex items-center gap-2 text-base font-medium text-foreground">
            <Brain aria-hidden="true" className="h-5 w-5 text-accent" />
            LifeFlow
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open navigation menu"
              onClick={() => setOpen(true)}
            >
              <Menu aria-hidden="true" className="h-5 w-5" />
            </Button>
            <SheetContent side="left" className="flex flex-col p-4">
              <SheetHeader className="p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
              </SheetHeader>
              <BrandMark />
              <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
              <NavFooter onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
        </header>
      )}

      {/* Desktop fixed rail — no "New chat" entry here; starting a new chat
          happens from inside the chat page itself on desktop. */}
      <nav
        aria-label="Primary"
        className="hidden h-full w-56 flex-col border-r border-border bg-background p-4 md:flex"
      >
        <BrandMark
          iconOnly
          trailing={
            onChatPage && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Open chat history"
                onClick={() => chatSidebar.setOpen(true)}
              >
                <Menu aria-hidden="true" className="h-4 w-4" />
              </Button>
            )
          }
        />
        <NavLinks pathname={pathname} items={links.filter((l) => l.label !== "New chat")} />
        <NavFooter />
      </nav>
    </>
  );
}
