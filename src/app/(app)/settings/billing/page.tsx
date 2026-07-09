import { redirect } from "next/navigation";
import { backendFetch } from "@/lib/backend";
import { pricingTiers } from "@/lib/pricing-tiers";

export default async function BillingSettingsPage() {
  const res = await backendFetch("/api/auth/me");
  if (res.status === 401) redirect("/api/auth/logout");
  const { user }: { user: { tier: string } } = await res.json();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 sm:px-8">
      <h1 className="font-display text-2xl font-medium text-foreground">Plan &amp; billing</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        You&apos;re currently on the <span className="font-medium text-foreground">{pricingTiers.find((t) => t.dbTier === user.tier)?.name ?? "Free"}</span> plan.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {pricingTiers.map((tier) => {
          const isCurrent = tier.dbTier === user.tier;
          return (
            <div
              key={tier.name}
              className={`flex flex-col rounded-2xl border p-6 ${
                isCurrent ? "border-accent bg-card shadow-sm" : tier.highlight ? "border-accent bg-card" : "border-border bg-card"
              }`}
            >
              {isCurrent ? (
                <span className="mb-3 inline-block w-fit rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                  Your plan
                </span>
              ) : (
                tier.highlight && (
                  <span className="mb-3 inline-block w-fit rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                    Most popular
                  </span>
                )
              )}
              <h3 className="text-sm font-semibold text-foreground">{tier.name}</h3>
              <p className="mt-2">
                <span className="font-display text-3xl font-medium tabular-nums text-foreground">{tier.price}</span>
                <span className="text-sm text-muted-foreground"> {tier.period}</span>
              </p>
              <ul className="mt-6 flex flex-1 flex-col gap-2 text-sm text-muted-foreground">
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span aria-hidden="true" className="text-accent">
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <span className="mt-6 rounded-full border border-border px-4 py-2.5 text-center text-sm font-medium text-muted-foreground">
                  Current plan
                </span>
              ) : (
                <a
                  href={`mailto:hello@lifeflow.app?subject=${encodeURIComponent(`Upgrade to ${tier.name}`)}`}
                  className={`mt-6 rounded-full px-4 py-2.5 text-center text-sm font-medium transition-colors ${
                    tier.highlight
                      ? "bg-accent text-accent-foreground hover:bg-accent/90"
                      : "border border-border text-foreground hover:bg-muted"
                  }`}
                >
                  Upgrade to {tier.name}
                </a>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Self-serve checkout isn&apos;t live yet — upgrade requests go straight to us and we&apos;ll get your account
        switched over.
      </p>
    </div>
  );
}
