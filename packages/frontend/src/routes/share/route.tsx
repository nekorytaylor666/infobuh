import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/share")({
  component: RouteComponent,
  // No authentication required - public share routes
});

function RouteComponent() {
  return <Outlet />;
}
