import { useCallback, useEffect, useRef } from "react";
import {
	useRouter,
	useLocation,
	useParams,
	useSearch,
} from "@tanstack/react-router";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import type { DocumentWithOwnerSignature } from "@backend/db/schema";

export function useDocumentBreadcrumbs(
	currentFolder: DocumentWithOwnerSignature | null | undefined,
	documents: DocumentWithOwnerSignature[],
) {
	const { setBreadcrumbs, breadcrumbs } = useBreadcrumb();
	const router = useRouter();
	const location = useLocation();
	const params = useParams({ strict: false });
	const search = useSearch({ strict: false });
	const prevFolderId = useRef<string | null>(null);
	const prevPathname = useRef<string>(location.pathname);

	// Update breadcrumbs immediately based on URL params
	useEffect(() => {
		const routeFolderId = params.folderId as string | undefined;
		const folderName = (search.folderName as string) || "";

		// If we're on a folder route
		if (routeFolderId && folderName) {
			// Check if we've navigated to a folder that's already in the breadcrumbs
			const existingIndex = breadcrumbs.findIndex(
				(crumb) => crumb.id === routeFolderId,
			);

			if (existingIndex >= 0) {
				// Just trim the breadcrumbs to this point
				setBreadcrumbs(breadcrumbs.slice(0, existingIndex + 1));
			} else if (routeFolderId !== prevFolderId.current) {
				// Add new breadcrumb for this folder
				const newBreadcrumb = {
					id: routeFolderId,
					name: folderName,
					path: "/dashboard/documents/folder/$folderId",
					params: { folderId: routeFolderId },
					search: { folderName },
				};

				// If we have parents, we'll compute the full path
				const parentPath = computeParentPath(routeFolderId, documents);
				setBreadcrumbs([...parentPath, newBreadcrumb]);

				// Update previous folder ID
				prevFolderId.current = routeFolderId;
			}
		} else if (!routeFolderId && prevFolderId.current !== null) {
			// We're at root, clear breadcrumbs
			setBreadcrumbs([]);
			prevFolderId.current = null;
		}
	}, [
		location.pathname,
		params.folderId,
		search.folderName,
		documents,
		breadcrumbs,
		setBreadcrumbs,
	]);

	// Compute parent path for a folder
	const computeParentPath = (
		folderId: string,
		allDocuments: DocumentWithOwnerSignature[],
	) => {
		const breadcrumbItems: any[] = [];
		if (!allDocuments.length) return breadcrumbItems;

		// Create document lookup map
		const documentsMap = new Map<string, DocumentWithOwnerSignature>();
		allDocuments.forEach((doc) => {
			documentsMap.set(doc.id, doc);
		});

		// Find current folder
		const folder = documentsMap.get(folderId);
		if (!folder) return breadcrumbItems;

		// Build parent path
		let current = folder;
		while (current.parentId) {
			const parent = documentsMap.get(current.parentId);
			if (!parent) break;

			breadcrumbItems.unshift({
				id: parent.id,
				name: parent.name,
				path: "/dashboard/documents/folder/$folderId",
				params: { folderId: parent.id },
				search: { folderName: parent.name },
			});

			current = parent;
		}

		return breadcrumbItems;
	};

	// Add a listener for browser history navigation
	useEffect(() => {
		// Check if the pathname has changed and we're moving back through history
		if (location.pathname !== prevPathname.current) {
			// If we navigated to the root documents page
			if (location.pathname === "/dashboard/documents") {
				setBreadcrumbs([]);
			}
		}

		prevPathname.current = location.pathname;
	}, [location.pathname, setBreadcrumbs]);

	// Reset breadcrumbs (useful for direct resets)
	const resetBreadcrumbs = useCallback(() => {
		setBreadcrumbs([]);
		prevFolderId.current = null;
	}, [setBreadcrumbs]);

	// Navigate to parent folder or root - optimized for immediate feedback
	const navigateToParent = useCallback(() => {
		const routeFolderId = params.folderId as string | undefined;
		if (!routeFolderId) return;

		// Get the current breadcrumbs
		if (breadcrumbs.length <= 1) {
			// If there's only one item or none, go to root
			resetBreadcrumbs();
			router.navigate({ to: "/dashboard/documents" });
			return;
		}

		// Find current folder index
		const currentIndex = breadcrumbs.findIndex(
			(crumb) => crumb.id === routeFolderId,
		);
		if (currentIndex <= 0) {
			// If not found or it's the first item, go to root
			resetBreadcrumbs();
			router.navigate({ to: "/dashboard/documents" });
			return;
		}

		// Get parent folder from breadcrumbs
		const parentBreadcrumb = breadcrumbs[currentIndex - 1];

		// Update breadcrumbs immediately
		setBreadcrumbs(breadcrumbs.slice(0, currentIndex));

		// Navigate to parent
		router.navigate({
			to: "/dashboard/documents/folder/$folderId",
			params: { folderId: parentBreadcrumb.id },
			search: { folderName: parentBreadcrumb.name },
		});
	}, [params.folderId, breadcrumbs, resetBreadcrumbs, router, setBreadcrumbs]);

	return {
		navigateToParent,
		resetBreadcrumbs,
	};
}
