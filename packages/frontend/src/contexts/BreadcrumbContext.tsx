import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export type BreadcrumbItem = {
  id: string;
  name: string;
  path: string;
  params?: Record<string, string>;
  search?: Record<string, string>;
};

interface BreadcrumbContextType {
  breadcrumbs: BreadcrumbItem[];
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  addBreadcrumb: (breadcrumb: BreadcrumbItem) => void;
  clearBreadcrumbs: () => void;
  popBreadcrumb: () => void;
  getCurrentBreadcrumb: () => BreadcrumbItem | undefined;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(
  undefined
);

type BreadcrumbProviderProps = {
  children: ReactNode | ((context: BreadcrumbContextType) => ReactNode);
};

export function BreadcrumbProvider({ children }: BreadcrumbProviderProps) {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  const addBreadcrumb = useCallback((breadcrumb: BreadcrumbItem) => {
    setBreadcrumbs((prev) => {
      // Check if this breadcrumb already exists
      const exists = prev.some((item) => item.id === breadcrumb.id);
      if (exists) {
        // Replace existing breadcrumb (keeping the path but updating the rest)
        return prev.map((item) =>
          item.id === breadcrumb.id ? { ...item, ...breadcrumb } : item
        );
      }
      return [...prev, breadcrumb];
    });
  }, []);

  const clearBreadcrumbs = useCallback(() => {
    setBreadcrumbs([]);
  }, []);

  const popBreadcrumb = useCallback(() => {
    setBreadcrumbs((prev) => prev.slice(0, -1));
  }, []);

  const getCurrentBreadcrumb = useCallback(() => {
    return breadcrumbs.length > 0
      ? breadcrumbs[breadcrumbs.length - 1]
      : undefined;
  }, [breadcrumbs]);

  const contextValue: BreadcrumbContextType = {
    breadcrumbs,
    setBreadcrumbs,
    addBreadcrumb,
    clearBreadcrumbs,
    popBreadcrumb,
    getCurrentBreadcrumb,
  };

  return (
    <BreadcrumbContext.Provider value={contextValue}>
      {typeof children === "function" ? children(contextValue) : children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext);
  if (context === undefined) {
    throw new Error("useBreadcrumb must be used within a BreadcrumbProvider");
  }
  return context;
}
