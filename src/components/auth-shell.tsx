import Link from "next/link";
import { Brain, CheckCircle2 } from "lucide-react";
import { MemoryThread } from "@/components/marketing/memory-thread";

const highlights = [
  "Persistent memory that gets smarter every day",
  "Natural language — no forms, no databases",
  "Free tier, no credit card required",
];

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-ink p-12 text-white lg:flex">
        <MemoryThread className="pointer-events-none absolute inset-x-0 top-1/3 h-40 w-full" />

        <Link href="/" className="font-display relative z-10 flex items-center gap-2 text-lg font-medium">
          <Brain aria-hidden="true" className="h-6 w-6 text-accent" />
          LifeFlow
        </Link>

        <div className="relative z-10 max-w-md">
          <p className="font-display text-3xl font-medium leading-tight tracking-tight">
            Talk. It&apos;s done.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400">
            The AI-powered personal operating system that remembers everything,
            acts on what matters, and gets smarter every time you use it.
          </p>
          <ul className="mt-8 flex flex-col gap-3">
            {highlights.map((h) => (
              <li key={h} className="flex items-start gap-2 text-sm text-zinc-300">
                <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                {h}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-zinc-500">
          &copy; {new Date().getFullYear()} LifeFlow
        </p>
      </div>

      <div className="flex w-full flex-col items-center justify-center bg-zinc-50 px-6 py-16 lg:w-1/2 dark:bg-black">
        {children}
      </div>
    </div>
  );
}
