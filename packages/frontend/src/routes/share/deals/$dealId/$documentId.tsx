import { getDealDocument } from "@/lib/api";
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
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Document, Page, pdfjs } from "react-pdf";

import { useMediaQuery } from "@/hooks/use-media-query";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/share/deals/$dealId/$documentId")({
  component: DealDocumentPageComponent,
  pendingComponent: DealDocumentPendingComponent,

  loader: async ({ params }) => {
    const document = await getDealDocument(params.dealId, params.documentId);
    console.log(document);
    const pathForSupabase = document.filePath;

    let pdfUrl = null;
    let pdfError = null;

    try {
      const { data: urlData } = await supabase.storage
        .from("documents")
        .getPublicUrl(pathForSupabase);
      console.log(urlData);

      if (urlData?.publicUrl) {
        pdfUrl = urlData.publicUrl;
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

    console.log(pdfUrl);
    return {
      document,
      pdfUrl,
      pdfError,
    };
  },
});

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

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
  const { dealId } = Route.useParams();
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
      className="flex flex-col items-center h-auto p-1.5 gap-1 rounded-md"
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
      <MessageCircle className="h-5 w-5" />
      <span className="text-xs md:text-sm font-medium">Чат</span>
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
                {data.clientName || document.receiverName || "Клиент"}
              </span>
            </div>
          </div>
          <div className="bg-card md:rounded-lg md:border w-full lg:aspect-[9/16] md:border-border md:shadow-xl lg:h-[calc(100vh-12rem)] overflow-hidden">
            <div className="h-full w-full flex flex-col items-center justify-center">
              {pdfUrl && (
                <Document
                  file={pdfUrl}
                  onLoadSuccess={({ numPages: nextNumPages }) => {
                    setNumPages(nextNumPages);
                    setLoadingPdf(false);
                  }}
                  onLoadError={(error) => {
                    console.error("Error loading PDF document:", error);
                    setLoadingPdf(false);
                  }}
                  loading={<Skeleton className="h-screen w-full" />}
                  error={
                    <p className="text-destructive-foreground">
                      Не удалось загрузить PDF.
                    </p>
                  }
                  className="h-full w-full flex flex-col items-center pb-20 sm:pb-0"
                >
                  <ScrollArea className="h-full w-full flex flex-col items-center">
                    {Array.from(new Array(numPages || 0), (el, index) => (
                      <Page
                        key={`page_${index + 1}`}
                        pageNumber={index + 1}
                        width={Math.min(
                          800,
                          typeof window !== "undefined"
                            ? window.innerWidth
                            : 800
                        )}
                        renderAnnotationLayer={false}
                        renderTextLayer={false}
                      />
                    ))}
                  </ScrollArea>
                </Document>
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
      <div className="fixed bottom-0 left-0 right-0 p-3 px-6 bg-transparent z-50">
        <div className="max-w-xs mx-auto  justify-around items-center bg-card/95 backdrop-blur-sm p-2 grid grid-cols-3 gap-2 rounded-lg shadow-xl border border-border/50">
          {isMobile ? (
            <Sheet>
              <SheetTrigger asChild>{commentButtonNode}</SheetTrigger>
              <SheetContent
                side="bottom"
                className="bg-card p-0 h-[70vh] flex flex-col border-t"
              >
                <CommentsSectionContent />
              </SheetContent>
            </Sheet>
          ) : (
            commentButtonNode // Desktop: Just the button, Sheet context is not needed here
          )}
          <Button
            size="sm"
            variant="ghost"
            className="flex flex-col gap-1 items-center h-auto p-1.5 rounded-md"
            onClick={handleDownload}
          >
            <Download className="h-5 w-5" />
            <span className="text-xs md:text-sm font-medium">Скачать</span>
          </Button>
          {isMobile ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex flex-col gap-1 items-center h-auto p-1.5 rounded-md"
                  onClick={() => {}}
                >
                  <Signature className="h-5 w-5" />
                  <span className="text-xs md:text-sm font-medium">
                    Подписать
                  </span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="bg-card p-0 h-[70vh] flex flex-col border-t"
              >
                asdf
              </SheetContent>
            </Sheet>
          ) : (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex flex-col gap-1 items-center h-auto p-1.5 rounded-md"
                  onClick={() => {}}
                >
                  <Signature className="h-5 w-5" />
                  <span className="text-xs md:text-sm font-medium">
                    Подписать
                  </span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card p-4 sm:max-w-[425px]">
                asdf
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
