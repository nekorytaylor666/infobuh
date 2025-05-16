import { getLegalEntity, getLegalEntityByUserId } from "@/lib/api";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/share")({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    const session = await context.auth.supabase.auth.getSession();

    if (!session.data.session) {
      throw redirect({ to: "/auth/login" });
    }
  },
});

function RouteComponent() {
  return <Outlet />;
}
