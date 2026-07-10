"use client";

import { useState, useRef, useEffect, useCallback, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowUp,
  Loader2,
  Mic,
  MicOff,
  Menu,
  Copy,
  Pencil,
  RotateCw,
  X,
  Brain,
  ListTodo,
  Bell,
  CalendarDays,
  ChevronDown,
  Check,
  Sparkles,
  LayoutDashboard,
  Settings,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ChatSidebar, type ConversationSummary } from "@/components/chat-sidebar";
import { MessageContent } from "@/components/message-content";
import { readSSE } from "@/lib/sse";
import { pricingTiers } from "@/lib/pricing-tiers";
import { useChatSidebarToggle } from "@/lib/chat-sidebar-store";

type ChatEntry = {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  failed?: boolean;
};

// Minimal shape of the Web Speech API's SpeechRecognition — not in lib.dom.d.ts.
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
}

const SPEECH_ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "Microphone access is blocked. Allow microphone permission for this site in your browser's settings and try again.",
  "service-not-allowed": "Microphone access is blocked. Allow microphone permission for this site in your browser's settings and try again.",
  "no-speech": "Didn't catch any speech — try again.",
  "audio-capture": "No microphone was found. Check that one is connected and try again.",
  network: "Voice input needs a network connection — check your connection and try again.",
  "language-not-supported": "Voice input doesn't support this language.",
};

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

// Feature-detection flag never changes after load, so there's nothing to
// subscribe to — this just gives the client-only value without an
// effect+setState cascade (and without a hydration mismatch, since the
// server snapshot is always `false`).
function noopSubscribe() {
  return () => {};
}

function redirectToLogout() {
  window.location.href = "/api/auth/logout";
}

// Module-level (not inline in the component) so the React Compiler doesn't
// treat this impure Date.now() call as happening during render — it's only
// ever invoked from event-handler-triggered async functions.
function generateTempId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const WELCOME_MESSAGE: ChatEntry = {
  id: "welcome",
  role: "assistant",
  content: "Ask me anything! I can help you with tasks, reminders, and more. Just type your message below and hit send.",
};

const PAGE_SIZE = 30;

const QUICK_ACTIONS: { label: string; icon: typeof Brain; starter: string }[] = [
  { label: "Add a task", icon: ListTodo, starter: "Add a task to " },
  { label: "Set a reminder", icon: Bell, starter: "Remind me to " },
  { label: "Remember this", icon: Brain, starter: "Remember that I " },
  { label: "Book a meeting", icon: CalendarDays, starter: "Help me book a meeting" },
];

function toEntries(history: { id: string; role: string; content: string }[]): ChatEntry[] {
  return history.map((m) => ({
    id: m.id,
    role: m.role.toLowerCase() === "user" ? "user" : "assistant",
    content: m.content,
  }));
}

type StreamEvent = {
  type: "start" | "token" | "done";
  conversationId?: string;
  userMessageId?: string;
  token?: string;
  messageId?: string;
};

type UserInfo = { name: string | null; email: string; tier: string };

function getTierInfo(tier: string | undefined) {
  const idx = pricingTiers.findIndex((t) => t.dbTier === tier);
  const current = idx === -1 ? pricingTiers[0] : pricingTiers[idx];
  const next = idx === -1 || idx === pricingTiers.length - 1 ? null : pricingTiers[idx + 1];
  return { current, next };
}

