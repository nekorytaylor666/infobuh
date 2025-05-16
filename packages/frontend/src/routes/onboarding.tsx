import { createFileRoute } from "@tanstack/react-router";
import { OnboardingRoute } from "../components/onboarding/OnboardingRoute";
import { getOnboardingStatus } from "@/lib/api";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingRoute,
  validateSearch: (search) => {
    return { userId: search.userId as string };
  },
  loaderDeps: ({ search: { userId } }) => ({ userId }),
  loader: async ({ deps: { userId } }) => {
    return { status: "" };
  },
});
