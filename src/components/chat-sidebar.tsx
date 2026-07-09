"use client";

import { useMemo, useState } from "react";
import { SquarePen, MessageCircle, MoreHorizontal, Pin, PinOff, Pencil, Archive, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export type ConversationSummary = { id: string; title: string; updatedAt: string; pinned: boolean };

export function ChatSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onNavigate,
  onPin,
  onRename,
  onArchive,
  onDelete,
}: {
  conversations: ConversationSummary[];
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onNavigate?: () => void;
  onPin: (id: string, pinned: boolean) => void;
  onRename: (id: string, title: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [renaming, setRenaming] = useState<ConversationSummary | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const { pinned, rest } = useMemo(() => {
    const pinned = conversations.filter((c) => c.pinned);
    const rest = conversations.filter((c) => !c.pinned);
    return { pinned, rest };
  }, [conversations]);

  function openRename(c: ConversationSummary) {
    setRenaming(c);
    setRenameValue(c.title);
  }

  function submitRename(e: React.FormEvent) {
    e.preventDefault();
    if (!renaming || !renameValue.trim()) return;
    onRename(renaming.id, renameValue.trim());
    setRenaming(null);
  }

  function confirmDelete(c: ConversationSummary) {
    if (window.confirm(`Delete "${c.title || "this conversation"}"? This can't be undone.`)) {
      onDelete(c.id);
    }
  }

  function renderRow(c: ConversationSummary) {
    const active = c.id === activeConversationId;
    return (
      <li key={c.id} className="group/row flex items-center">
        <button
          onClick={() => {
            onSelectConversation(c.id);
            onNavigate?.();
          }}
          aria-current={active ? "page" : undefined}
          className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl px-3 py-2 text-left text-sm transition-colors ${
            active
              ? "bg-accent text-accent-foreground font-medium"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <MessageCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{c.title || "Untitled conversation"}</span>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Options for "${c.title}"`}
                className="shrink-0 opacity-0 group-hover/row:opacity-100 data-popup-open:opacity-100"
              >
                <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="rounded-2xl">
            <DropdownMenuItem onClick={() => onPin(c.id, !c.pinned)}>
              {c.pinned ? (
                <>
                  <PinOff aria-hidden="true" />
                  Unpin
                </>
              ) : (
                <>
                  <Pin aria-hidden="true" />
                  Pin
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openRename(c)}>
              <Pencil aria-hidden="true" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onArchive(c.id)}>
              <Archive aria-hidden="true" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => confirmDelete(c)}>
              <Trash2 aria-hidden="true" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </li>
    );
  }

  return (
    <>
      <nav aria-label="Chat history" className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-background p-3">
        <button
          onClick={() => {
            onNewChat();
            onNavigate?.();
          }}
          className="flex items-center gap-2.5 rounded-2xl px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <SquarePen aria-hidden="true" className="h-4 w-4" />
          New chat
        </button>

        <div className="mt-2 flex-1 overflow-y-auto">
          {pinned.length > 0 && (
            <>
              <p className="mt-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Pinned</p>
              <ul className="mt-1 flex flex-col gap-0.5">{pinned.map(renderRow)}</ul>
            </>
          )}

          <p className="mt-4 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Chats</p>
          <ul className="mt-1 flex flex-col gap-0.5">
            {rest.length === 0 && pinned.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">No conversations yet.</li>
            ) : (
              rest.map(renderRow)
            )}
          </ul>
        </div>
      </nav>

      <Dialog open={!!renaming} onOpenChange={(open) => !open && setRenaming(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Rename conversation</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitRename} className="flex flex-col gap-3">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              autoFocus
              maxLength={100}
              aria-label="Conversation title"
            />
            <DialogFooter>
              <Button type="submit" disabled={!renameValue.trim()}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
