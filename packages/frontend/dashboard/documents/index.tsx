// import {
//   createFileRoute,
//   useCanGoBack,
//   useRouter,
// } from "@tanstack/react-router";
// import React, { useState, useEffect, useMemo, useCallback } from "react";
// import { useLegalEntity } from "@/hooks/use-legal-entity";
// import { useAuthContext } from "@/lib/auth";
// import type { DocumentWithOwnerSignature } from "@backend/db/schema";
// import { DocumentHeader } from "@/components/documents/components/document-header";
// import { DocumentTree } from "@/components/documents/components/document-tree";
// import { FileInformationSheet } from "@/components/documents/components/file-information-sheet";
// import { documentCache } from "@/components/documents/utils/document-cache";
// import { prefetchDocument } from "@/components/documents/utils/document-utils";
// import {
//   useDocuments,
//   useRenameDocument,
//   useUploadDocument,
//   useDocument,
// } from "@/components/documents/hooks/use-documents";
// import type { UppyFile } from "@uppy/core";
// import { Link } from "@tanstack/react-router";
// import { Button } from "@/components/ui/button";
// import { ChevronLeft, ChevronRight, Folder } from "lucide-react";
// import {
//   Breadcrumb,
//   BreadcrumbList,
//   BreadcrumbItem,
//   BreadcrumbLink,
//   BreadcrumbSeparator,
//   BreadcrumbPage,
// } from "@/components/ui/breadcrumb";
// import { DocumentBreadcrumb } from "@/components/documents/components/document-breadcrumb";
// import { useDocumentBreadcrumbs } from "@/components/documents/hooks/use-document-breadcrumbs";
// import { useNestedFolderBreadcrumbs } from "@/components/documents/hooks/use-nested-folder-breadcrumbs";
// import { useNavigate } from "@tanstack/react-router";
// import { Skeleton } from "@/components/ui/skeleton";

// export const Route = createFileRoute("/dashboard/documents/")({
//   component: DocumentsPage,
// });

// function DocumentsPage() {
//   const params = Route.useParams();

//   const [selectedFile, setSelectedFile] =
//     useState<DocumentWithOwnerSignature | null>(null);
//   const [newFileName, setNewFileName] = useState("");
//   const { legalEntity } = useLegalEntity();
//   const { user } = useAuthContext();

//   const {
//     data: documents = [],
//     isLoading,
//     refetch,
//     isFetched,
//   } = useDocuments(legalEntity?.id);

//   const { data: currentFolder } = useDocument(null);

//   const uploadDocument = useUploadDocument();
//   const renameDocument = useRenameDocument();

//   // Setup breadcrumb navigation
//   useDocumentBreadcrumbs(currentFolder, documents);

//   const navigate = useNavigate();
//   const nestedBreadcrumbs = useNestedFolderBreadcrumbs([], [], documents);

//   // Prefetch documents when they are loaded
//   useEffect(() => {
//     if (documents.length > 0) {
//       // Prefetch first 5 documents immediately
//       for (const doc of documents.slice(0, 10)) {
//         prefetchDocument(doc);
//       }

//       // Prefetch the rest with a delay to not overwhelm the network
//       if (documents.length > 5) {
//         const timer = setTimeout(() => {
//           for (const doc of documents.slice(5)) {
//             prefetchDocument(doc);
//           }
//         }, 2000);
//         return () => clearTimeout(timer);
//       }
//     }
//   }, [documents]);

//   const handleUploadComplete = async (
//     file: UppyFile<Record<string, unknown>, Record<string, unknown>>,
//     parentId?: string | null
//   ) => {
//     if (!legalEntity?.id || !user?.id) return;

//     await uploadDocument.mutateAsync({
//       file,
//       legalEntityId: legalEntity.id,
//       ownerId: user.id,
//       parentId: parentId || undefined,
//     });
//   };

//   const handleRenameFile = async () => {
//     if (!selectedFile || !newFileName.trim() || !legalEntity?.id) return;

//     await renameDocument.mutateAsync({
//       documentId: selectedFile.id,
//       legalEntityId: legalEntity.id,
//       name: newFileName,
//     });

//     setSelectedFile(null);
//     setNewFileName("");
//   };

//   // Add a function to handle switching to the nested folder path structure
//   const handleUseNestedStructure = useCallback(
//     (folderId: string) => {
//       const { path, names } = nestedBreadcrumbs.getFolderPath(folderId);

//       navigate({
//         to: "/dashboard/documents/folders/$folderPath",
//         params: { folderPath: path },
//         search: { folderNames: names },
//       });
//     },
//     [navigate, nestedBreadcrumbs]
//   );

//   // If we're viewing a specific folder, fetch all documents but filter display in tree
//   return (
//     <div className="flex flex-col h-full">
//       <DocumentHeader parentId={null} onUploadComplete={handleUploadComplete} />

//       <div className="px-4 pt-4 pb-4">
//         <DocumentTree
//           documents={documents}
//           onSelect={setSelectedFile}
//           onUploadComplete={handleUploadComplete}
//           useNestedPaths={true}
//           isLoading={isLoading || !isFetched}
//         />
//       </div>

//       {selectedFile && (
//         <div className="fixed inset-y-0 right-0 w-[350px] bg-background shadow-lg border-l z-20">
//           <FileInformationSheet
//             file={selectedFile}
//             onClose={() => setSelectedFile(null)}
//             onNewNameChange={setNewFileName}
//             onRename={handleRenameFile}
//             newFileName={newFileName}
//             isRenaming={renameDocument.isPending}
//           />
//         </div>
//       )}
//     </div>
//   );
// }
