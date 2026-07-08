import { redirect } from "next/navigation";
import { getSessionToken } from "@/lib/session";
import { MarketingNav } from "@/components/marketing/nav";
import { Hero } from "@/components/marketing/hero";
import { Differentiators } from "@/components/marketing/differentiators";
import { ValueProps } from "@/components/marketing/value-props";
import { Personas } from "@/components/marketing/personas";
import { ComparisonTable } from "@/components/marketing/comparison-table";
import { Pricing } from "@/components/marketing/pricing";
import { CtaFooter } from "@/components/marketing/cta-footer";

export default async function Home() {
  const token = await getSessionToken();
  if (token) redirect("/dashboard");

  return (
    <div className="flex flex-1 flex-col bg-white dark:bg-black">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-accent-foreground"
      >
        Skip to main content
      </a>
      <MarketingNav />
      <main id="main-content">
        <Hero />
        <Differentiators />
        <ValueProps />
        <Personas />
        <ComparisonTable />
        <Pricing />
      </main>
      <CtaFooter />
    </div>
  );
}
