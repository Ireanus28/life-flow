"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type ChatSidebarStore = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const ChatSidebarContext = createContext<ChatSidebarStore | null>(null);

/**
 * SidebarNav (the persistent desktop rail) and ChatWindow are siblings under
 * the shared app layout, not parent/child — this lets the rail's own
 * chat-history toggle (desktop only) and the chat page's Sheet stay in sync
 * without threading props through the layout.
 */
export function ChatSidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <ChatSidebarContext.Provider value={{ open, setOpen }}>{children}</ChatSidebarContext.Provider>;
}

export function useChatSidebarToggle(): ChatSidebarStore {
  const ctx = useContext(ChatSidebarContext);
  if (!ctx) throw new Error("useChatSidebarToggle must be used within a ChatSidebarProvider");
  return ctx;
}
