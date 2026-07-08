import { AuthShell } from "@/components/auth-shell";
import { OnboardingWizard } from "@/components/onboarding-wizard";

export default function OnboardingPage() {
  return (
    <AuthShell>
      <OnboardingWizard />
    </AuthShell>
  );
}
