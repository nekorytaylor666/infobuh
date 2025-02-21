import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DocumentWithOwneSignature } from "@backend/db/schema";
import { FilePreview } from "./file-preview";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { calculateFileSize } from "../utils/file-utils";

interface FileInformationSheetProps {
  file: DocumentWithOwneSignature | null;
  newFileName: string;
  onFileNameChange: (name: string) => void;
  onRename: () => void;
  onClose: () => void;
}

export function FileInformationSheet({
  file,
  newFileName,
  onFileNameChange,
  onRename,
  onClose,
}: FileInformationSheetProps) {
  return (
    <Sheet open={!!file} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Информация о файле</SheetTitle>
          <SheetDescription>
            Просмотр и редактирование информации о файле
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="preview" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">Предпросмотр</TabsTrigger>
            <TabsTrigger value="info">Информация</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-4">
            {file && <FilePreview file={file} />}
          </TabsContent>

          <TabsContent value="info" className="mt-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Имя файла</h3>
                <div className="flex items-center gap-2">
                  <Input
                    value={newFileName}
                    onChange={(e) => onFileNameChange(e.target.value)}
                    placeholder="Введите новое имя файла"
                  />
                  <Button
                    onClick={onRename}
                    disabled={!newFileName.trim() || newFileName === file?.name}
                  >
                    Переименовать
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Информация о файле</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Размер: {file && calculateFileSize(file.size || "0")}</p>
                  <p>
                    Создан:{" "}
                    {file &&
                      formatDistanceToNow(new Date(file.createdAt), {
                        addSuffix: true,
                        locale: ru,
                      })}
                  </p>
                  <p>Владелец: {file?.createdBy?.email}</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Закрыть
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
