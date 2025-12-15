import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthContext } from "@/lib/auth";
import { useLegalEntity } from "@/hooks/use-legal-entity";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Pen } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type {
  DocumentSignatureWithSigner,
  DocumentWithOwnerSignature,
} from "@backend/db/schema";
import { documentCache } from "../utils/document-cache";
import { signDocument } from "../utils/document-utils";
import { PdfViewer } from "./pdf-viewer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FilePreviewProps {
  file: DocumentWithOwnerSignature;
}

const KEY_CACHE_KEY = "cached_signing_key";

export function FilePreview({ file }: FilePreviewProps) {
  const { user } = useAuthContext();
  const { legalEntity } = useLegalEntity();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [signatures, setSignatures] = useState<DocumentSignatureWithSigner[]>(
    []
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [keyFile, setKeyFile] = useState<File | null>(null);
  const [cachedKeyBase64, setCachedKeyBase64] = useState<string | null>(null);

  // Load cached key on component mount
  useEffect(() => {
    const cached = localStorage.getItem(KEY_CACHE_KEY);
    if (cached) {
      setCachedKeyBase64(cached);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setKeyFile(e.target.files[0]);
      // Clear cached key when new file is selected
      setCachedKeyBase64(null);
      localStorage.removeItem(KEY_CACHE_KEY);
    }
  };

  const handleSign = async () => {
    if (
      !user?.id ||
      !legalEntity?.id ||
      (!keyFile && !cachedKeyBase64) ||
      !password
    ) {
      toast.error("Please provide both key file and password");
      return;
    }

    setIsSigning(true);
    try {
      let keyBase64 = cachedKeyBase64;

      if (keyFile && !cachedKeyBase64) {
        // Convert key file to base64 using FileReader
        keyBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result?.toString().split(",")[1];
            if (base64) {
              resolve(base64);
              // Cache the key
              localStorage.setItem(KEY_CACHE_KEY, base64);
              setCachedKeyBase64(base64);
            } else {
              reject(new Error("Failed to convert key file to base64"));
            }
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(keyFile);
        });
      }

      if (!keyBase64) {
        throw new Error("No key file available");
      }

      await signDocument(file.id, legalEntity.id, user.id, {
        key: keyBase64,
        password,
      });

      toast.success("Document signed successfully");
      setIsDialogOpen(false);
      setPassword("");

      // Refresh signatures
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/documents/${legalEntity.id}/${
          file.id
        }/signatures`
      );
      if (response.ok) {
        const data = await response.json();
        setSignatures(data);
      }
    } catch (error) {
      console.error("Error signing document:", error);
      toast.error("Failed to sign document");
    } finally {
      setIsSigning(false);
    }
  };

  useEffect(() => {
    if (file.id && legalEntity?.id) {
      fetch(
        `${import.meta.env.VITE_API_URL}/documents/${legalEntity.id}/${
          file.id
        }/signatures`
      )
        .then((response) => response.json())
        .then((data) => setSignatures(data))
        .catch(console.error);
    }
  }, [file.id, legalEntity?.id]);

  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);
  const isPDF = /\.pdf$/i.test(file.name.replace(/\s/g, "%20"));

  const getFileUrl = useCallback(() => {
    const baseUrl = `${
      import.meta.env.VITE_SUPABASE_URL
    }/storage/v1/object/public/documents/${file.name}`;
    return documentCache.get(baseUrl) || baseUrl;
  }, [file.name]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Pen className="h-4 w-4" />
              Подписать
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Подписать документ</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="key">
                  Ключ {cachedKeyBase64 && "(Сохранен)"}
                </Label>
                <Input
                  id="key"
                  type="file"
                  onChange={handleFileChange}
                  accept=".p12"
                  disabled={!!cachedKeyBase64}
                />
                {cachedKeyBase64 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCachedKeyBase64(null);
                      localStorage.removeItem(KEY_CACHE_KEY);
                      setKeyFile(null);
                    }}
                    className="mt-2"
                  >
                    Очистить ключ
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button
                onClick={handleSign}
                disabled={
                  isSigning || (!keyFile && !cachedKeyBase64) || !password
                }
                className="w-full"
              >
                {isSigning ? "Подписание..." : "Подписать"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative w-full aspect-[3/2] max-h-[400px] bg-muted/20 rounded-lg ">
        {isLoading && (
          <Skeleton className="w-full h-full absolute inset-0 rounded-lg" />
        )}
        {isImage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src={getFileUrl()}
              alt={file.name}
              className="max-w-full max-h-full object-contain"
              onLoad={() => {
                setIsLoading(false);
                setHasError(false);
              }}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
              style={{ opacity: isLoading ? 0 : 1 }}
            />
          </div>
        )}
        {isPDF && (
          <PdfViewer
            url={getFileUrl()}
            className="w-full h-full rounded-lg"
            mode="full"
            onLoad={() => {
              setIsLoading(false);
              setHasError(false);
            }}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
          />
        )}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            Failed to load file
          </div>
        )}
      </div>

      {signatures.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Подписи</h3>
          <div className="space-y-2">
            {signatures.map((signature) => (
              <div
                key={signature.id}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={signature.signer.image || undefined} />
                  <AvatarFallback>
                    {signature.signer.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span>{signature.signer.name}</span>
                <span>•</span>
                <span>
                  {formatDistanceToNow(new Date(signature.signedAt), {
                    addSuffix: true,
                    locale: ru,
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
