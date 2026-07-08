import Link from "next/link";
import { Brain } from "lucide-react";

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-black/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display flex items-center gap-2 text-lg font-medium tracking-tight text-zinc-950 dark:text-zinc-50">
          <Brain aria-hidden="true" className="h-5 w-5 text-accent" />
          LifeFlow
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-400 sm:flex">
          <a href="#value" className="hover:text-zinc-950 dark:hover:text-zinc-50">
            Why LifeFlow
          </a>
          <a href="#compare" className="hover:text-zinc-950 dark:hover:text-zinc-50">
            Compare
          </a>
          <a href="#pricing" className="hover:text-zinc-950 dark:hover:text-zinc-50">
            Pricing
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-zinc-600 hover:text-zinc-950 sm:block dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
          >
            Sign up free
          </Link>
        </div>
      </div>
    </header>
  );
}
