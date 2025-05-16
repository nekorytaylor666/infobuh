import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/share/router")({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    if (!context.auth.user && !context.auth.loading) {
      throw redirect({ to: "/auth/sign" });
    }
  },
});

function RouteComponent() {
  return <div>Hello "/share/router"!</div>;
}
