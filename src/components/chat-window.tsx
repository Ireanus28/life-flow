"use client";

import { useState, useRef, useEffect, useCallback, useSyncExternalStore } from "react";
import { Send, Loader2, Mic, MicOff, SquarePen, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type ChatEntry = { role: "user" | "assistant"; content: string };
type ConversationSummary = { id: string; title: string; updatedAt: string };

// Minimal shape of the Web Speech API's SpeechRecognition — not in lib.dom.d.ts.
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

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

const WELCOME_MESSAGE: ChatEntry = {
  role: "assistant",
  content: "Ask me anything! I can help you with tasks, reminders, and more. Just type your message below and hit send.",
};

function toEntries(history: { role: string; content: string }[]): ChatEntry[] {
  return history.map((m) => ({
    role: m.role.toLowerCase() === "user" ? "user" : "assistant",
    content: m.content,
  }));
}

export function ChatWindow() {
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const voiceSupported = useSyncExternalStore(noopSubscribe, () => !!getSpeechRecognitionCtor(), () => false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = useCallback(async (): Promise<ConversationSummary[] | null> => {
    const res = await fetch("/api/chat");
    if (res.status === 401) {
      redirectToLogout();
      return null;
    }
    const { conversations: list } = await res.json();
    return list ?? [];
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

        const messagesRes = await fetch(`/api/chat?conversationId=${latest.id}`);
        const { messages: history } = await messagesRes.json();
        if (history?.length) {
          setConversationId(latest.id);
          setMessages(toEntries(history));
        } else {
          setMessages([WELCOME_MESSAGE]);
        }
      } catch {
        setMessages([WELCOME_MESSAGE]);
      } finally {
        setHistoryLoaded(true);
      }
    })();
  }, [fetchConversations]);

  function startNewChat() {
    setConversationId(undefined);
    setMessages([WELCOME_MESSAGE]);
  }

  async function openConversation(id: string) {
    setHistoryLoaded(false);
    const res = await fetch(`/api/chat?conversationId=${id}`);
    if (res.status === 401) {
      redirectToLogout();
      return;
    }
    const { messages: history } = await res.json();
    setConversationId(id);
    setMessages(history?.length ? toEntries(history) : [WELCOME_MESSAGE]);
    setHistoryLoaded(true);
  }

  async function onHistoryOpenChange(open: boolean) {
    if (!open) return;
    const list = await fetchConversations();
    if (list) setConversations(list);
  }

  const toggleListening = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop();
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
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversationId }),
      });

      if (res.status === 401) {
        redirectToLogout();
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send message");

      setConversationId(data.conversationId);
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong sending that. Try again." },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col px-6 py-8">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h1 className="font-display text-lg font-medium text-foreground">Chat</h1>
        <div className="flex items-center gap-1.5">
          <DropdownMenu onOpenChange={onHistoryOpenChange}>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Chat history">
                  <History aria-hidden="true" className="h-4 w-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Recent conversations</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {conversations.length === 0 ? (
                <p className="px-2 py-1.5 text-xs text-muted-foreground">No conversations yet.</p>
              ) : (
                conversations.map((c) => (
                  <DropdownMenuItem
                    key={c.id}
                    onClick={() => openConversation(c.id)}
                    className={c.id === conversationId ? "bg-muted" : ""}
                  >
                    <span className="truncate">{c.title || "Untitled conversation"}</span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon-sm" aria-label="New chat" onClick={startNewChat}>
            <SquarePen aria-hidden="true" className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div role="log" aria-live="polite" aria-label="Conversation" className="flex-1 space-y-4 overflow-y-auto">
        {!historyLoaded && (
          <div className="flex justify-start" aria-hidden="true">
            <div className="flex items-center gap-1 rounded-2xl border border-border bg-card px-4 py-2.5">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] min-w-0 wrap-break-word rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user"
                  ? "bg-accent text-accent-foreground"
                  : "border border-border bg-card text-card-foreground"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
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
          className="flex-1 rounded-full"
        />
        {voiceSupported && (
          <Button
            type="button"
            variant={listening ? "destructive" : "outline"}
            size="icon"
            aria-label={listening ? "Stop voice input" : "Start voice input"}
            aria-pressed={listening}
            onClick={toggleListening}
            className="rounded-full"
          >
            {listening ? <MicOff aria-hidden="true" className="h-4 w-4" /> : <Mic aria-hidden="true" className="h-4 w-4" />}
          </Button>
        )}
        <Button type="submit" disabled={sending || !input.trim()} aria-label="Send message" className="rounded-full">
          {sending ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Send aria-hidden="true" className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
