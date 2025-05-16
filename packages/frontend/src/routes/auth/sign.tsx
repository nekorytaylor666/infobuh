import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/sign")({
  component: SignPage,
});

function SignPage() {
  return <div>SignPage</div>;
}
