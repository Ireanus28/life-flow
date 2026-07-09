"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Briefcase, Users, Heart, GraduationCap, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Mode = "PROFESSIONAL" | "PARENT" | "SENIOR" | "STUDENT" | "SOLOPRENEUR";

const modes: { value: Mode; label: string; icon: typeof Briefcase }[] = [
  { value: "PROFESSIONAL", label: "Driven professional", icon: Briefcase },
  { value: "PARENT", label: "Parent juggling a household", icon: Users },
  { value: "SENIOR", label: "Independent senior", icon: Heart },
  { value: "STUDENT", label: "Student", icon: GraduationCap },
  { value: "SOLOPRENEUR", label: "Solopreneur", icon: Rocket },
];

const steps = ["timezone", "wakeTime", "primaryMode"] as const;

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [timezone, setTimezone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC"
  );
  const [wakeTime, setWakeTime] = useState("07:00");
  const [primaryMode, setPrimaryMode] = useState<Mode>("PROFESSIONAL");
  const [saving, setSaving] = useState(false);

  const timezones = useMemo(() => {
    try {
      return Intl.supportedValuesOf("timeZone");
    } catch {
      return [timezone];
    }
  }, [timezone]);

  const isLastStep = step === steps.length - 1;

  async function finish() {
    setSaving(true);
    const res = await fetch("/api/settings/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timezone, wakeTime, primaryMode }),
    });
    setSaving(false);
    if (res.ok) router.push("/dashboard");
  }

  return (
    <div className="w-full max-w-sm">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Step {step + 1} of {steps.length}
      </p>
      <div className="mt-2 mb-8 flex gap-1.5">
        {steps.map((s, i) => (
          <div key={s} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-accent" : "bg-border"}`} />
        ))}
      </div>

      {step === 0 && (
        <div>
          <h1 className="font-display text-xl font-medium text-foreground">What&apos;s your timezone?</h1>
          <p className="mt-1 text-sm text-muted-foreground">So reminders land at the right local time.</p>
          <Select value={timezone} onValueChange={(value) => value && setTimezone(value)}>
            <SelectTrigger className="mt-6 w-full" aria-label="Timezone">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {timezones.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {step === 1 && (
        <div>
          <h1 className="font-display text-xl font-medium text-foreground">When do you usually wake up?</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your morning digest will arrive around this time.</p>
          <Input
            type="time"
            value={wakeTime}
            onChange={(e) => setWakeTime(e.target.value)}
            className="mt-6"
            aria-label="Wake time"
          />
        </div>
      )}

      {step === 2 && (
        <div>
          <h1 className="font-display text-xl font-medium text-foreground">What best describes you?</h1>
          <p className="mt-1 text-sm text-muted-foreground">We&apos;ll tune LifeFlow&apos;s tone and suggestions.</p>
          <div className="mt-6 flex flex-col gap-2">
            {modes.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setPrimaryMode(m.value)}
                aria-pressed={primaryMode === m.value}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  primaryMode === m.value
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border bg-card text-foreground hover:bg-muted"
                }`}
              >
                <m.icon aria-hidden="true" className="h-4 w-4" />
                {m.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back
        </Button>
        {isLastStep ? (
          <Button type="button" disabled={saving} onClick={finish}>
            Finish
          </Button>
        ) : (
          <Button type="button" onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}>
            Next
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
