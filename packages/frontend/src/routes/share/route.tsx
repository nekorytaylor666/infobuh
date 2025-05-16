import { getLegalEntity, getLegalEntityByUserId } from "@/lib/api";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/share")({
  component: RouteComponent,
  beforeLoad: async ({ context, location }) => {
    const session = await context.auth.supabase.auth.getSession();
    console.log("session", !session.data.session);

    if (!session.data.session) {
      throw redirect({
        to: "/auth/login",
        search: { returnTo: location.pathname },
      });
    }
    const legalEntity = await getLegalEntityByUserId(
      session.data.session?.user.id
    );
    console.log("legalEntity", legalEntity, session.data.session);

    if (legalEntity.length === 0) {
      throw redirect({
        to: "/onboarding",
        search: {
          userId: session.data.session?.user.id,
          returnTo: location.pathname,
        },
      });
    }
  },
});

function RouteComponent() {
  return <Outlet />;
}
