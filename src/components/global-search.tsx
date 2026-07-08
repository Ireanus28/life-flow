"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { ListTodo, Brain, MessageCircle } from "lucide-react";

type Results = {
  tasks: { id: string; title: string }[];
  memories: { id: string; content: string }[];
  messages: { id: string; content: string; conversationId: string }[];
};

const empty: Results = { tasks: [], memories: [], messages: [] };

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results>(empty);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!query.trim()) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then(setResults)
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  function go(path: string) {
    setOpen(false);
    setQuery("");
    router.push(path);
  }

  // Once the query is cleared, ignore any still-in-flight/stale results
  // rather than storing an extra "cleared" state transition.
  const shown = query.trim() ? results : empty;
  const hasResults = shown.tasks.length || shown.memories.length || shown.messages.length;

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Search LifeFlow" description="Search tasks, memories, and conversations">
      <CommandInput placeholder="Search tasks, memories, conversations… (⌘K)" value={query} onValueChange={setQuery} />
      <CommandList>
        {!hasResults && <CommandEmpty>{query ? "No results." : "Type to search."}</CommandEmpty>}
        {shown.tasks.length > 0 && (
          <CommandGroup heading="Tasks">
            {shown.tasks.map((t) => (
              <CommandItem key={t.id} onSelect={() => go("/tasks")}>
                <ListTodo aria-hidden="true" />
                {t.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {shown.memories.length > 0 && (
          <CommandGroup heading="Memories">
            {shown.memories.map((m) => (
              <CommandItem key={m.id} onSelect={() => go("/memory")}>
                <Brain aria-hidden="true" />
                {m.content}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {shown.messages.length > 0 && (
          <CommandGroup heading="Conversations">
            {shown.messages.map((m) => (
              <CommandItem key={m.id} onSelect={() => go("/chat")}>
                <MessageCircle aria-hidden="true" />
                {m.content}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
