import { getDealDocument, signDealDocument, getDealDocumentSignatures, type DocumentSignature } from "@/lib/api";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar } from "@radix-ui/react-avatar";
import {
  Download,
  User,
  Paperclip,
  MessageCircle,
  Signature,
  ArrowLeft,
  Upload,
  X,
  Loader2,
  CheckCircle,
  Key,
  ShieldCheck,
  ShieldAlert,
  FileSignature,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

import { useMediaQuery } from "@/hooks/use-media-query";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PdfViewer } from "@/components/documents/components/pdf-viewer";
import { Label } from "@/components/ui/label";

const SIGNING_KEY_CACHE_KEY = "cached_signing_key";

// Helper function to convert file to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:application/x-pkcs12;base64,")
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}

interface SignDocumentFormProps {
  onSign: (credentials: { key: string; password: string }) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

function SignDocumentForm({ onSign, isLoading, error, success }: SignDocumentFormProps) {
  const [cachedKeyBase64, setCachedKeyBase64] = useState<string | null>(null);
  const [keyFileName, setKeyFileName] = useState<string | null>(null);
  const [password, setPassword] = useState("");

  // Load cached key from localStorage on mount
  useEffect(() => {
    const cached = localStorage.getItem(SIGNING_KEY_CACHE_KEY);
    if (cached) {
      setCachedKeyBase64(cached);
      setKeyFileName("Сохраненный ключ");
    }
  }, []);

  // Handle file upload -> convert to base64 -> cache in localStorage
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64(file);
      localStorage.setItem(SIGNING_KEY_CACHE_KEY, base64);
      setCachedKeyBase64(base64);
      setKeyFileName(file.name);
    } catch (err) {
      console.error("Failed to read key file:", err);
    }
  }, []);

  // Clear cached key
  const handleClearKey = useCallback(() => {
    localStorage.removeItem(SIGNING_KEY_CACHE_KEY);
    setCachedKeyBase64(null);
    setKeyFileName(null);
  }, []);

  // Submit signing request
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (cachedKeyBase64 && password) {
      await onSign({ key: cachedKeyBase64, password });
    }
  }, [cachedKeyBase64, password, onSign]);

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center p-6 sm:p-8 gap-4">
        <div className="h-20 w-20 sm:h-16 sm:w-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="h-12 w-12 sm:h-10 sm:w-10 text-green-500" />
        </div>
        <h3 className="text-xl sm:text-lg font-medium">Документ подписан</h3>
        <p className="text-base sm:text-sm text-muted-foreground text-center">
          Документ успешно подписан электронной подписью
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 sm:gap-4 p-5 sm:p-4">
      <div className="text-center mb-1">
        <h3 className="text-xl sm:text-lg font-medium">Подписать документ</h3>
        <p className="text-base sm:text-sm text-muted-foreground mt-1">
          Загрузите ключ ЭЦП (.p12) и введите пароль
        </p>
      </div>

      {/* Key file upload */}
      <div className="space-y-2">
        <Label htmlFor="key-file" className="text-base sm:text-sm">Ключ ЭЦП (.p12)</Label>
        {cachedKeyBase64 ? (
          <div className="flex items-center gap-3 p-4 sm:p-3 bg-muted rounded-xl sm:rounded-lg">
            <div className="h-10 w-10 sm:h-8 sm:w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Key className="h-5 w-5 sm:h-4 sm:w-4 text-primary" />
            </div>
            <span className="flex-1 text-base sm:text-sm truncate">{keyFileName}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 sm:h-8 sm:w-8 shrink-0"
              onClick={handleClearKey}
            >
              <X className="h-5 w-5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        ) : (
          <div className="relative">
            <input
              id="key-file"
              type="file"
              accept=".p12,.pfx"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center gap-3 p-6 sm:p-4 border-2 border-dashed rounded-xl sm:rounded-lg hover:border-primary active:border-primary active:bg-muted/50 transition-colors">
              <div className="h-12 w-12 sm:h-10 sm:w-10 rounded-full bg-muted flex items-center justify-center">
                <Upload className="h-6 w-6 sm:h-5 sm:w-5 text-muted-foreground" />
              </div>
              <span className="text-base sm:text-sm text-muted-foreground text-center">
                Нажмите, чтобы выбрать файл ключа
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Password input */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-base sm:text-sm">Пароль от ключа</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Введите пароль"
          disabled={isLoading}
          className="h-12 sm:h-10 text-base sm:text-sm rounded-xl sm:rounded-lg"
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 sm:p-3 bg-destructive/10 text-destructive rounded-xl sm:rounded-lg text-base sm:text-sm">
          {error}
        </div>
      )}

      {/* Submit button */}
      <Button
        type="submit"
        disabled={!cachedKeyBase64 || !password || isLoading}
        className="w-full h-12 sm:h-10 text-base sm:text-sm rounded-xl sm:rounded-lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 sm:h-4 sm:w-4 mr-2 animate-spin" />
            Подписание...
          </>
        ) : (
          <>
            <Signature className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
            Подписать
          </>
        )}
      </Button>
    </form>
  );
}

