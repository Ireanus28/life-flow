import { Brain, Zap, ImagePlus, Network, MessageCircle } from "lucide-react";

const items = [
  { icon: Brain, label: "Persistent semantic memory" },
  { icon: Zap, label: "Proactive intelligence" },
  { icon: ImagePlus, label: "Multi-modal understanding" },
  { icon: Network, label: "Cross-domain context" },
  { icon: MessageCircle, label: "Zero-friction input" },
];

export function Differentiators() {
  return (
    <section className="border-t border-zinc-200 px-6 py-10 dark:border-zinc-800">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-6">
        {items.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <Icon aria-hidden="true" className="h-4 w-4 text-accent" />
            {label}
          </div>
        ))}
      </div>
    </section>
  );
}
