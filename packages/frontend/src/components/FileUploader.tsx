import { useEffect, useState } from "react";
import Dashboard from "@uppy/dashboard";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import { useUppyWithSupabase } from "@/hooks/use-uppy-with-supabase";
import {
  RiCloseCircleLine,
  RiDeleteBin7Line,
  RiFileExcel2Line,
  RiFileLine,
  RiFilePdf2Line,
  RiFileTextLine,
} from "@remixicon/react";
import { Progress } from "@/components/ui/progress";

interface FileUploaderProps {
  supabaseUrl: string;
  supabaseAnonKey: string;
  bucketName: string;
  onUploadComplete?: (file: any) => void;
  onUploadError?: (error: Error) => void;
}

interface UploadingFile {
  id: string;
  name: string;
  size: number;
  progress: number;
  type: string;
}

interface CompletedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

export function FileUploader({
  supabaseUrl,
  supabaseAnonKey,
  bucketName,
  onUploadComplete,
  onUploadError,
}: FileUploaderProps) {
  const uppy = useUppyWithSupabase({
    bucketName,
    supabaseUrl,
    supabaseAnonKey,
  });

  useEffect(() => {
    const dashboardId = `Dashboard-${Math.random().toString(36).substring(7)}`;
    uppy.use(Dashboard, {
      id: dashboardId,
      target: "#uppy-dashboard",
      inline: true,
      showProgressDetails: true,
      height: 250,
      theme: "light",
      locale: {
        strings: {
          closeModal: "Закрыть окно",
          addMoreFiles: "Добавить больше файлов",
          addingMoreFiles: "Добавление файлов",
          importFrom: "Импорт из %{name}",
          dashboardWindowTitle:
            "Окно панели Uppy (нажмите escape для закрытия)",
          dashboardTitle: "Панель Uppy",
          copyLinkToClipboardSuccess: "Ссылка скопирована в буфер обмена.",
          copyLinkToClipboardFallback: "Скопируйте URL ниже",
          copyLink: "Скопировать ссылку",
          back: "Назад",
          removeFile: "Удалить файл",
          editFile: "Редактировать файл",
          editing: "Редактирование %{file}",
          finishEditingFile: "Завершить редактирование файла",
          saveChanges: "Сохранить изменения",
          myDevice: "Мое устройство",
          dropHint: "Перетащите файлы сюда",
          uploadComplete: "Загрузка завершена",
          uploadPaused: "Загрузка приостановлена",
          resumeUpload: "Возобновить загрузку",
          pauseUpload: "Приостановить загрузку",
          retryUpload: "Повторить загрузку",
          cancelUpload: "Отменить загрузку",
          xFilesSelected: {
            0: "%{smart_count} файл выбран",
            1: "%{smart_count} файла выбрано",
          },
          uploadingXFiles: {
            0: "Загрузка %{smart_count} файла",
            1: "Загрузка %{smart_count} файлов",
          },
          processingXFiles: {
            0: "Обработка %{smart_count} файла",
            1: "Обработка %{smart_count} файлов",
          },
          poweredBy: "",
          addMore: "Добавить еще",
          editFileWithFilename: "Редактировать файл %{file}",
          save: "Сохранить",
          cancel: "Отмена",
          dropPasteFiles: "Перетащите файлы сюда или %{browseFiles}",
          dropPasteFolders: "Перетащите файлы сюда или %{browseFolders}",
          dropPasteBoth:
            "Перетащите файлы сюда, %{browseFiles} или %{browseFolders}",
          dropPasteImportFiles:
            "Перетащите файлы сюда, %{browseFiles} или импортируйте из:",
          dropPasteImportFolders:
            "Перетащите файлы сюда, %{browseFolders} или импортируйте из:",
          dropPasteImportBoth:
            "Перетащите файлы сюда, %{browseFiles}, %{browseFolders} или импортируйте из:",
          importFiles: "Импортировать файлы из:",
          browseFiles: "просмотреть файлы",
          browseFolders: "просмотреть папки",
          recoveredXFiles: {
            0: "Мы не смогли полностью восстановить 1 файл. Пожалуйста, выберите его заново и возобновите загрузку.",
            1: "Мы не смогли полностью восстановить %{smart_count} файлов. Пожалуйста, выберите их заново и возобновите загрузку.",
          },
          recoveredAllFiles:
            "Мы восстановили все файлы. Теперь вы можете возобновить загрузку.",
          sessionRestored: "Сессия восстановлена",
          reSelect: "Выбрать заново",
          missingRequiredMetaFields: {
            0: "Отсутствует обязательное мета-поле: %{fields}.",
            1: "Отсутствуют обязательные мета-поля: %{fields}.",
          },
        },
        pluralize: (n) => n,
      },
    });

    uppy.on("upload-success", (file, response) => {
      onUploadComplete?.(file);
    });

    uppy.on("upload-error", (file, error) => {
      onUploadError?.(error);
    });

    return () => {
      try {
        const plugin = uppy.getPlugin(dashboardId);
        if (plugin) {
          uppy.removePlugin(plugin);
        }
      } catch (error) {
        console.warn("Error removing Dashboard plugin:", error);
      }
    };
  }, [uppy, onUploadComplete, onUploadError]);

  return (
    <div className="sm:mx-auto sm:max-w-lg">
      <div id="uppy-dashboard" />
    </div>
  );
}
