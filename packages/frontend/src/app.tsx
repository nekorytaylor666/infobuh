import { useLegalEntity } from "./hooks/use-legal-entity";
import { useAuthContext } from "./lib/auth";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// Define router context type without breadcrumb
type RouterContextType = {
  auth: {
    user: unknown;
    loading: boolean;
  };
  legalEntity: unknown;
};

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  context: {
    auth: {
      user: null,
      loading: false,
    },
    legalEntity: null,
  } as Partial<RouterContextType>,
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

  return (
    <RouterProvider
      router={router}
      context={{
        auth,
        legalEntity,
      }}
    />
  );
}
