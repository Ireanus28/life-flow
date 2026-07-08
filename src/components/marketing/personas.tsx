import { Briefcase, Home, HeartPulse, GraduationCap, Rocket } from "lucide-react";

const personas = [
  {
    icon: Briefcase,
    title: "The Driven Professional",
    detail: "Senior PM juggling standups, a roadmap, and a life outside work.",
    quote: "I need to get through today's obligations without dropping anything important.",
  },
  {
    icon: Home,
    title: "The Overwhelmed Parent",
    detail: "Running household logistics like a second job.",
    quote: "Help me coordinate household logistics without them becoming a second job.",
  },
  {
    icon: HeartPulse,
    title: "The Independent Senior",
    detail: "Managing medications and appointments, staying independent.",
    quote: "Help me remember everything I need to do so I can stay independent.",
  },
  {
    icon: GraduationCap,
    title: "The High-Performance Student",
    detail: "Courses, labs, MCAT prep, and a job — all at once.",
    quote: "Help me study smarter and miss fewer obligations.",
  },
  {
    icon: Rocket,
    title: "The Solopreneur",
    detail: "Marketing, sales, and delivery — all one person.",
    quote: "Be the chief of staff I can't afford to hire.",
  },
];

export function Personas() {
  return (
    <section className="border-t border-zinc-200 bg-zinc-50 px-6 py-20 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-medium tracking-tight text-zinc-950 dark:text-zinc-50">
            Built for whoever is running the show
          </h2>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            Different lives, same underlying job: stop being the integration
            layer between a dozen apps that don&apos;t talk to each other.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {personas.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-black"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10">
                <p.icon aria-hidden="true" className="h-4 w-4 text-accent" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-zinc-950 dark:text-zinc-50">{p.title}</h3>
              <p className="mt-1 text-sm text-zinc-500">{p.detail}</p>
              <p className="mt-4 text-sm italic leading-relaxed text-zinc-600 dark:text-zinc-400">
                &ldquo;{p.quote}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
