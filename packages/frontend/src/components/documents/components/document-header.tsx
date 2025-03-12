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
import { useCreateFolder } from "@/components/documents/hooks/use-documents";
import { useLegalEntity } from "@/hooks/use-legal-entity";
import { useAuthContext } from "@/lib/auth";
import { DocumentBreadcrumb } from "./document-breadcrumb";

interface DocumentHeaderProps {
  onUploadComplete: (
    file: UppyFile<Record<string, unknown>, Record<string, unknown>>,
    parentId?: string | null
  ) => void;
  parentId?: string | null;
}

export function DocumentHeader({
  onUploadComplete,
  parentId,
}: DocumentHeaderProps) {
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const { legalEntity } = useLegalEntity();
  const { user } = useAuthContext();
  const createFolder = useCreateFolder();

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error("Имя папки обязательно");
      return;
    }

    if (!legalEntity?.id || !user?.id) {
      toast.error(
        "Не удалось создать папку: отсутствует информация о пользователе"
      );
      return;
    }

    try {
      await createFolder.mutateAsync({
        name: newFolderName.trim(),
        legalEntityId: legalEntity.id,
        ownerId: user.id,
        parentId: parentId,
      });

      setNewFolderName("");
      setIsCreateFolderOpen(false);
    } catch (error) {
      console.error("Error creating folder:", error);
      toast.error("Не удалось создать папку");
    }
  };

  return (
    <div className="flex justify-between items-center pr-4">
      <DocumentBreadcrumb />

      <div className="flex items-center gap-2">
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
          onUploadComplete={(file) => onUploadComplete(file, parentId)}
          onUploadError={(error) => {
            console.error("Upload error:", error);
            toast.error("Не удалось загрузить файл");
          }}
        />
      </div>
    </div>
  );
}
