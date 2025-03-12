import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import {
  File,
  Folder,
  FileText,
  Image,
  FileSpreadsheet,
  FileCode,
} from "lucide-react";
import type { DocumentWithOwnerSignature } from "@backend/db/schema";
import { prefetchDocument } from "../utils/document-utils";
import type { UppyFile } from "@uppy/core";
import { Link, useNavigate } from "@tanstack/react-router";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { useNestedFolderBreadcrumbs } from "../hooks/use-nested-folder-breadcrumbs";
import { useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  HoverCard, 
  HoverCardTrigger, 
  HoverCardContent 
} from "@/components/ui/hover-card";
import { documentCache } from "../utils/document-cache";

interface DocumentTreeProps {
  documents: DocumentWithOwnerSignature[];
  onSelect: (file: DocumentWithOwnerSignature) => void;
  onUploadComplete: (
    file: UppyFile<Record<string, unknown>, Record<string, unknown>>,
    parentId?: string | null
  ) => void;
  currentFolderId?: string;
  useNestedPaths?: boolean;
  isLoading?: boolean;
}

// Function to get appropriate icon based on file extension
const getFileIcon = (filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "txt":
    case "docx":
    case "doc":
    case "pdf":
      return FileText;
    case "pptx":
    case "jpg":
    case "jpeg":
    case "png":
      return Image;
    case "xlsx":
    case "xls":
    case "csv":
      return FileSpreadsheet;
    case "js":
    case "ts":
    case "jsx":
    case "tsx":
      return FileCode;
    default:
      return File;
  }
};

const isPreviewableFile = (filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ["jpg", "jpeg", "png", "gif", "webp", "pdf"].includes(ext || "");
};

const FilePreviewHoverCard = ({ doc }: { doc: DocumentWithOwnerSignature }) => {
  if (doc.type !== "file" || !isPreviewableFile(doc.name)) {
    return null;
  }

  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.name);
  const isPDF = /\.pdf$/i.test(doc.name);
  
  const getFileUrl = () => {
    const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/documents/${doc.name}`;
    return documentCache.get(baseUrl) || baseUrl;
  };

  return (
      <div className=" rounded-md overflow-hidden bg-background border shadow-sm p-0">
        {isImage && (
          <img
            src={getFileUrl()}
            alt={doc.name}
            className="min-w-full min-h-full"
          />
        )}
        {isPDF && (
          <iframe
            src={`${getFileUrl()}#toolbar=0&view=FitH`}
            className="w-full h-min aspect-[9/16] "
            title={doc.name}
          />
        )}
      </div> 
  );
};

export function DocumentTree({
  documents,
  onSelect,
  onUploadComplete,
  currentFolderId,
  useNestedPaths,
  isLoading = false,
}: DocumentTreeProps) {
  const navigate = useNavigate();
  const nestedBreadcrumbs = useNestedFolderBreadcrumbs([], [], documents);

  // Only show documents that belong to the current folder or root if no folder is selected
  const filteredDocuments = documents.filter((doc) =>
    currentFolderId
      ? doc.parentId === currentFolderId
      : doc.parentId === null || doc.parentId === undefined
  );

  // Sort documents to have folders first
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    if (a.type === "folder" && b.type !== "folder") {
      return -1;
    }
    if (a.type !== "folder" && b.type === "folder") {
      return 1;
    }
    return 0;
  });

  const handleItemHover = useCallback((doc: DocumentWithOwnerSignature) => {
    if (doc.type === "file" && isPreviewableFile(doc.name)) {
      prefetchDocument(doc);
    }
  }, []);

  const breadcrumb = useBreadcrumb();

  const handleFolderClick = useCallback(
    (doc: DocumentWithOwnerSignature) => {
      if (doc.type !== "folder") return;

      // Use nested paths if enabled, otherwise use simple folder navigation
      // Build full path for this folder by determining its ancestry
      const { path, names } = nestedBreadcrumbs.getFolderPath(doc.id);

      // Navigate using nested path
      navigate({
        to: "/dashboard/documents/folders/$folderPath",
        params: { folderPath: path },
        search: { folderNames: names },
      });
    },
    [navigate, nestedBreadcrumbs]
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent, doc: DocumentWithOwnerSignature) => {
      if (e.key === "Enter" || e.key === " ") {
        if (doc.type === "file") {
          onSelect(doc);
        } else if (doc.type === "folder") {
          handleFolderClick(doc);
        }
      }
    },
    [onSelect, handleFolderClick]
  );

  return (
    <div className="w-full">
      <div className="border rounded h-[calc(100vh-300px)] overflow-auto">
        <table className="w-full text-sm ">
          <thead className="sticky top-0 bg-background z-10">
            <tr className="border-b ">
              <th className="border-r text-left px-4 py-2 ">Название</th>
              <th className="border-r text-left px-2 py-2 ">Владелец</th>
              <th className="border-r text-left px-2 py-2 ">Категория</th>
              <th className="text-left px-2 py-2 ">Дата создания</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? // Skeleton rows when loading
                Array.from({ length: 50 }).map((_, index) => (
                  <tr key={index} className="border-b">
                    <td className="border-r p-2">
                      <div className="flex items-center gap-2 px-2 py-1">
                        <Skeleton className="h-4 w-4 shrink-0 rounded-sm" />
                        <Skeleton className="h-4 w-[600px] rounded-sm" />
                      </div>
                    </td>
                    <td className="border-r p-2 text-sm">
                      <Skeleton className="h-4 w-24 rounded-sm" />
                    </td>
                    <td className="border-r p-2 text-sm">
                      <Skeleton className="h-4 w-16 rounded-sm" />
                    </td>
                    <td className="p-2 text-sm">
                      <Skeleton className="h-4 w-20" />
                    </td>
                  </tr>
                ))
              : sortedDocuments.map((doc) => {
                  const Icon =
                    doc.type === "folder" ? Folder : getFileIcon(doc.name);

                  return (
                    <tr
                      key={doc.id}
                      className="border-b hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => {
                        if (doc.type === "file") {
                          onSelect(doc);
                        } else if (doc.type === "folder") {
                          handleFolderClick(doc);
                        }
                      }}
                      onKeyDown={(e) => handleKeyPress(e, doc)}
                      onMouseEnter={() => handleItemHover(doc)}
                      tabIndex={0}
                      role="row"
                      aria-label={`${doc.type === "folder" ? "Папка" : "Файл"}: ${doc.name}`}
                    >
                      <td className="border-r p-2">
                        <div className="flex items-center gap-2 px-2 py-1">
                          <Icon className="h-4 w-4 shrink-0" />
                          {doc.type === "file" && isPreviewableFile(doc.name) ? (
                            <HoverCard openDelay={200} closeDelay={200}>
                              <HoverCardTrigger asChild>
                                <span className="relative cursor-pointer hover:text-primary transition-colors">
                                  {doc.name}
                                </span>
                              </HoverCardTrigger>
                              <HoverCardContent side="right" align="start" className="z-50 p-0 rounded-md overflow-hidden">
                                <FilePreviewHoverCard doc={doc} />
                              </HoverCardContent>
                            </HoverCard>
                          ) : (
                            <span>{doc.name}</span>
                          )}
                        </div>
                      </td>
                      <td className="border-r p-2 text-sm">
                        {doc.createdBy?.email || ""}
                      </td>
                      <td className="border-r p-2 text-sm">{""}</td>
                      <td className="p-2 text-sm">
                        {doc.createdAt
                          ? new Date(doc.createdAt).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