// Format date for display
function formatDate(dateString: string | null): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Get signer display name from signature
function getSignerName(sig: DocumentSignature): string {
  // Try to build name from certificate subject
  if (sig.subjectLastName || sig.subjectSurName) {
    const parts = [sig.subjectLastName, sig.subjectSurName].filter(Boolean);
    if (parts.length > 0) return parts.join(" ");
  }
  if (sig.subjectCommonName) return sig.subjectCommonName;
  if (sig.subjectOrganization) return sig.subjectOrganization;
  if (sig.signer?.fullName) return sig.signer.fullName;
  return "Неизвестный подписант";
}

interface SignaturesSectionProps {
  signatures: DocumentSignature[];
  isLoading: boolean;
  onRefresh: () => void;
}

function SignaturesSection({ signatures, isLoading, onRefresh }: SignaturesSectionProps) {
  if (isLoading) {
    return (
      <div className="p-6 sm:p-4">
        <div className="flex items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 sm:h-4 sm:w-4 animate-spin" />
          <span className="text-base sm:text-sm">Загрузка подписей...</span>
        </div>
      </div>
    );
  }

  if (signatures.length === 0) {
    return (
      <div className="p-6 sm:p-4 text-center">
        <div className="h-16 w-16 sm:h-12 sm:w-12 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
          <FileSignature className="h-8 w-8 sm:h-6 sm:w-6 text-muted-foreground/50" />
        </div>
        <p className="text-base sm:text-sm text-muted-foreground">Документ не подписан</p>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-4 space-y-4 sm:space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-base sm:text-sm font-medium flex items-center gap-2">
          <FileSignature className="h-5 w-5 sm:h-4 sm:w-4" />
          Подписи ({signatures.length})
        </h4>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 sm:h-8 sm:w-8"
          onClick={onRefresh}
        >
          <RefreshCw className="h-5 w-5 sm:h-4 sm:w-4" />
        </Button>
      </div>
      <div className="space-y-3 sm:space-y-2">
        {signatures.map((sig) => (
          <div
            key={sig.id}
            className="p-4 sm:p-3 rounded-xl sm:rounded-lg border bg-muted/30 space-y-3 sm:space-y-2"
          >
            <div className="flex items-start justify-between gap-3 sm:gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-base sm:text-sm font-medium truncate">
                  {getSignerName(sig)}
                </p>
                {(sig.subjectIin || sig.subjectBin) && (
                  <p className="text-sm sm:text-xs text-muted-foreground mt-0.5">
                    {sig.subjectIin ? `ИИН: ${sig.subjectIin}` : `БИН: ${sig.subjectBin}`}
                  </p>
                )}
              </div>
              {sig.isValid !== null && (
                <Badge
                  variant={sig.isValid ? "default" : "destructive"}
                  className="flex items-center gap-1.5 sm:gap-1 shrink-0 h-7 sm:h-6 px-2.5 sm:px-2"
                >
                  {sig.isValid ? (
                    <>
                      <ShieldCheck className="h-4 w-4 sm:h-3 sm:w-3" />
                      <span className="text-sm sm:text-xs">Валидна</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="h-4 w-4 sm:h-3 sm:w-3" />
                      <span className="text-sm sm:text-xs">Невалидна</span>
                    </>
                  )}
                </Badge>
              )}
            </div>
            <div className="text-sm sm:text-xs text-muted-foreground space-y-0.5">
              <p>Подписано: {formatDate(sig.signedAt)}</p>
              {sig.subjectOrganization && (
                <p className="truncate">Организация: {sig.subjectOrganization}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/share/deals/$dealId/$documentId")({
  component: DealDocumentPageComponent,
  pendingComponent: DealDocumentPendingComponent,

  loader: async ({ params }) => {
    // dealId parameter is actually the share token
    const shareToken = params.dealId;
    const document = await getDealDocument(shareToken, params.documentId, shareToken);
    console.log(document);

    let pdfUrl = null;
    let pdfError = null;

    try {
      // Use filePath directly as it's already a full Supabase public URL
      if (document.filePath) {
        pdfUrl = document.filePath;
      } else {
        pdfError = "Не удалось получить валидную ссылку на документ.";
      }
    } catch (e: unknown) {
      let errorMessage = "Неизвестная ошибка при загрузке PDF";
      if (e instanceof Error) {
        errorMessage = `Ошибка: ${e.message}`;
      }
      console.error("Error processing PDF:", e);
      pdfError = errorMessage;
    }

    return {
      document,
      pdfUrl,
      pdfError,
    };
  },
});

const mockKazakhInvoiceData = {
  companyName: `ТОО "Рога и Копыта"`,
  bin: "123456789012",
  kbe: "17",
  account: "KZ1234567890123456",
  bik: "KSNJ KZ KX",
  bank: "Kaspi Bank JSC",
  invoiceNumber: "2024-001",
  invoiceDate: "2024-07-26",
  contractNumber: "Договор №123",
  contractDate: "2024-01-15",
  clientName: `ИП "Клиент Клиентович"`,
  clientBin: "987654321098",
  clientAddress: "г. Алматы, ул. Абая, 1",
  items: [
    { description: "Услуга 1", quantity: 2, unit: "шт", price: 10000 },
    { description: "Товар A", quantity: 5.5, unit: "кг", price: 5000 },
    { description: "Консультация", quantity: 1, unit: "час", price: 15000 },
  ],
  totalAmount: 2 * 10000 + 5.5 * 5000 + 1 * 15000,
  vatAmount: (2 * 10000 + 5.5 * 5000 + 1 * 15000) * 0.12,
  totalInWords: "Шестьдесят две тысячи пятьсот тенге 00 тиын",
  executorName: "Иванов И.И.",
  sellerImage: undefined,
  contactPhone: "+7 (777) 123-45-67",
};

const mockComments = [
  {
    id: "1",
    author: "sender",
    text: "Здравствуйте, я отправил счет за услуги прошлого месяца. Пожалуйста, дайте знать, если все в порядке.",
    timestamp: "A",
  },
  {
    id: "2",
    author: "receiver",
    text: "Спасибо за счет. Я заметил расхождение в итоговой сумме. Не могли бы вы проверить начисления за дополнительные услуги?",
    timestamp: "A",
  },
  {
    id: "3",
    author: "sender",
    text: "Дополнительная плата взимается за дополнительные часы поддержки, которые мы предоставили 10 и 11 числа. Дайте знать, если вам нужны дополнительные детали.",
    timestamp: "A",
  },
  {
    id: "4",
    author: "receiver",
    text: "Понятно! Теперь все сходится. Все выглядит хорошо — я произведу оплату до пятницы.",
    timestamp: "A",
  },
  {
    id: "5",
    author: "sender",
    text: "Отлично, спасибо за подтверждение!",
    timestamp: "A",
  },
];

export function DealDocumentPageComponent() {
  const { dealId, documentId } = Route.useParams();
  const { document, pdfUrl, pdfError } = Route.useLoaderData();

  const data = {
    ...mockKazakhInvoiceData,
    companyName: mockKazakhInvoiceData.companyName,
  };

  const [loadingPdf, setLoadingPdf] = useState(true);
  const [numPages, setNumPages] = useState<number | null>(null);

  const [isDesktopCommentsVisible, setIsDesktopCommentsVisible] =
    useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Signing state
  const [isSigningLoading, setIsSigningLoading] = useState(false);
  const [signingError, setSigningError] = useState<string | null>(null);
  const [signingSuccess, setSigningSuccess] = useState(false);

  // Signatures state
  const [signatures, setSignatures] = useState<DocumentSignature[]>([]);
  const [signaturesLoading, setSignaturesLoading] = useState(true);

  // Fetch signatures
  const fetchSignatures = useCallback(async () => {
    setSignaturesLoading(true);
    try {
      const sigs = await getDealDocumentSignatures(dealId, documentId, dealId);
      setSignatures(sigs);
    } catch (err) {
      console.error("Failed to fetch signatures:", err);
    } finally {
      setSignaturesLoading(false);
    }
  }, [dealId, documentId]);

  // Fetch signatures on mount
  useEffect(() => {
    fetchSignatures();
  }, [fetchSignatures]);

  // Handle document signing
  const handleSign = useCallback(async (credentials: { key: string; password: string }) => {
    setIsSigningLoading(true);
    setSigningError(null);

    try {
      // dealId is the share token in this context
      await signDealDocument(dealId, documentId, dealId, credentials);
      setSigningSuccess(true);
      // Refresh signatures after successful signing
      fetchSignatures();
    } catch (err: unknown) {
      console.error("Signing error:", err);
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: string; message?: string } } };
        setSigningError(axiosError.response?.data?.error || axiosError.response?.data?.message || "Ошибка при подписании документа");
      } else if (err instanceof Error) {
        setSigningError(err.message);
      } else {
        setSigningError("Неизвестная ошибка при подписании");
      }
    } finally {
      setIsSigningLoading(false);
    }
  }, [dealId, documentId, fetchSignatures]);

  const handleDownload = () => {
    if (pdfUrl) {
      const link = window.document.createElement("a");
      link.href = pdfUrl;
      const filename = pdfUrl.substring(pdfUrl.lastIndexOf("/") + 1);
      link.download = filename || "document.pdf";
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }
  };

  const CompanyLogo = () => (
    <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm">
      {data.companyName.charAt(0) || "Л"}
    </div>
  );

  const CommentsSectionContent = () => (
    <>
      <div className="p-3 sm:p-4 text-sm md:text-base font-medium text-foreground border-b">
        Комментарии
      </div>
      <ScrollArea className="flex-1 px-4">
        {mockComments.map((comment) => (
          <div key={comment.id} className="mb-4 first:mt-4">
            {comment.author === "receiver" && (
              <div className="mb-1 flex justify-end text-xs text-muted-foreground">
                {/* Display timestamp or author initial if needed */}
              </div>
            )}
            <div className="mb-2 flex items-start gap-2">
              {comment.author === "receiver" && (
                <div className="flex-1 rounded-lg rounded-tl-none bg-muted p-2 sm:p-3 text-xs sm:text-sm text-muted-foreground">
                  <p>{comment.text}</p>
                </div>
              )}
              {comment.author === "sender" && (
                <>
                  <div className="flex-1 rounded-lg rounded-tr-none bg-primary p-2 sm:p-3 text-xs sm:text-sm text-primary-foreground">
                    <p>{comment.text}</p>
                  </div>
                  <Avatar className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </Avatar>
                </>
              )}
            </div>
          </div>
        ))}
      </ScrollArea>
      <div className="border-t border-border p-3 sm:p-4">
        <div className="flex items-center gap-2 rounded-lg bg-input px-3 py-2">
          <Input
            type="text"
            placeholder="Введите комментарий"
            className="flex-1 bg-transparent text-sm border-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );

  const commentButtonNode = (
    <Button
      size="sm"
      variant="ghost"
      className="flex flex-col items-center h-auto py-2.5 sm:p-1.5 gap-1.5 sm:gap-1 rounded-xl sm:rounded-md active:bg-muted"
      onClick={
        isMobile
          ? undefined
          : () => setIsDesktopCommentsVisible(!isDesktopCommentsVisible)
      }
      aria-label={
        isMobile
          ? "Открыть комментарии"
          : isDesktopCommentsVisible
            ? "Скрыть комментарии"
            : "Показать комментарии"
      }
    >
      <MessageCircle className="h-6 w-6 sm:h-5 sm:w-5" />
      <span className="text-sm sm:text-xs font-medium">Чат</span>
    </Button>
  );

  return (
    <div
      className="max-h-screen h-screen bg-white text-foreground "
      style={{
        backgroundImage:
          "radial-gradient(circle, #e5e5e5 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    >
      <div
        className={`grid ${isMobile || !isDesktopCommentsVisible ? "grid-cols-1" : "md:grid-cols-[1fr_auto]"} w-full h-full`}
      >
        <div className="grid grid-rows-[auto_1fr] max-h-screen w-full md:max-w-4xl mx-auto h-full">
          <div className="flex items-center justify-between p-3 sm:p-4 bg-card md:bg-transparent border-b border-border md:border-b-0">
            <div className="flex items-center gap-2">
              <Link
                to="/share/deals/$dealId"
                params={{ dealId: dealId }}
                className="flex items-center gap-2"
              >
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <CompanyLogo />
              <span className="font-medium text-sm sm:text-base text-foreground">
                {document.receiverName || "Клиент"}
              </span>
            </div>
          </div>
          <div className="bg-card md:rounded-lg md:border w-full lg:aspect-[9/16] md:border-border md:shadow-xl lg:h-[calc(100vh-12rem)] overflow-hidden">
            <div className="h-full w-full flex flex-col items-center justify-center">
              {pdfUrl && (
                <PdfViewer
                  url={pdfUrl}
                  className="h-full w-full pb-20 md:pb-0"
                  mode="full"
                />
              )}
            </div>
          </div>
        </div>

        {/* Desktop Toggleable Comments Sidebar */}
        {!isMobile && isDesktopCommentsVisible && (
          <div className="w-full md:w-72 md:h-screen border-t md:border-t-0 md:border-l border-border bg-card flex flex-col">
            <CommentsSectionContent />
          </div>
        )}
      </div>

      {/* Persistent Bottom Pill Navbar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-3 px-6 bg-transparent z-50 safe-area-inset-bottom">
        <div className="max-w-sm sm:max-w-xs mx-auto justify-around items-center bg-card/95 backdrop-blur-sm p-2.5 sm:p-2 grid grid-cols-3 gap-3 sm:gap-2 rounded-2xl sm:rounded-lg shadow-xl border border-border/50">
          {isMobile ? (
            <Sheet>
              <SheetTrigger asChild>{commentButtonNode}</SheetTrigger>
              <SheetContent
                side="bottom"
                className="bg-card p-0 h-[70vh] flex flex-col border-t rounded-t-2xl"
              >
                <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mt-3 mb-1" />
                <CommentsSectionContent />
              </SheetContent>
            </Sheet>
          ) : (
            commentButtonNode
          )}
          <Button
            size="sm"
            variant="ghost"
            className="flex flex-col gap-1.5 sm:gap-1 items-center h-auto py-2.5 sm:p-1.5 rounded-xl sm:rounded-md active:bg-muted"
            onClick={handleDownload}
          >
            <Download className="h-6 w-6 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-xs font-medium">Скачать</span>
          </Button>
          {isMobile ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex flex-col gap-1.5 sm:gap-1 items-center h-auto py-2.5 sm:p-1.5 rounded-xl sm:rounded-md relative active:bg-muted"
                >
                  <Signature className="h-6 w-6 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-xs font-medium">
                    Подписать
                  </span>
                  {signatures.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-primary text-primary-foreground text-xs font-medium rounded-full flex items-center justify-center shadow-sm">
                      {signatures.length}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="bg-card p-0 h-[85vh] flex flex-col border-t rounded-t-2xl"
              >
                <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mt-3 mb-1" />
                <ScrollArea className="flex-1">
                  <SignaturesSection
                    signatures={signatures}
                    isLoading={signaturesLoading}
                    onRefresh={fetchSignatures}
                  />
                  <div className="border-t">
                    <SignDocumentForm
                      onSign={handleSign}
                      isLoading={isSigningLoading}
                      error={signingError}
                      success={signingSuccess}
                    />
                  </div>
                  {/* Safe area padding for iOS home indicator */}
                  <div className="h-6 pb-safe" />
                </ScrollArea>
              </SheetContent>
            </Sheet>
          ) : (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex flex-col gap-1 items-center h-auto p-1.5 rounded-md relative"
                >
                  <Signature className="h-5 w-5" />
                  <span className="text-xs md:text-sm font-medium">
                    Подписать
                  </span>
                  {signatures.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                      {signatures.length}
                    </span>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card p-0 sm:max-w-[425px] max-h-[80vh] overflow-hidden flex flex-col">
                <ScrollArea className="flex-1">
                  <SignaturesSection
                    signatures={signatures}
                    isLoading={signaturesLoading}
                    onRefresh={fetchSignatures}
                  />
                  <div className="border-t">
                    <SignDocumentForm
                      onSign={handleSign}
                      isLoading={isSigningLoading}
                      error={signingError}
                      success={signingSuccess}
                    />
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
}

function DealDocumentPendingComponent() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  return (
    <div
      className="max-h-screen h-screen bg-white text-foreground "
      style={{
        backgroundImage:
          "radial-gradient(circle, #e5e5e5 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    >
      <div
        className={`grid ${isMobile ? "grid-cols-1" : "md:grid-cols-[1fr_auto]"} w-full h-full`}
      >
        <div className="grid grid-rows-[auto_1fr] max-h-screen w-full md:max-w-4xl mx-auto h-full">
          <div className="flex items-center justify-between p-3 sm:p-4 bg-card md:bg-transparent border-b border-border md:border-b-0">
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-10 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
          <div className="bg-card md:rounded-lg md:border w-full lg:aspect-[9/16] md:border-border md:shadow-xl lg:h-[calc(100vh-12rem)]">
            <div className="h-full w-full flex flex-col items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Persistent Bottom Pill Navbar Placeholder */}
      <div className="fixed bottom-0 left-0 right-0 p-3 px-6 bg-transparent z-50">
        <div className="max-w-xs mx-auto justify-around items-center bg-card/95 backdrop-blur-sm p-2 grid grid-cols-3 gap-2 rounded-lg shadow-xl border border-border/50">
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}
