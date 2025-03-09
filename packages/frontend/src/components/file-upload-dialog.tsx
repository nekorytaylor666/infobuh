import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { FileUploader } from "@/components/FileUploader";
import type { UppyFile } from "@uppy/core";

interface FileUploadDialogProps {
  supabaseUrl: string;
  supabaseAnonKey: string;
  parentId?: string | null;
  onUploadComplete: (
    file: UppyFile<Record<string, unknown>, Record<string, unknown>>,
    parentId?: string | null
  ) => void;
  onUploadError: (error: Error) => void;
  trigger?: React.ReactNode;
}

export function FileUploadDialog({
  supabaseUrl,
  supabaseAnonKey,
  onUploadComplete,
  onUploadError,
  trigger,
  parentId,
}: FileUploadDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Загрузить файл
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Загрузить файлы</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <FileUploader
            supabaseUrl={supabaseUrl}
            supabaseAnonKey={supabaseAnonKey}
            bucketName="documents"
            onUploadComplete={(file) => {
              onUploadComplete(file, parentId);
            }}
            onUploadError={onUploadError}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
