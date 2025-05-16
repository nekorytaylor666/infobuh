import { createFileRoute } from "@tanstack/react-router";
import { OnboardingRoute } from "../components/onboarding/OnboardingRoute";
import { getOnboardingStatus } from "@/lib/api";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingRoute,
  validateSearch: (search) => {
    return {
      userId: search.userId as string,
      returnTo: search.returnTo as string,
    };
  },
  loaderDeps: ({ search: { userId, returnTo } }) => ({ userId, returnTo }),
  loader: async ({ deps: { userId, returnTo } }) => {
    return { status: "" };
  },
});
