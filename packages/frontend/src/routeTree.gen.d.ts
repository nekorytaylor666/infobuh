import type { BreadcrumbItem } from "./contexts/BreadcrumbContext";

export interface RouterContext {
	auth: {
		user: unknown;
		loading: boolean;
	};
	legalEntity: unknown;
}
