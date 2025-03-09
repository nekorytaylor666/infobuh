import { useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import type { DocumentWithOwnerSignature } from "@backend/db/schema";

/**
 * Hook for handling nested folder breadcrumbs with URLs like:
 * /folders/folderid1/folderid2/folderid3
 */
export function useNestedFolderBreadcrumbs(
	folderIds: string[],
	folderNames: string[],
	documents: DocumentWithOwnerSignature[],
) {
	const { setBreadcrumbs, breadcrumbs } = useBreadcrumb();
	const router = useRouter();
	const navigate = useNavigate();
	const prevFolderIdsRef = useRef<string[]>([]);

	// Create a documents map for faster lookups - memoized to prevent recreation on every render
	const documentsMap = useMemo(() => {
		const map = new Map<string, DocumentWithOwnerSignature>();
		for (const doc of documents) {
			map.set(doc.id, doc);
		}
		return map;
	}, [documents]);

	// Update breadcrumbs based on the URL path segments
	useEffect(() => {
		// Skip if the folder IDs haven't changed
		if (
			prevFolderIdsRef.current.length === folderIds.length &&
			prevFolderIdsRef.current.every((id, i) => id === folderIds[i])
		) {
			return;
		}

		// Update ref
		prevFolderIdsRef.current = [...folderIds];

		if (!folderIds.length) {
			// If at root, set Home breadcrumb
			setBreadcrumbs([
				{
					id: "root",
					name: "Документы",
					path: "/dashboard/documents",
					params: {},
					search: {},
				},
			]);
			return;
		}

		// Home breadcrumb
		const breadcrumbItems = [
			{
				id: "root",
				name: "Документы",
				path: "/dashboard/documents",
				params: {},
				search: {},
			},
		];

		// Generate breadcrumbs based on URL path
		for (let index = 0; index < folderIds.length; index++) {
			const id = folderIds[index];
			const name =
				index < folderNames.length
					? folderNames[index]
					: documentsMap.get(id)?.name || id;

			const path = folderIds.slice(0, index + 1).join("/");
			const names = folderNames.slice(0, index + 1).join(",");

			breadcrumbItems.push({
				id,
				name,
				path: "/dashboard/documents/folders/$folderPath",
				params: { folderPath: path },
				search: { folderNames: names },
			});
		}

		setBreadcrumbs(breadcrumbItems);
	}, [folderIds, folderNames, setBreadcrumbs, documentsMap]);

	// Navigate to parent folder
	const navigateToParent = useCallback(() => {
		if (folderIds.length <= 1) {
			// If at the first level, go to root documents page
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
			return;
		}

		// Otherwise, go up one level in the folder structure
		const parentFolderIds = folderIds.slice(0, -1);
		const parentFolderNames = folderNames.slice(0, -1);

		const path = parentFolderIds.join("/");
		const names = parentFolderNames.join(",");

		// Navigate to parent folder path
		navigate({
			to: "/dashboard/documents/folders/$folderPath",
			params: { folderPath: path },
			search: { folderNames: names },
		});
	}, [folderIds, folderNames, navigate, setBreadcrumbs]);

	// Get full folder path for a specific folder ID
	const getFolderPath = useCallback(
		(folderId: string) => {
			// Build the path from folder tree
			const path: string[] = [];
			const names: string[] = [];

			const currentId = folderId;
			let currentDoc = documentsMap.get(currentId);

			// Start with current folder
			if (currentDoc) {
				path.unshift(currentId);
				names.unshift(currentDoc.name);

				// Then add all parents
				while (currentDoc?.parentId) {
					const parentDoc = documentsMap.get(currentDoc.parentId);
					if (!parentDoc) break;

					path.unshift(parentDoc.id);
					names.unshift(parentDoc.name);
					currentDoc = parentDoc;
				}
			}

			return {
				path: path.join("/"),
				names: names.join(","),
			};
		},
		[documentsMap],
	);

	return {
		navigateToParent,
		getFolderPath,
	};
}
