// import { DocumentHeader } from "@/components/documents/components/document-header";
// import { DocumentTree } from "@/components/documents/components/document-tree";
// import { FileInformationSheet } from "@/components/documents/components/file-information-sheet";
// import { DocumentBreadcrumb } from "@/components/documents/components/document-breadcrumb";
// import {
//   useRenameDocument,
//   useUploadDocument,
// } from "@/components/documents/hooks/use-documents";
// import { useDocument } from "@/components/documents/hooks/use-documents";
// import { useDocuments } from "@/components/documents/hooks/use-documents";
// import { prefetchDocument } from "@/components/documents/utils/document-utils";
// import { Button } from "@/components/ui/button";
// import { useLegalEntity } from "@/hooks/use-legal-entity";
// import { useAuthContext } from "@/lib/auth";
// import type { DocumentWithOwnerSignature } from "@backend/db/schema";
// import {
//   createFileRoute,
//   Link,
//   useNavigate,
//   useParams,
//   useRouter,
//   useSearch,
// } from "@tanstack/react-router";
// import type { UppyFile } from "@uppy/core";
// import { ChevronLeft } from "lucide-react";
// import React from "react";
// import { useEffect, useMemo, useState, useCallback } from "react";
// import { useNestedFolderBreadcrumbs } from "@/components/documents/hooks/use-nested-folder-breadcrumbs";
// import { Skeleton } from "@/components/ui/skeleton";

// // Create a type for our loader data
// interface FolderLoaderData {
//   folderIds: string[];
//   currentFolderId: string | undefined;
// }

// // Create a route for nested folders
// export const Route = createFileRoute(
//   "/dashboard/documents/folders/$folderPath"
// )({
//   component: NestedFolderPage,
//   // Parse the path and load data
//   loader: ({ params }) => {
//     // Split the path into folder IDs
//     const folderIds = params.folderPath
//       ? params.folderPath.split("/").filter(Boolean)
//       : [];
//     const currentFolderId =
//       folderIds.length > 0 ? folderIds[folderIds.length - 1] : undefined;

//     return { folderIds, currentFolderId } as FolderLoaderData;
//   },
//   // Define search params for TypeScript
//   validateSearch: (search) => {
//     // Return search params with proper types
//     return {
//       folderNames: (search.folderNames as string) || "",
//     };
//   },
// });

// function NestedFolderPage() {
//   const search = Route.useSearch();
//   const loaderData = Route.useLoaderData() as FolderLoaderData;

//   // Extract folder IDs and names from the loader data and search params
//   const { folderIds, currentFolderId } = loaderData;
//   const folderNames = search.folderNames ? search.folderNames.split(",") : [];

//   const [selectedFile, setSelectedFile] =
//     useState<DocumentWithOwnerSignature | null>(null);
//   const [newFileName, setNewFileName] = useState("");
//   const { legalEntity } = useLegalEntity();
//   const { user } = useAuthContext();

//   const {
//     data: documents = [],
//     isLoading,
//     isFetched,
//   } = useDocuments(legalEntity?.id);

//   const uploadDocument = useUploadDocument();
//   const renameDocument = useRenameDocument();

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

//   // Use nested breadcrumbs hook
//   const { navigateToParent } = useNestedFolderBreadcrumbs(
//     folderIds,
//     folderNames,
//     documents
//   );
//   console.log(navigateToParent);

//   const handleUploadComplete = async (
//     file: UppyFile<Record<string, unknown>, Record<string, unknown>>,
//     parentId?: string | null
//   ) => {
//     if (!legalEntity?.id || !user?.id) return;

//     await uploadDocument.mutateAsync({
//       file,
//       legalEntityId: legalEntity.id,
//       ownerId: user.id,
//       parentId: parentId || currentFolderId || undefined,
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

//   // If we're viewing a specific folder, fetch all documents but filter display in tree
//   return (
//     <div className="flex flex-col h-full">
//       <DocumentHeader
//         parentId={currentFolderId}
//         onUploadComplete={handleUploadComplete}
//       />

//       <div className="flex-grow overflow-hidden">
//         <div className="h-full px-4 pt-4 pb-4">
//           <DocumentTree
//             documents={documents}
//             onSelect={setSelectedFile}
//             onUploadComplete={handleUploadComplete}
//             currentFolderId={currentFolderId}
//             useNestedPaths={true}
//             isLoading={isLoading || !isFetched}
//           />
//         </div>
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
