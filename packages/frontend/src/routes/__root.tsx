import * as React from "react";
import {
  Link,
  Outlet,
  createRootRoute,
  useNavigate,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { authService } from "../services/auth";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const [session, setSession] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();

  React.useEffect(() => {
    // Check current session
    authService.getSession().then((session) => {
      setSession(session);
      setLoading(false);
    });

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = authService.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === "SIGNED_OUT") {
        navigate({ to: "/auth/login" });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await authService.signOut();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="p-4 flex justify-between items-center border-b">
        <div className="flex gap-4 text-lg">
          <Link
            to="/"
            activeProps={{
              className: "font-bold",
            }}
            activeOptions={{ exact: true }}
          >
            Home
          </Link>
          <Link
            to="/about"
            activeProps={{
              className: "font-bold",
            }}
          >
            About
          </Link>
        </div>
        <div>
          {session ? (
            <div className="flex items-center gap-4">
              <span>{session.user.email}</span>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-700"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex gap-4">
              <Link
                to="/auth/login"
                className="text-indigo-600 hover:text-indigo-700"
              >
                Sign in
              </Link>
              <Link
                to="/auth/signup"
                className="text-indigo-600 hover:text-indigo-700"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
      <main className="p-4">
        <Outlet />
      </main>
      <TanStackRouterDevtools position="bottom-right" />
    </>
  );
}
