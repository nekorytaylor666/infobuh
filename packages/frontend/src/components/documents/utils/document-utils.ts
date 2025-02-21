import type { Document } from "@backend/db/schema";
import { documentCache } from "./document-cache";

export const signDocument = async (
	documentId: string,
	legalEntityId: string,
	signerId: string,
	credentials: { key: string; password: string },
) => {
	try {
		// Send sign request to backend
		const saveResponse = await fetch(
			`${
				import.meta.env.VITE_API_URL
			}/documents/${legalEntityId}/${documentId}/sign`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					signerId,
					key: credentials.key,
					password: credentials.password,
				}),
			},
		);

		if (!saveResponse.ok) throw new Error("Failed to sign document");
		return await saveResponse.json();
	} catch (error) {
		console.error("Error signing document:", error);
		throw error;
	}
};

export const prefetchDocument = async (file: Document) => {
	if (!file.name) return;

	const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);
	const isPDF = /\.pdf$/i.test(file.name);

	if (isImage || isPDF) {
		const url = `${
			import.meta.env.VITE_SUPABASE_URL
		}/storage/v1/object/public/documents/${file.name}`;

		// If already cached, skip
		if (documentCache.has(url)) return;

		try {
			const response = await fetch(url, {
				method: "GET",
				cache: "force-cache",
				headers: {
					"Cache-Control": "max-age=3600",
				},
			});

			if (!response.ok) throw new Error("Failed to fetch");

			// For images, we can create an object URL to cache in memory
			if (isImage) {
				const blob = await response.blob();
				const objectUrl = URL.createObjectURL(blob);
				documentCache.set(url, objectUrl);
			} else {
				// For PDFs, just prime the browser cache
				documentCache.set(url, url);
			}
		} catch (error) {
			console.error(`Failed to prefetch ${file.name}:`, error);
		}
	}
};
