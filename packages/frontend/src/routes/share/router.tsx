import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/share/router")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/share/router"!</div>;
}
