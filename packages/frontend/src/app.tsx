import { useLegalEntity } from "./hooks/use-legal-entity";
import { useAuthContext } from "./lib/auth";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  context: {
    auth: {
      user: null,
      loading: false,
    },
    legalEntity: null,
  },
});

// Register things for typesafety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function App() {
  const auth = useAuthContext();
  const { legalEntity } = useLegalEntity();

  return <RouterProvider router={router} context={{ auth, legalEntity }} />;
}
