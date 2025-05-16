import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import type { OnboardingData } from "./schema";
import { CircleUserRoundIcon, XIcon } from "lucide-react";
import { useFileUpload } from "@/components/documents/hooks/use-file-upload";
import { Button } from "@/components/ui/button";

export function CompanyForm() {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext<OnboardingData>();
  console.log(errors);
  const [
    { files: uploadedFiles },
    { removeFile, openFileDialog, getInputProps },
  ] = useFileUpload({
    accept: "image/*",
    maxFiles: 1,
    onFilesAdded: (files) => {
      console.log("files", files);
      setValue("legalEntity.image", files[0].preview, {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
  });

  const currentImageUrl = watch("legalEntity.image");
  const previewUrl = uploadedFiles[0]?.preview || currentImageUrl || null;
  const fileName = uploadedFiles[0]?.file.name || null;

  const handleRemoveImage = () => {
    if (uploadedFiles[0]) {
      removeFile(uploadedFiles[0].id);
    }
    setValue("legalEntity.image", "", {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="legalEntity.name">Название компании</Label>
        <Input id="legalEntity.name" {...register("legalEntity.name")} />
        {errors.legalEntity?.name && (
          <p className="text-sm text-destructive mt-1">
            {errors.legalEntity.name.message}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="legalEntity.type">Тип компании</Label>
        <Input id="legalEntity.type" {...register("legalEntity.type")} />
        {errors.legalEntity?.type && (
          <p className="text-sm text-destructive mt-1">
            {errors.legalEntity.type.message}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="legalEntity.bin">БИН</Label>
        <Input id="legalEntity.bin" {...register("legalEntity.bin")} />
        {errors.legalEntity?.bin && (
          <p className="text-sm text-destructive mt-1">
            {errors.legalEntity.bin.message}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="legalEntity.address">Адрес</Label>
        <Input id="legalEntity.address" {...register("legalEntity.address")} />
        {errors.legalEntity?.address && (
          <p className="text-sm text-destructive mt-1">
            {errors.legalEntity.address.message}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="legalEntity.phone">Телефон</Label>
        <Input id="legalEntity.phone" {...register("legalEntity.phone")} />
        {errors.legalEntity?.phone && (
          <p className="text-sm text-destructive mt-1">
            {errors.legalEntity.phone.message}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="legalEntity.oked">ОКЭД</Label>
        <Input id="legalEntity.oked" {...register("legalEntity.oked")} />
        {errors.legalEntity?.oked && (
          <p className="text-sm text-destructive mt-1">
            {errors.legalEntity.oked.message}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="legalEntity.registrationDate">Дата регистрации</Label>
        <Input
          id="legalEntity.registrationDate"
          type="date"
          {...register("legalEntity.registrationDate")}
        />
        {errors.legalEntity?.registrationDate && (
          <p className="text-sm text-destructive mt-1">
            {errors.legalEntity.registrationDate.message}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="legalEntity.ugd">УГД</Label>
        <Input id="legalEntity.ugd" {...register("legalEntity.ugd")} />
        {errors.legalEntity?.ugd && (
          <p className="text-sm text-destructive mt-1">
            {errors.legalEntity.ugd.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label>Логотип компании</Label>
        <div className="flex flex-col items-start gap-2 pt-1">
          <div className="relative inline-flex">
            <Button
              type="button"
              variant="outline"
              className="relative size-24 overflow-hidden rounded-full p-0 shadow-none"
              onClick={openFileDialog}
              aria-label={
                previewUrl ? "Изменить изображение" : "Загрузить изображение"
              }
            >
              {previewUrl ? (
                <img
                  className="size-full object-cover"
                  src={previewUrl}
                  alt="Предпросмотр загруженного изображения"
                  width={96}
                  height={96}
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="flex size-full items-center justify-center bg-muted/30"
                >
                  <CircleUserRoundIcon className="size-10 opacity-50" />
                </div>
              )}
            </Button>
            {previewUrl && (
              <Button
                type="button"
                onClick={handleRemoveImage}
                size="icon"
                variant="destructive"
                className="border-background focus-visible:border-background absolute -top-1 -right-1 size-7 rounded-full border-2 shadow-md"
                aria-label="Удалить изображение"
              >
                <XIcon className="size-4" />
              </Button>
            )}
            <input
              {...getInputProps()}
              className="sr-only"
              aria-label="Загрузить файл изображения"
              tabIndex={-1}
            />
          </div>
          {fileName && (
            <p className="text-muted-foreground text-xs">{fileName}</p>
          )}
          {!previewUrl && !fileName && (
            <p className="text-muted-foreground text-xs mt-1">
              Нажмите на иконку для загрузки логотипа (до 5МБ)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
