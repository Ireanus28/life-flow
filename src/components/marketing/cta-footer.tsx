import Link from "next/link";

export function CtaFooter() {
  return (
    <footer className="border-t border-zinc-200 px-6 py-16 dark:border-zinc-800">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center">
        <h2 className="font-display max-w-xl text-2xl font-medium tracking-tight text-zinc-950 dark:text-zinc-50">
          Stop being the integration layer for your own life.
        </h2>
        <Link
          href="/signup"
          className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
        >
          Get started free
        </Link>
        <p className="mt-8 text-xs text-zinc-400">
          &copy; {new Date().getFullYear()} LifeFlow. Talk. It&apos;s done.
        </p>
      </div>
    </footer>
  );
}
