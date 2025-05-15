import {
  createRootRoute,
  createRootRouteWithContext,
  Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AuthContextType } from "@/lib/auth";
import type { LegalEntity } from "../../../backend/src/db/schema";

export const Route = createRootRouteWithContext<{
  auth: AuthContextType;
  legalEntity: LegalEntity | null;
}>()({
  component: ({ context }) => (
    <>
      <Outlet />
      <Toaster />
    </>
  ),
});