export function ChatWindow() {
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const { open: sidebarOpen, setOpen: setSidebarOpen } = useChatSidebarToggle();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [user, setUser] = useState<UserInfo | null>(null);
  const voiceSupported = useSyncExternalStore(noopSubscribe, () => !!getSpeechRecognitionCtor(), () => false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const stickToBottomRef = useRef(true);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const isEmptyState = historyLoaded && messages.length === 1 && messages[0].id === "welcome";

  useEffect(() => {
    if (stickToBottomRef.current) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // "New chat" in the main app nav links here with ?new=1 so it always lands
  // on a blank conversation rather than whatever was last open.
  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    queueMicrotask(() => {
      setConversationId(undefined);
      setMessages([WELCOME_MESSAGE]);
      setHasMore(false);
      router.replace("/chat");
    });
  }, [searchParams, router]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const fetchConversations = useCallback(async (): Promise<ConversationSummary[] | null> => {
    const res = await fetch("/api/chat");
    if (res.status === 401) {
      redirectToLogout();
      return null;
    }
    const { conversations: list } = await res.json();
    return list ?? [];
  }, []);

  const loadConversation = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/chat?conversationId=${id}&take=${PAGE_SIZE}`);
    if (res.status === 401) {
      redirectToLogout();
      return;
    }
    const { messages: history, hasMore: more } = await res.json();
    setConversationId(id);
    if (history?.length) {
      setMessages(toEntries(history));
      setHasMore(!!more);
    } else {
      setMessages([WELCOME_MESSAGE]);
      setHasMore(false);
    }
  }, []);

  // Load the user's most recent conversation (if any) so persisted chat
  // history survives a page reload instead of only living in the database.
  useEffect(() => {
    (async () => {
      try {
        const list = await fetchConversations();
        if (list === null) return;
        setConversations(list);

        const latest = list[0];
        if (!latest) {
          setMessages([WELCOME_MESSAGE]);
          return;
        }
        await loadConversation(latest.id);
      } catch {
        setMessages([WELCOME_MESSAGE]);
      } finally {
        setHistoryLoaded(true);
      }
    })();
  }, [fetchConversations, loadConversation]);

  async function loadOlder() {
    if (!conversationId || !hasMore || loadingOlder) return;
    const oldest = messages[0];
    if (!oldest) return;

    setLoadingOlder(true);
    const container = scrollRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;
    try {
      const res = await fetch(`/api/chat?conversationId=${conversationId}&before=${oldest.id}&take=${PAGE_SIZE}`);
      if (res.status === 401) {
        redirectToLogout();
        return;
      }
      const { messages: older, hasMore: more } = await res.json();
      if (older?.length) {
        setMessages((prev) => [...toEntries(older), ...prev]);
      }
      setHasMore(!!more);
      requestAnimationFrame(() => {
        if (container) container.scrollTop = container.scrollHeight - prevScrollHeight;
      });
    } finally {
      setLoadingOlder(false);
    }
  }

  function handleScroll() {
    const container = scrollRef.current;
    if (!container) return;
    stickToBottomRef.current = container.scrollHeight - container.scrollTop - container.clientHeight < 80;
    if (container.scrollTop < 60) loadOlder();
  }

  function startNewChat() {
    setConversationId(undefined);
    setMessages([WELCOME_MESSAGE]);
    setHasMore(false);
  }

  async function openConversation(id: string) {
    if (id === conversationId) return;
    setHistoryLoaded(false);
    await loadConversation(id);
    setHistoryLoaded(true);
  }

  async function patchConversation(id: string, patch: Partial<{ title: string; pinned: boolean; archived: boolean }>) {
    await fetch(`/api/chat/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  function handlePin(id: string, pinned: boolean) {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, pinned } : c)).sort((a, b) => Number(b.pinned) - Number(a.pinned)));
    patchConversation(id, { pinned });
  }

  function handleRename(id: string, title: string) {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
    patchConversation(id, { title });
  }

  function handleArchive(id: string, archived: boolean) {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, archived } : c)));
    if (archived && id === conversationId) startNewChat();
    patchConversation(id, { archived });
  }

  async function handleDelete(id: string) {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (id === conversationId) startNewChat();
    await fetch(`/api/chat/conversations/${id}`, { method: "DELETE" });
  }

  const toggleListening = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    // The Web Speech API only runs in a secure context — over a plain http://
    // origin (e.g. testing via a LAN IP instead of localhost or the deployed
    // https:// site) it silently fails to produce any transcript at all.
    if (!window.isSecureContext) {
      toast.error("Voice input needs a secure (https://) connection — it won't work over a plain http:// address.");
      return;
    }

    const SpeechRecognition = getSpeechRecognitionCtor();
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ");
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = (event) => {
      setListening(false);
      if (event.error === "aborted") return; // user-initiated stop, not a real failure
      const message = SPEECH_ERROR_MESSAGES[event.error];
      if (message) toast.error(message);
      else console.error("Speech recognition error:", event.error);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening]);

  /**
   * Shared driver for every path that streams a fresh assistant reply back
   * (a new message, an edited message, or a regeneration) — each just
   * prepares the message list differently beforehand, then hands off here.
   */
  async function runExchange(url: string, body: string | undefined, pendingUserId?: string) {
    setSending(true);
    stickToBottomRef.current = true;
    const assistantId = generateTempId("temp-assistant");
    let assistantAdded = false;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body,
      });

      if (res.status === 401) {
        redirectToLogout();
        return;
      }
      if (!res.ok || !res.body) throw new Error("Request failed");

      await readSSE(res.body, (raw) => {
        const event = raw as StreamEvent;
        if (event.type === "start") {
          if (event.conversationId) setConversationId(event.conversationId);
          if (event.userMessageId && pendingUserId) {
            const realId = event.userMessageId;
            setMessages((prev) => prev.map((m) => (m.id === pendingUserId ? { ...m, id: realId } : m)));
          }
        } else if (event.type === "token" && typeof event.token === "string") {
          const token = event.token;
          setMessages((prev) => {
            if (!assistantAdded) {
              assistantAdded = true;
              return [...prev, { id: assistantId, role: "assistant", content: token, streaming: true }];
            }
            return prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + token } : m));
          });
        } else if (event.type === "done") {
          const finalId = event.messageId;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, id: finalId ?? m.id, streaming: false } : m))
          );
          fetchConversations().then((list) => {
            if (list) setConversations(list);
          });
        }
      });
    } catch {
      if (pendingUserId) {
        setMessages((prev) => prev.map((m) => (m.id === pendingUserId ? { ...m, failed: true } : m)));
      } else {
        setMessages((prev) => [
          ...prev,
          { id: generateTempId("error"), role: "assistant", content: "Something went wrong. Try again." },
        ]);
      }
    } finally {
      setSending(false);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const tempId = generateTempId("temp-user");
    setMessages((prev) => [...prev, { id: tempId, role: "user", content: text }]);
    setInput("");
    await runExchange("/api/chat", JSON.stringify({ message: text, conversationId }), tempId);
  }

  function retryMessage(m: ChatEntry) {
    setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, failed: false } : x)));
    runExchange("/api/chat", JSON.stringify({ message: m.content, conversationId }), m.id);
  }

  function startEdit(m: ChatEntry) {
    setEditingId(m.id);
    setEditValue(m.content);
  }

  async function submitEdit(m: ChatEntry) {
    const content = editValue.trim();
    if (!content || sending) return;
    setEditingId(null);

    setMessages((prev) => {
      const idx = prev.findIndex((x) => x.id === m.id);
      if (idx === -1) return prev;
      return [...prev.slice(0, idx), { ...prev[idx], content }];
    });

    await runExchange(`/api/chat/messages/${m.id}/edit`, JSON.stringify({ content }));
  }

  async function regenerate(m: ChatEntry) {
    if (sending) return;
    setMessages((prev) => {
      const idx = prev.findIndex((x) => x.id === m.id);
      if (idx === -1) return prev;
      return prev.slice(0, idx);
    });
    await runExchange(`/api/chat/messages/${m.id}/regenerate`, undefined);
  }

  async function copyMessage(content: string) {
    await navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  }

  function applyQuickAction(starter: string) {
    setInput(starter);
    requestAnimationFrame(() => heroInputRef.current?.focus());
  }

  return (
    <div className="-mt-14 flex h-full md:mt-0">
      {/* The shared app layout reserves 56px up top for its mobile nav bar,
          which this page hides in favor of its own inline header below —
          claw that reserved space back so there's no empty gap on mobile. */}
      {/* Single toggleable sidebar — same control (one hamburger button) on
          every screen size, rather than a separate always-open desktop rail
          plus a different mobile mechanism. */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64! max-w-64! p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Chat history</SheetTitle>
          </SheetHeader>
          <ChatSidebar
            conversations={conversations}
            activeConversationId={conversationId}
            onSelectConversation={openConversation}
            onNewChat={startNewChat}
            onNavigate={() => setSidebarOpen(false)}
            onPin={handlePin}
            onRename={handleRename}
            onArchive={handleArchive}
            onDelete={handleDelete}
            user={user}
          />
        </SheetContent>
      </Sheet>

      <div className="flex h-full min-w-0 flex-1 flex-col">
        {/* Header stays flush against the rail's divider (full width) instead
            of living inside the centered message column — otherwise it'd
            inherit the same wide side margins as the chat content on a
            spacious desktop viewport. */}
        <div className="mb-4 flex items-center justify-between gap-4 px-6 pt-8">
          <div className="flex items-center gap-2">
            {/* Desktop-only: same toggle now lives in the persistent rail,
                on the same line as the brand mark. */}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open chat history"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden"
            >
              <Menu aria-hidden="true" className="h-5 w-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button className="font-display flex items-center gap-1 text-lg font-medium text-foreground">
                    LifeFlow
                    <ChevronDown aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                  </button>
                }
              />
              <DropdownMenuContent align="start" className="w-72 rounded-2xl p-1.5">
                {(() => {
                  const { current, next } = getTierInfo(user?.tier);
                  return (
                    <>
                      {/* Mobile hides the app-wide nav bar on this page (avoids a
                          second "LifeFlow" header) — these links keep Dashboard/
                          Tasks/Reminders/Memory/Settings one tap away here instead.
                          Desktop already has the full nav in the persistent rail,
                          so these are mobile-only there. */}
                      <DropdownMenuItem render={<Link href="/dashboard" />} className="rounded-xl p-2.5 md:hidden">
                        <LayoutDashboard aria-hidden="true" />
                        Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem render={<Link href="/tasks" />} className="rounded-xl p-2.5 md:hidden">
                        <ListTodo aria-hidden="true" />
                        Tasks
                      </DropdownMenuItem>
                      <DropdownMenuItem render={<Link href="/reminders" />} className="rounded-xl p-2.5 md:hidden">
                        <Bell aria-hidden="true" />
                        Reminders
                      </DropdownMenuItem>
                      <DropdownMenuItem render={<Link href="/memory" />} className="rounded-xl p-2.5 md:hidden">
                        <Brain aria-hidden="true" />
                        Memory
                      </DropdownMenuItem>
                      <DropdownMenuItem render={<Link href="/settings/notifications" />} className="rounded-xl p-2.5 md:hidden">
                        <Settings aria-hidden="true" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem render={<a href="/api/auth/logout" />} className="rounded-xl p-2.5 md:hidden">
                        <LogOut aria-hidden="true" />
                        Sign out
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="md:hidden" />
                      {next && (
                        <DropdownMenuItem render={<Link href="/settings/billing" />} className="items-start gap-2.5 rounded-xl p-2.5">
                          <div className="flex min-w-0 flex-1 flex-col">
                            <span className="text-sm font-medium text-foreground">LifeFlow {next.name}</span>
                            <span className="text-xs text-muted-foreground">{next.tagline}</span>
                          </div>
                          <span className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                            Upgrade
                          </span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem render={<Link href="/settings/billing" />} className="items-start gap-2.5 rounded-xl p-2.5">
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="text-sm font-medium text-foreground">LifeFlow {current.name}</span>
                          <span className="text-xs text-muted-foreground">{current.tagline}</span>
                        </div>
                        <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem render={<Link href="/settings/billing" />} className="rounded-xl p-2.5 text-muted-foreground">
                        See all plans
                      </DropdownMenuItem>
                    </>
                  );
                })()}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {getTierInfo(user?.tier).next && (
            <Button
              size="sm"
              nativeButton={false}
              render={<Link href="/settings/billing" />}
              className="gap-1.5 rounded-full!"
            >
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
              Upgrade
            </Button>
          )}
        </div>

        <div className="mx-auto flex w-full min-w-0 flex-1 flex-col px-6 pb-8 md:max-w-2xl">
        {!historyLoaded ? (
          <div className="flex flex-1 items-center justify-center" aria-hidden="true">
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
            </div>
          </div>
        ) : isEmptyState ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-2 text-center">
            <div className="flex items-center gap-2">
              <Brain aria-hidden="true" className="h-9 w-9 text-accent" />
              <h2 className="font-display text-2xl font-medium text-foreground sm:text-3xl">
                What should we tackle today?
              </h2>
            </div>

            <form onSubmit={sendMessage} className="w-full max-w-xl">
              <div className="flex items-center gap-2 rounded-3xl border border-border bg-card px-4 py-3 shadow-sm">
                <label htmlFor="chat-input-hero" className="sr-only">
                  Message LifeFlow
                </label>
                <input
                  id="chat-input-hero"
                  ref={heroInputRef}
                  autoComplete="off"
                  autoFocus
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="How can I help you today?"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none! focus-visible:outline-none!"
                />
                {voiceSupported && (
                  <button
                    type="button"
                    onClick={toggleListening}
                    aria-label={listening ? "Stop voice input" : "Start voice input"}
                    aria-pressed={listening}
                    className={`shrink-0 rounded-full p-2 transition-colors ${
                      listening ? "text-destructive" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {listening ? <MicOff aria-hidden="true" className="h-4 w-4" /> : <Mic aria-hidden="true" className="h-4 w-4" />}
                  </button>
                )}
                <Button
                  type="submit"
                  size="icon"
                  disabled={sending || !input.trim()}
                  aria-label="Send message"
                  className="shrink-0 rounded-full!"
                >
                  {sending ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <ArrowUp aria-hidden="true" className="h-4 w-4" />}
                </Button>
              </div>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {QUICK_ACTIONS.map((qa) => (
                <button
                  key={qa.label}
                  type="button"
                  onClick={() => applyQuickAction(qa.starter)}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                >
                  <qa.icon aria-hidden="true" className="h-4 w-4 text-accent" />
                  {qa.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          role="log"
          aria-live="polite"
          aria-label="Conversation"
          className="flex-1 space-y-4 overflow-y-auto"
        >
          {loadingOlder && <p className="text-center text-xs text-muted-foreground">Loading earlier messages…</p>}
          {messages.map((m) => (
            <div key={m.id} className={`group/msg flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
              {editingId === m.id ? (
                <div className="w-full max-w-[80%]">
                  <Textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} autoFocus rows={3} className="rounded-2xl!" />
                  <div className="mt-1.5 flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      <X aria-hidden="true" className="h-3.5 w-3.5" />
                      Cancel
                    </Button>
                    <Button size="sm" disabled={!editValue.trim()} onClick={() => submitEdit(m)}>
                      Save &amp; submit
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className={`max-w-[80%] min-w-0 rounded-2xl px-4 py-2.5 ${
                      m.role === "user"
                        ? "bg-accent text-accent-foreground wrap-break-word text-sm"
                        : "border border-border bg-card text-card-foreground"
                    }`}
                  >
                    {m.role === "assistant" ? <MessageContent content={m.content} /> : m.content}
                  </div>

                  {m.failed ? (
                    <button onClick={() => retryMessage(m)} className="mt-1 text-xs font-medium text-destructive hover:underline">
                      Failed to send · Retry
                    </button>
                  ) : (
                    <div className="mt-1 flex gap-1 opacity-0 transition-opacity group-hover/msg:opacity-100">
                      {m.role === "assistant" && !m.streaming && m.id !== "welcome" && (
                        <>
                          <button
                            onClick={() => copyMessage(m.content)}
                            aria-label="Copy message"
                            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <Copy aria-hidden="true" className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => regenerate(m)}
                            disabled={sending}
                            aria-label="Regenerate response"
                            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                          >
                            <RotateCw aria-hidden="true" className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                      {m.role === "user" && (
                        <button
                          onClick={() => startEdit(m)}
                          disabled={sending}
                          aria-label="Edit message"
                          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                        >
                          <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
          {sending && !messages.some((m) => m.streaming) && (
            <div className="flex justify-start" aria-hidden="true">
              <div className="flex items-center gap-1 rounded-2xl border border-border bg-card px-4 py-2.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={sendMessage} className="mt-4 flex gap-2">
          <label htmlFor="chat-input" className="sr-only">
            Message LifeFlow
          </label>
          <Input
            id="chat-input"
            name="message"
            autoComplete="off"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message LifeFlow…"
            className="flex-1 rounded-full! focus-visible:rounded-full!"
          />
          {voiceSupported && (
            <Button
              type="button"
              variant={listening ? "destructive" : "outline"}
              size="icon"
              aria-label={listening ? "Stop voice input" : "Start voice input"}
              aria-pressed={listening}
              onClick={toggleListening}
              className="rounded-full!"
            >
              {listening ? <MicOff aria-hidden="true" className="h-4 w-4" /> : <Mic aria-hidden="true" className="h-4 w-4" />}
            </Button>
          )}
          <Button type="submit" disabled={sending || !input.trim()} aria-label="Send message" className="rounded-full!">
            {sending ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <ArrowUp aria-hidden="true" className="h-4 w-4" />}
          </Button>
        </form>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
