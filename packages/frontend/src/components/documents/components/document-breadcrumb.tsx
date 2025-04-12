import React, { useCallback, useEffect, useMemo } from "react";
import {
  Link,
  useRouter,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { useNestedFolderBreadcrumbs } from "../hooks/use-nested-folder-breadcrumbs";

export function DocumentBreadcrumb() {
  const { breadcrumbs, setBreadcrumbs } = useBreadcrumb();
  const router = useRouter();
  const navigate = useNavigate();
  const location = useLocation();

  // Listen for location changes that might be triggered by browser back/forward buttons
  useEffect(() => {
    // If we're on the root documents page, clear breadcrumbs
    if (location.pathname === "/dashboard/documents") {
      setBreadcrumbs([
        {
          id: "root",
          name: "Документы",
          path: "/dashboard/documents",
          params: {},
          search: {},
        },
      ]);
    }
  }, [location.pathname, setBreadcrumbs]);

  // Memoize the click handler to avoid recreating it on every render
  const handleBreadcrumbClick = useCallback(
    (breadcrumb: any, clickIndex: number) => {
      // If we click on a breadcrumb, navigate to it
      navigate({
        to: breadcrumb.path,
        params: breadcrumb.params,
        search: breadcrumb.search,
      });

      // Trim the breadcrumbs to this point
      if (clickIndex < breadcrumbs.length - 1) {
        setBreadcrumbs(breadcrumbs.slice(0, clickIndex + 1));
      }
    },
    [breadcrumbs, setBreadcrumbs, navigate]
  );

  // Memoize the home click handler
  const handleHomeClick = useCallback(() => {
    setBreadcrumbs([
      {
        id: "root",
        name: "Документы",
        path: "/dashboard/documents",
        params: {},
        search: {},
      },
    ]);
    navigate({ to: "/dashboard/documents" });
  }, [navigate, setBreadcrumbs]);

  // Memoize the breadcrumb items to avoid unnecessary re-renders
  const breadcrumbItems = useMemo(() => {
    if (!breadcrumbs.length) {
      return (
        <div className="px-6 pt-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/dashboard/documents">Документы</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      );
    }

    return (
      <div className="px-6 pt-4">
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((breadcrumb, index) => (
              <React.Fragment key={breadcrumb.id}>
                {index > 0 && (
                  <BreadcrumbSeparator>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </BreadcrumbSeparator>
                )}
                <BreadcrumbItem>
                  {index === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage>{breadcrumb.name}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link
                        to={breadcrumb.path}
                        params={breadcrumb.params}
                        search={breadcrumb.search}
                        onClick={() => handleBreadcrumbClick(breadcrumb, index)}
                      >
                        {breadcrumb.name}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    );
  }, [breadcrumbs, handleBreadcrumbClick]);

  return breadcrumbItems;
}
