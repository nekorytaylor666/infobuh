import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useLegalEntity } from "@/hooks/use-legal-entity";
import { useAuthContext } from "@/lib/auth";
import type { DocumentWithOwnerSignature } from "@backend/db/schema";
import { DocumentHeader } from "./components/document-header";
import { DocumentTree } from "./components/document-tree";
import { FileInformationSheet } from "./components/file-information-sheet";
import { documentCache } from "./utils/document-cache";
import { prefetchDocument } from "./utils/document-utils";
import {
  useDocuments,
  useRenameDocument,
  useUploadDocument,
} from "./hooks/use-documents";
import type { UppyFile } from "@uppy/core";

export const Route = createFileRoute("/dashboard/documents/")({
  component: DocumentsPage,
});

export default function DocumentsPage() {
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

  const handleUploadComplete = async (
    file: UppyFile<Record<string, unknown>, Record<string, unknown>>,
    parentId?: string | null
  ) => {
    if (!legalEntity?.id || !user?.id) return;

    await uploadDocument.mutateAsync({
      file,
      legalEntityId: legalEntity.id,
      ownerId: user.id,
      parentId: parentId || undefined,
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
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <DocumentHeader
        legalEntityId={legalEntity?.id}
        userId={user?.id}
        onUploadComplete={refetch}
      />

      <div className="mb-4 flex justify-between items-center mt-6">
        <div className="grid grid-cols-[2fr,1fr,1fr,100px,80px] gap-4 px-4 text-sm font-medium text-muted-foreground w-full">
          <div>Имя</div>
          <div>Владелец</div>
          <div>Последнее изменение</div>
          <div>Подписи</div>
          <div />
        </div>
      </div>

      <div className="rounded-lg border bg-card min-h-[500px] pl-4">
        {documents.length === 0 ? (
          <div className="flex justify-center items-center h-32 text-muted-foreground">
            Документы не найдены
          </div>
        ) : (
          <DocumentTree
            documents={documents}
            onSelect={(file) => {
              setSelectedFile(file);
              if (file) {
                setNewFileName(file.name);
                // Prefetch the selected document immediately
                prefetchDocument(file);
              }
            }}
            onUploadComplete={handleUploadComplete}
          />
        )}
      </div>

      <FileInformationSheet
        file={selectedFile}
        newFileName={newFileName}
        onFileNameChange={setNewFileName}
        onRename={handleRenameFile}
        onClose={() => setSelectedFile(null)}
      />
    </div>
  );
}
