import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Document, DocumentWithOwnerSignature } from "@backend/db/schema";
import { toast } from "sonner";
import type { UppyFile } from "@uppy/core";

const API_URL = import.meta.env.VITE_API_URL;

// Query key factory
export const documentKeys = {
	all: ["documents"] as const,
	list: (legalEntityId: string) =>
		[...documentKeys.all, legalEntityId] as const,
	detail: (legalEntityId: string, id: string) =>
		[...documentKeys.list(legalEntityId), id] as const,
};

// Fetch documents
export const useDocuments = (legalEntityId?: string) => {
	return useQuery({
		queryKey: documentKeys.list(legalEntityId!),
		queryFn: async () => {
			const response = await fetch(`${API_URL}/documents/${legalEntityId}`);
			if (!response.ok) throw new Error("Failed to fetch documents");
			return response.json() as Promise<DocumentWithOwnerSignature[]>;
		},
		enabled: !!legalEntityId,
	});
};

// Upload document
export const useUploadDocument = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			file,
			legalEntityId,
			ownerId,
			parentId,
		}: {
			file: UppyFile;
			legalEntityId: string;
			ownerId: string;
			parentId?: string;
		}) => {
			const response = await fetch(`${API_URL}/documents/${legalEntityId}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					file: {
						name: file.name,
						size: file.size,
						path: file.uploadURL || file.response?.uploadURL,
					},
					ownerId,
					parentId,
				}),
			});

			if (!response.ok) throw new Error("Failed to create document");
			return response.json();
		},
		onSuccess: (_, { legalEntityId }) => {
			queryClient.invalidateQueries({
				queryKey: documentKeys.list(legalEntityId),
			});
			toast.success("File uploaded successfully");
		},
		onError: () => {
			toast.error("Failed to upload file");
		},
	});
};

// Rename document
export const useRenameDocument = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			documentId,
			legalEntityId,
			name,
		}: {
			documentId: string;
			legalEntityId: string;
			name: string;
		}) => {
			const response = await fetch(
				`${API_URL}/documents/${legalEntityId}/${documentId}`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ name }),
				},
			);

			if (!response.ok) throw new Error("Failed to rename file");
			return response.json();
		},
		onSuccess: (_, { legalEntityId }) => {
			queryClient.invalidateQueries({
				queryKey: documentKeys.list(legalEntityId),
			});
			toast.success("File renamed successfully");
		},
		onError: () => {
			toast.error("Failed to rename file");
		},
	});
};
