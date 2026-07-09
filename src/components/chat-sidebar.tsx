"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  SquarePen,
  MessageCircle,
  MoreHorizontal,
  Pin,
  PinOff,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export type ConversationSummary = {
  id: string;
  title: string;
  updatedAt: string;
  pinned: boolean;
  archived: boolean;
};

const RECENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

type SearchMessageResult = { id: string; content: string; conversationId: string; role: string };

function useLongPress(onLongPress: () => void, ms = 500) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = useCallback(() => {
    timer.current = setTimeout(onLongPress, ms);
  }, [onLongPress, ms]);
  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  return { onTouchStart: start, onTouchEnd: clear, onTouchMove: clear, onTouchCancel: clear };
}

function ConversationRow({
  conversation: c,
  active,
  onSelect,
  onNavigate,
  onPin,
  onRename,
  onArchive,
  onDeleteRequest,
}: {
  conversation: ConversationSummary;
  active: boolean;
  onSelect: (id: string) => void;
  onNavigate?: () => void;
  onPin: (id: string, pinned: boolean) => void;
  onRename: (c: ConversationSummary) => void;
  onArchive: (id: string, archived: boolean) => void;
  onDeleteRequest: (c: ConversationSummary) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const longPress = useLongPress(() => setMenuOpen(true));

  return (
    <li className="group/row flex items-center" {...longPress}>
      <button
        onClick={() => {
          onSelect(c.id);
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
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
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
          <DropdownMenuItem onClick={() => onRename(c)}>
            <Pencil aria-hidden="true" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onArchive(c.id, !c.archived)}>
            {c.archived ? (
              <>
                <ArchiveRestore aria-hidden="true" />
                Unarchive
              </>
            ) : (
              <>
                <Archive aria-hidden="true" />
                Archive
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => onDeleteRequest(c)}>
            <Trash2 aria-hidden="true" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

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
  onArchive: (id: string, archived: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [renaming, setRenaming] = useState<ConversationSummary | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ConversationSummary | null>(null);
  // Computed once (lazy initializer) rather than via Date.now() inside the
  // memo below — the Recent/Older boundary doesn't need to tick live while
  // the panel is open.
  const [recentCutoff] = useState(() => Date.now() - RECENT_WINDOW_MS);

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchMessageResult[] | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    // Nothing to clear when empty — the results section is only rendered
    // while `query.trim()` is truthy, so stale state here is never shown.
    if (!trimmed) return;
    const handle = setTimeout(() => {
      setSearching(true);
      fetch(`/api/search?q=${encodeURIComponent(trimmed)}`)
        .then((res) => res.json())
        .then((data) => setSearchResults(data.messages ?? []))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  const titleById = useMemo(() => new Map(conversations.map((c) => [c.id, c.title])), [conversations]);

  const { pinned, recent, older, archived } = useMemo(() => {
    const active = conversations.filter((c) => !c.archived);
    const archived = conversations.filter((c) => c.archived);
    const pinned = active.filter((c) => c.pinned);
    const unpinned = active.filter((c) => !c.pinned);
    const recent = unpinned.filter((c) => new Date(c.updatedAt).getTime() >= recentCutoff);
    const older = unpinned.filter((c) => new Date(c.updatedAt).getTime() < recentCutoff);
    return { pinned, recent, older, archived };
  }, [conversations, recentCutoff]);

  function openRename(c: ConversationSummary) {
    setRenaming(c);
    setRenameValue(c.title);
  }

  function submitRename(e: React.FormEvent) {
    e.preventDefault();
    if (!renaming || !renameValue.trim()) return;
    onRename(renaming.id, renameValue.trim());
    toast.success("Chat renamed");
    setRenaming(null);
  }

  function handlePin(id: string, pinned: boolean) {
    onPin(id, pinned);
    toast.success(pinned ? "Chat pinned" : "Chat unpinned");
  }

  function handleArchive(id: string, archived: boolean) {
    onArchive(id, archived);
    toast.success(archived ? "Chat archived" : "Chat unarchived");
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    onDelete(deleteTarget.id);
    toast.success("Chat deleted");
    setDeleteTarget(null);
  }

  function renderSection(label: string, items: ConversationSummary[]) {
    if (items.length === 0) return null;
    return (
      <div key={label}>
        <p className="mt-4 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide first:mt-0">{label}</p>
        <ul className="mt-1 flex flex-col gap-0.5">
          {items.map((c) => (
            <ConversationRow
              key={c.id}
              conversation={c}
              active={c.id === activeConversationId}
              onSelect={onSelectConversation}
              onNavigate={onNavigate}
              onPin={handlePin}
              onRename={openRename}
              onArchive={handleArchive}
              onDeleteRequest={setDeleteTarget}
            />
          ))}
        </ul>
      </div>
    );
  }

  const isEmpty = pinned.length === 0 && recent.length === 0 && older.length === 0 && archived.length === 0;

  return (
    <>
      <nav aria-label="Chat history" className="flex h-full w-full flex-col p-3">
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

        <div className="relative mt-2">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats"
            aria-label="Search conversations"
            className="rounded-2xl! pl-9"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-2 flex-1 overflow-y-auto">
          {query.trim() ? (
            searching ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">Searching…</p>
            ) : !searchResults?.length ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">No messages match &ldquo;{query.trim()}&rdquo;.</p>
            ) : (
              <ul className="mt-1 flex flex-col gap-0.5">
                {searchResults.map((r) => (
                  <li key={r.id}>
                    <button
                      onClick={() => {
                        onSelectConversation(r.conversationId);
                        onNavigate?.();
                      }}
                      className="flex w-full flex-col items-start gap-0.5 rounded-2xl px-3 py-2 text-left transition-colors hover:bg-muted"
                    >
                      <span className="w-full truncate text-sm font-medium text-foreground">
                        {titleById.get(r.conversationId) || "Untitled conversation"}
                      </span>
                      <span className="line-clamp-2 text-xs text-muted-foreground">{r.content}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : isEmpty ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">No conversations yet.</p>
          ) : (
            <>
              {renderSection("Pinned", pinned)}
              {renderSection("Recent", recent)}
              {renderSection("Older", older)}
              {renderSection("Archived", archived)}
            </>
          )}
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

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete chat?</DialogTitle>
            <DialogDescription>
              &ldquo;{deleteTarget?.title || "This conversation"}&rdquo; will be permanently deleted. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
