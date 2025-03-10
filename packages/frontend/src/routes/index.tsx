import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="p-2">
      <h3>Привет мир!</h3>
      <Button variant="default">Click me</Button>
    </div>
  );
}
