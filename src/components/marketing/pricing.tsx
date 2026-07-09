import Link from "next/link";
import { pricingTiers as tiers } from "@/lib/pricing-tiers";

export function Pricing() {
  return (
    <section id="pricing" className="border-t border-zinc-200 bg-zinc-50 px-6 py-20 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-medium tracking-tight text-zinc-950 dark:text-zinc-50">
            Simple pricing, real free tier
          </h2>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            Start free. Upgrade when unlimited memory and messages matter more
            than $9/month. Need SSO or custom deployment? We do Enterprise too —{" "}
            <a href="mailto:hello@lifeflow.app" className="underline">
              get in touch
            </a>
            .
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`flex flex-col rounded-2xl border p-6 ${
                tier.highlight
                  ? "border-accent bg-white shadow-sm dark:bg-black"
                  : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black"
              }`}
            >
              {tier.highlight && (
                <span className="mb-3 inline-block w-fit rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                  Most popular
                </span>
              )}
              <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">{tier.name}</h3>
              <p className="mt-2">
                <span className="font-display text-3xl font-medium tabular-nums text-zinc-950 dark:text-zinc-50">
                  {tier.price}
                </span>
                <span className="text-sm text-zinc-500"> {tier.period}</span>
              </p>
              <ul className="mt-6 flex flex-1 flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span aria-hidden="true" className="text-emerald-600 dark:text-emerald-400">
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`mt-6 rounded-full px-4 py-2.5 text-center text-sm font-medium transition-colors ${
                  tier.highlight
                    ? "bg-accent text-accent-foreground hover:bg-accent/90"
                    : "border border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
                }`}
              >
                {tier.name === "Free" ? "Start free" : `Get ${tier.name}`}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
