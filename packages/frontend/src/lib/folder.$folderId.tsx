import { DocumentHeader } from "@/components/documents/components/document-header";
import { DocumentTree } from "@/components/documents/components/document-tree";
import { FileInformationSheet } from "@/components/documents/components/file-information-sheet";
import { DocumentBreadcrumb } from "@/components/documents/components/document-breadcrumb";
import {
  useRenameDocument,
  useUploadDocument,
} from "@/components/documents/hooks/use-documents";
import { useDocument } from "@/components/documents/hooks/use-documents";
import { useDocuments } from "@/components/documents/hooks/use-documents";
import { prefetchDocument } from "@/components/documents/utils/document-utils";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { useLegalEntity } from "@/hooks/use-legal-entity";
import { useAuthContext } from "@/lib/auth";
import type { DocumentWithOwnerSignature } from "@backend/db/schema";
import {
  createFileRoute,
  Link,
  useCanGoBack,
  useParams,
  useRouter,
  useSearch,
} from "@tanstack/react-router";
import type { UppyFile } from "@uppy/core";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useDocumentBreadcrumbs } from "@/components/documents/hooks/use-document-breadcrumbs";

export const Route = createFileRoute("/dashboard/documents/folder/$folderId")({
  component: DocumentsPage,
  validateSearch: (search) => {
    return {
      folderName: search.folderName as string,
    };
  },
});

function DocumentsPage() {
  const params = Route.useParams();
  const search = Route.useSearch();
  const router = useRouter();

  const folderId = params.folderId;
  const [selectedFile, setSelectedFile] =
    useState<DocumentWithOwnerSignature | null>(null);
  const [newFileName, setNewFileName] = useState("");
  const { legalEntity } = useLegalEntity();
  const { user } = useAuthContext();

  const {
    data: documents = [],
    isLoading,
    refetch,
  } = useDocuments(legalEntity?.id);

  // If we're viewing a specific folder, fetch its details (for tree display only)
  const { data: currentFolder } = useDocument(
    folderId ? { documentId: folderId, legalEntityId: legalEntity?.id } : null
  );

  // Use search param directly for folder name
  const folderName = search.folderName || "Документы";

  const uploadDocument = useUploadDocument();
  const renameDocument = useRenameDocument();

  // Prefetch documents when they are loaded
  useEffect(() => {
    if (documents.length > 0) {
      // Prefetch first 5 documents immediately
      for (const doc of documents.slice(0, 10)) {
        prefetchDocument(doc);
      }

      // Prefetch the rest with a delay to not overwhelm the network
      if (documents.length > 5) {
        const timer = setTimeout(() => {
          for (const doc of documents.slice(5)) {
            prefetchDocument(doc);
          }
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [documents]);

  // Setup breadcrumb navigation
  const { navigateToParent } = useDocumentBreadcrumbs(currentFolder, documents);

  // Listen for browser back button
  useEffect(() => {
    const handlePopState = () => {
      // The navigation and breadcrumb updates will be handled by
      // the history listener in useDocumentBreadcrumbs
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const handleUploadComplete = async (
    file: UppyFile<Record<string, unknown>, Record<string, unknown>>,
    parentId?: string | null
  ) => {
    if (!legalEntity?.id || !user?.id) return;

    await uploadDocument.mutateAsync({
      file,
      legalEntityId: legalEntity.id,
      ownerId: user.id,
      parentId: parentId || folderId || undefined,
    });
  };

  const handleRenameFile = async () => {
    if (!selectedFile || !newFileName.trim() || !legalEntity?.id) return;

    await renameDocument.mutateAsync({
      documentId: selectedFile.id,
      legalEntityId: legalEntity.id,
      name: newFileName,
    });

    setSelectedFile(null);
    setNewFileName("");
  };

  // If we're viewing a specific folder, fetch all documents but filter display in tree
  return (
    <div className="flex flex-col h-full">
      <DocumentHeader
        title={folderName}
        onUploadComplete={handleUploadComplete}
      />

      {/* Breadcrumbs */}
      <DocumentBreadcrumb />

      {folderId && (
        <div className="px-6 py-2">
          <Button
            onClick={navigateToParent}
            variant="ghost"
            size="sm"
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Назад
          </Button>
        </div>
      )}

      <div className="flex-grow overflow-hidden">
        <div className="h-full p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
            </div>
          ) : (
            <DocumentTree
              documents={documents}
              onSelect={setSelectedFile}
              onUploadComplete={handleUploadComplete}
              currentFolderId={folderId}
            />
          )}
        </div>
      </div>

      {selectedFile && (
        <div className="fixed inset-y-0 right-0 w-[350px] bg-background shadow-lg border-l z-20">
          <FileInformationSheet
            file={selectedFile}
            onClose={() => setSelectedFile(null)}
            onNewNameChange={setNewFileName}
            onRename={handleRenameFile}
            newFileName={newFileName}
            isRenaming={renameDocument.isPending}
          />
        </div>
      )}
    </div>
  );
}
