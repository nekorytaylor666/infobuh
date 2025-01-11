import { getOnboardingStatus } from "@/lib/api";
import { authService } from "@/services/auth";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/")({
  component: RouteComponent,
  beforeLoad: async () => {
    const session = await authService.getSession();
    if (!session) {
      throw redirect({ to: "/auth/login" });
    }

    const onboardingStatus = await getOnboardingStatus(session.user.id);
    if (!onboardingStatus) {
      throw redirect({
        to: "/onboarding",
        search: { userId: session.user.id },
      });
    }
  },
});

function RouteComponent() {
  return <div>Hello "/dashboard/"!</div>;
}
