import { TreeView, type TreeDataItem } from "@/components/tree-view";
import { Button } from "@/components/ui/button";
import { FileUploadDialog } from "@/components/file-upload-dialog";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import {
  MoreHorizontal,
  File,
  Folder,
  Plus,
  FileText,
  Image,
  FileSpreadsheet,
  FileCode,
} from "lucide-react";
import type { Document, DocumentWithOwnerSignature } from "@backend/db/schema";
import { calculateFileSize } from "../utils/file-utils";
import { prefetchDocument } from "../utils/document-utils";
import type { UppyFile } from "@uppy/core";

interface DocumentTreeProps {
  documents: DocumentWithOwnerSignature[];
  onSelect: (file: DocumentWithOwnerSignature) => void;
  onUploadComplete: (
    file: UppyFile<Record<string, unknown>, Record<string, unknown>>,
    parentId?: string | null
  ) => void;
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

export function DocumentTree({
  documents,
  onSelect,
  onUploadComplete,
}: DocumentTreeProps) {
  // Convert flat documents array to tree structure

  const buildDocumentTree = (
    docs: DocumentWithOwnerSignature[]
  ): TreeDataItem[] => {
    const itemMap = new Map<string, TreeDataItem>();
    const rootItems: TreeDataItem[] = [];
    console.log(docs);

    // First pass: Create TreeDataItems for all documents
    for (const doc of docs) {
      const item: TreeDataItem = {
        id: doc.id,
        name: doc.name,
        icon: doc.type === "folder" ? Folder : getFileIcon(doc.name),
        children: doc.type === "folder" ? [] : undefined,
        metadata:
          doc.type === "file"
            ? {
                uploadTime: formatDistanceToNow(new Date(doc.createdAt), {
                  addSuffix: true,
                  locale: ru,
                }),
                signatures: doc.signatures.length,
                owner: doc.createdBy?.email,
              }
            : undefined,
        actions:
          doc.type === "folder" ? (
            <div className="flex items-center gap-2">
              <FileUploadDialog
                supabaseUrl={import.meta.env.VITE_SUPABASE_URL}
                supabaseAnonKey={import.meta.env.VITE_SUPABASE_ANON_KEY}
                parentId={doc.id}
                onUploadComplete={onUploadComplete}
                onUploadError={(error) => {
                  console.error("Upload error:", error);
                }}
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-2 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Новый файл
                  </Button>
                }
              />
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          ),
      };
      itemMap.set(doc.id, item);
    }

    // Second pass: Build the tree structure
    for (const doc of docs) {
      const item = itemMap.get(doc.id);
      if (item) {
        if (doc.parentId) {
          const parent = itemMap.get(doc.parentId);
          if (parent?.children) {
            parent.children.push(item);
          }
        } else {
          rootItems.push(item);
        }
      }
    }

    // Sort rootItems to have folders first
    rootItems.sort((a, b) => {
      if (a.children && !b.children) {
        return -1;
      }
      if (!a.children && b.children) {
        return 1;
      }
      return 0;
    });

    return rootItems;
  };

  const documentTree = buildDocumentTree(documents);

  const handleItemHover = (item: TreeDataItem) => {
    const doc = documents.find((d) => d.id === item.id);
    if (doc && doc.type === "file") {
      prefetchDocument(doc);
    }
  };

  return (
    <TreeView
      data={documentTree}
      expandAll={false}
      defaultNodeIcon={Folder}
      defaultLeafIcon={File}
      className="[&_[role='treeitem']]:transition-colors [&_[role='treeitem']]:duration-200 [&_[role='treeitem']]:ease-in-out [&_[role='treeitem']]:rounded-md [&_[role='treeitem']]:hover:bg-accent/50"
      onSelect={(item: TreeDataItem) => {
        if (item.children) return;
        const selectedDoc = documents.find((doc) => doc.id === item.id);
        if (selectedDoc) {
          onSelect(selectedDoc as DocumentWithOwnerSignature);
        }
      }}
      onMouseEnter={handleItemHover}
    />
  );
}
