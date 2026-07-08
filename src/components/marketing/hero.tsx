import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { MemoryThread } from "./memory-thread";

const taglines = [
  "Your AI that never forgets.",
  "Meet the assistant that actually learns you.",
  "Persistent memory. Proactive intelligence. Agentic execution.",
];

const trustPoints = ["Free tier, no credit card", "Delete any memory, anytime", "Google or email sign-in"];

export function Hero() {
  return (
    <section className="relative flex flex-col items-center overflow-hidden px-6 pb-16 pt-20 text-center sm:pt-28">
      <MemoryThread className="pointer-events-none absolute inset-x-0 top-24 h-32 w-full sm:top-32" />

      <p className="relative mb-4 text-sm font-medium uppercase tracking-widest text-accent">
        LifeFlow
      </p>
      <h1 className="font-display relative max-w-3xl text-5xl font-medium tracking-tight text-zinc-950 sm:text-6xl dark:text-zinc-50">
        Talk. It&apos;s done.
      </h1>
      <p className="relative mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
        The AI-powered personal operating system that remembers everything, acts
        on what matters, and gets smarter every time you use it.
      </p>

      <div className="relative mt-10 flex flex-col gap-4 sm:flex-row">
        <Link
          href="/signup"
          className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
        >
          Get started free
        </Link>
        <a
          href="#pricing"
          className="rounded-full border border-zinc-200 px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          See pricing
        </a>
      </div>

      <div className="relative mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-zinc-500">
        {trustPoints.map((t) => (
          <span key={t} className="flex items-center gap-1.5">
            <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            {t}
          </span>
        ))}
      </div>

      <div className="relative mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-zinc-400">
        {taglines.map((t) => (
          <span key={t}>&ldquo;{t}&rdquo;</span>
        ))}
      </div>
    </section>
  );
}
