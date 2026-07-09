export const tierLabels: Record<string, string> = {
  FREE: "Free",
  PERSONAL: "Personal",
  FAMILY: "Family",
  PROFESSIONAL: "Professional",
  ENTERPRISE: "Enterprise",
};

export type PricingTier = {
  name: string;
  dbTier: "FREE" | "PERSONAL" | "FAMILY" | "PROFESSIONAL";
  price: string;
  period: string;
  highlight: boolean;
  features: string[];
};

export const pricingTiers: PricingTier[] = [
  {
    name: "Free",
    dbTier: "FREE",
    price: "$0",
    period: "forever",
    highlight: false,
    features: [
      "50 AI messages / month",
      "Up to 100 tasks",
      "Up to 10 reminders",
      "3 image analyses / month",
      "Basic memory (50 slots)",
      "In-app notifications",
      "1 active integration",
    ],
  },
  {
    name: "Personal",
    dbTier: "PERSONAL",
    price: "$9",
    period: "/month",
    highlight: true,
    features: [
      "Unlimited AI messages",
      "Unlimited tasks & reminders",
      "Unlimited image analyses",
      "Full memory + semantic search",
      "Email + SMS notifications",
      "5 active integrations",
      "Google Calendar sync",
      "Daily morning digest",
    ],
  },
  {
    name: "Family",
    dbTier: "FAMILY",
    price: "$19",
    period: "/month",
    highlight: false,
    features: [
      "Everything in Personal",
      "Up to 5 family members",
      "Shared task lists & reminders",
      "Family calendar view",
      "Collaborative memory spaces",
      "Child-appropriate mode",
    ],
  },
  {
    name: "Professional",
    dbTier: "PROFESSIONAL",
    price: "$29",
    period: "/month",
    highlight: false,
    features: [
      "Everything in Family",
      "CRM-light client tracking",
      "Document ingestion (PDF/DOCX)",
      "Custom AI instructions",
      "API access (100K calls/mo)",
      "Advanced analytics",
    ],
  },
];
