const layers = [
  {
    level: "Functional",
    body: "A single AI-powered interface that manages your tasks, reminders, schedule, and personal knowledge — and gets smarter about you every day.",
  },
  {
    level: "Emotional",
    body: "The calm confidence that nothing important will fall through the cracks, because something is always watching out for you.",
  },
  {
    level: "Social",
    body: "Be the person who always remembers, always delivers, and always seems to have mental bandwidth to spare.",
  },
  {
    level: "Life-Change",
    body: "The hours you get back from managing your systems compound into meaningful things: more creative work, more presence with family, more rest, more ambition.",
  },
];

export function ValueProps() {
  return (
    <section id="value" className="border-t border-zinc-200 px-6 py-20 dark:border-zinc-800">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-medium tracking-tight text-zinc-950 dark:text-zinc-50">
            Why LifeFlow, not another assistant
          </h2>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            Virtual assistants have existed since 2011. In 15 years they haven&apos;t
            solved fragmentation because they&apos;re stateless, reactive, and
            silo-bound. LifeFlow is built to be the opposite of all three.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {layers.map((l, i) => (
            <div
              key={l.level}
              className="rounded-2xl border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
            >
              <span className="font-mono text-xs font-medium text-accent">Level 0{i + 1}</span>
              <h3 className="mt-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                {l.level} value
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {l.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
