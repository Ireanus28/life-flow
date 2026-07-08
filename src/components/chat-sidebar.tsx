"use client";

import { SquarePen, MessageCircle } from "lucide-react";

export type ConversationSummary = { id: string; title: string; updatedAt: string };

export function ChatSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onNavigate,
}: {
  conversations: ConversationSummary[];
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Chat history" className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-background p-3">
      <button
        onClick={() => {
          onNewChat();
          onNavigate?.();
        }}
        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        <SquarePen aria-hidden="true" className="h-4 w-4" />
        New chat
      </button>

      <p className="mt-4 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Chats</p>

      <ul className="mt-1 flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {conversations.length === 0 ? (
          <li className="px-3 py-2 text-sm text-muted-foreground">No conversations yet.</li>
        ) : (
          conversations.map((c) => {
            const active = c.id === activeConversationId;
            return (
              <li key={c.id}>
                <button
                  onClick={() => {
                    onSelectConversation(c.id);
                    onNavigate?.();
                  }}
                  aria-current={active ? "page" : undefined}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    active
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <MessageCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{c.title || "Untitled conversation"}</span>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </nav>
  );
}
