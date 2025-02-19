import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import {
  MoreHorizontal,
  File,
  Folder,
  Upload,
  FileText,
  Image,
  FileSpreadsheet,
  FileCode,
  Plus,
  FolderPlus,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TreeView, type TreeDataItem } from "@/components/tree-view";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileUploader } from "@/components/FileUploader";
import { useEffect, useState } from "react";
import { useLegalEntity } from "@/hooks/use-legal-entity";
import { toast } from "sonner";
import { useAuthContext } from "@/lib/auth";
import type { UppyFile } from "@uppy/core";
import {
  Document,
  DocumentWithOwner,
} from "../../../../../backend/src/db/schema";
import { FileUploadDialog } from "@/components/file-upload-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";

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

export const Route = createFileRoute("/dashboard/documents/")({
  component: DocumentsPage,
});

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DocumentWithOwner | null>(
    null
  );
  const [newFileName, setNewFileName] = useState("");
  const { legalEntity } = useLegalEntity();
  const { user } = useAuthContext();

  useEffect(() => {
    if (legalEntity?.id) {
      fetchDocuments();
    }
  }, [legalEntity?.id]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/documents/${legalEntity?.id}`
      );
      if (!response.ok) throw new Error("Failed to fetch documents");
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error("Folder name is required");
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/documents/${legalEntity?.id}/folders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newFolderName,
            parentId: selectedParentId,
            ownerId: user?.id,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to create folder");

      await fetchDocuments();
      setNewFolderName("");
      setSelectedParentId(null);
      setIsCreateFolderOpen(false);
      toast.success("Folder created successfully");
    } catch (error) {
      console.error("Error creating folder:", error);
      toast.error("Failed to create folder");
    }
  };

  const handleUploadComplete = async (
    file: UppyFile<Record<string, unknown>, Record<string, unknown>>,
    parentId?: string
  ) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/documents/${legalEntity?.id}`,
        {
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
            ownerId: user?.id,
            parentId: parentId || selectedParentId,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to create document");

      await fetchDocuments();
      toast.success("File uploaded successfully");
    } catch (error) {
      console.error("Error creating document:", error);
      toast.error("Failed to upload file");
    }
  };

  const handleRenameFile = async () => {
    if (!selectedFile || !newFileName.trim()) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/documents/${legalEntity?.id}/${selectedFile.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newFileName,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to rename file");

      await fetchDocuments();
      toast.success("File renamed successfully");
      setSelectedFile(null);
    } catch (error) {
      console.error("Error renaming file:", error);
      toast.error("Failed to rename file");
    }
  };

  // Convert flat documents array to tree structure
  const buildDocumentTree = (docs: DocumentWithOwner[]): TreeDataItem[] => {
    const itemMap = new Map<string, TreeDataItem>();
    const rootItems: TreeDataItem[] = [];

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
                size: calculateFileSize(doc.size),
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
                onUploadComplete={(file) => handleUploadComplete(file, doc.id)}
                onUploadError={(error) => {
                  console.error("Upload error:", error);
                  toast.error("Failed to upload file");
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
                // TODO: Implement file actions menu
                console.log("Open actions for file:", doc.id);
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

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-end items-center gap-2">
        <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <FolderPlus className="mr-2 h-4 w-4" />
              Новая папка
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать новую папку</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Имя папки</Label>
                <Input
                  id="name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Введите имя папки"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleCreateFolder}>Создать папку</Button>
            </div>
          </DialogContent>
        </Dialog>

        <FileUploadDialog
          supabaseUrl={import.meta.env.VITE_SUPABASE_URL}
          supabaseAnonKey={import.meta.env.VITE_SUPABASE_ANON_KEY}
          parentId={selectedParentId}
          onUploadComplete={(file) => handleUploadComplete(file)}
          onUploadError={(error) => {
            console.error("Upload error:", error);
            toast.error("Failed to upload file");
          }}
        />
      </div>

      <div className="mb-4 flex justify-between items-center mt-8">
        <div className="grid grid-cols-[2fr,1fr,1fr,100px,80px] gap-4 px-4 text-sm font-medium text-muted-foreground w-full">
          <div>Имя</div>
          <div>Владелец</div>
          <div>Последнее изменение</div>
          <div>Размер</div>
          <div />
        </div>
      </div>
      <div className="rounded-lg border bg-card min-h-[500px] pl-4">
        {documents.length === 0 ? (
          <div className="flex justify-center items-center h-32 text-muted-foreground">
            Документы не найдены
          </div>
        ) : (
          <TreeView
            data={documentTree}
            expandAll={false}
            defaultNodeIcon={Folder}
            defaultLeafIcon={File}
            className="[&_[role='treeitem']]:transition-colors [&_[role='treeitem']]:duration-200 [&_[role='treeitem']]:ease-in-out [&_[role='treeitem']]:rounded-md [&_[role='treeitem']]:hover:bg-accent/50"
            onSelect={(item: TreeDataItem) => {
              if (item.children) {
                setSelectedParentId(item.id);
              } else {
                const selectedDoc = documents.find((doc) => doc.id === item.id);
                if (selectedDoc) {
                  setSelectedFile(selectedDoc);
                  setNewFileName(selectedDoc.name);
                }
              }
            }}
          />
        )}
      </div>

      <Sheet
        open={!!selectedFile}
        onOpenChange={(open) => !open && setSelectedFile(null)}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Информация о файле</SheetTitle>
            <SheetDescription>
              Просмотр и редактирование информации о файле
            </SheetDescription>
          </SheetHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Имя файла</h3>
              <div className="flex items-center gap-2">
                <Input
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="Введите новое имя файла"
                />
                <Button
                  onClick={handleRenameFile}
                  disabled={
                    !newFileName.trim() || newFileName === selectedFile?.name
                  }
                >
                  Переименовать
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Информация о файле</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  Размер:{" "}
                  {selectedFile && calculateFileSize(selectedFile.size || "0")}
                </p>
                <p>
                  Создан:{" "}
                  {selectedFile &&
                    formatDistanceToNow(new Date(selectedFile.createdAt), {
                      addSuffix: true,
                    })}
                </p>
                <p>Владелец: {selectedFile?.createdBy?.email}</p>
              </div>
            </div>
          </div>

          <SheetFooter>
            <Button variant="outline" onClick={() => setSelectedFile(null)}>
              Закрыть
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
function calculateFileSize(size: string): string | undefined {
  const sizeInBytes = Number.parseInt(size, 10);
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  } else if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(2)} KB`;
  } else if (sizeInBytes < 1024 * 1024 * 1024) {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
  } else {
    return `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
}
