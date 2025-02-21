import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUploadDialog } from "@/components/file-upload-dialog";
import { FolderPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { UppyFile } from "@uppy/core";

interface DocumentHeaderProps {
  legalEntityId?: string;
  userId?: string;
  onUploadComplete: () => void;
}

export function DocumentHeader({
  legalEntityId,
  userId,
  onUploadComplete,
}: DocumentHeaderProps) {
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error("Folder name is required");
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/documents/${legalEntityId}/folders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newFolderName,
            ownerId: userId,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to create folder");

      onUploadComplete();
      setNewFolderName("");
      setIsCreateFolderOpen(false);
      toast.success("Folder created successfully");
    } catch (error) {
      console.error("Error creating folder:", error);
      toast.error("Failed to create folder");
    }
  };

  const handleUploadComplete = async (
    file: UppyFile<Record<string, unknown>, Record<string, unknown>>
  ) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/documents/${legalEntityId}`,
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
            ownerId: userId,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to create document");

      onUploadComplete();
      toast.success("File uploaded successfully");
    } catch (error) {
      console.error("Error creating document:", error);
      toast.error("Failed to upload file");
    }
  };

  return (
    <div className="flex justify-end items-center gap-2">
      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
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
        onUploadComplete={handleUploadComplete}
        onUploadError={(error) => {
          console.error("Upload error:", error);
          toast.error("Failed to upload file");
        }}
      />
    </div>
  );
}
