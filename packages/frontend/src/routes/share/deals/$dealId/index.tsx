import { getDeal } from "@/lib/api";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatedGroup } from "@/components/ui/animated-group";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
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
} from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/share/deals/$dealId/")({
  component: DealPageComponent,

  pendingComponent: DealPagePendingComponent,
  loader: async ({ params }) => {
    const deal = await getDeal(params.dealId);
    return deal;
  },
});

interface DocumentFlutter {
  id: string;
  filePath?: string;
  type?: string;
  receiverName?: string;
}

interface DealDealDocumentFlutterEntry {
  dealId: string;
  documentFlutterId: string;
  assignedAt: Date;
  documentFlutter: DocumentFlutter;
}

const mockComments = [
  { id: "1", author: "user1", text: "Hello!" },
  { id: "2", author: "user2", text: "Hi there!" },
];

function DealPageComponent() {
  const { dealId } = Route.useParams();
  const deal = Route.useLoaderData();

  const [isDesktopCommentsVisible, setIsDesktopCommentsVisible] =
    useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const documents: DocumentFlutter[] = Array.isArray(deal?.documentsFlutter)
    ? deal.documentsFlutter.filter((doc): doc is DocumentFlutter => !!doc)
    : [];
  console.log(documents);

  const CommentsSectionContent = () => (
    <>
      <div className="p-3 sm:p-4 text-sm md:text-base font-medium text-foreground border-b">
        Комментарии (Сделка)
      </div>
      <ScrollArea className="flex-1 px-4">
        {mockComments.map((comment) => (
          <div key={comment.id} className="mb-4 first:mt-4">
            <div className="mb-2 flex items-start gap-2">
              {comment.author === "user2" && (
                <div className="flex-1 rounded-lg rounded-tl-none bg-muted p-2 sm:p-3 text-xs sm:text-sm text-muted-foreground">
                  <p>{comment.text}</p>
                </div>
              )}
              {comment.author === "user1" && (
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
      className="max-h-screen h-screen bg-white text-foreground"
      style={{
        backgroundImage:
          "radial-gradient(circle, #e5e5e5 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    >
      <div className="relative h-full flex flex-col">
        <div className="flex items-center justify-between p-3 sm:p-4 bg-card md:bg-transparent border-b border-border md:border-b-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base sm:text-lg text-foreground">
              Сделка: {deal?.title || ""}
            </span>
          </div>
        </div>

        <div className="p-4 flex-grow overflow-y-auto pb-24">
          <h2 className="text-base font-semibold mb-3">Документы</h2>
          {documents.length > 0 ? (
            <AnimatedGroup
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              preset="scale"
            >
              {documents.map((doc: DocumentFlutter) => (
                <DocumentCard key={doc.id} doc={doc} dealId={dealId} />
              ))}
            </AnimatedGroup>
          ) : (
            <p>Документы для этой сделки не найдены.</p>
          )}
        </div>

        {!isMobile && isDesktopCommentsVisible && (
          <div className="fixed right-0 top-0 w-full md:w-72 h-screen border-t md:border-t-0 md:border-l border-border bg-card flex flex-col z-40">
            <CommentsSectionContent />
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 p-3 px-6 bg-transparent z-50">
          <div className="max-w-xs mx-auto justify-around items-center bg-card/95 backdrop-blur-sm p-2 grid grid-cols-3 gap-2 rounded-lg shadow-xl border border-border/50">
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
              commentButtonNode
            )}
            <Button
              size="sm"
              variant="ghost"
              className="flex flex-col gap-1 items-center h-auto p-1.5 rounded-md"
              disabled
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
                    disabled
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
                  Подписание документа (недоступно на этой странице)
                </SheetContent>
              </Sheet>
            ) : (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex flex-col gap-1 items-center h-auto p-1.5 rounded-md"
                    disabled
                  >
                    <Signature className="h-5 w-5" />
                    <span className="text-xs md:text-sm font-medium">
                      Подписать
                    </span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card p-4 sm:max-w-[425px]">
                  Подписание документа (недоступно на этой странице)
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DealPagePendingComponent() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  return (
    <div
      className="max-h-screen h-screen bg-white text-foreground"
      style={{
        backgroundImage:
          "radial-gradient(circle, #e5e5e5 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    >
      <div className="relative h-full flex flex-col">
        <div className="flex items-center justify-between p-3 sm:p-4 bg-card md:bg-transparent border-b border-border md:border-b-0">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-48" />
          </div>
        </div>

        <div className="p-4 flex-grow overflow-y-auto pb-24">
          <Skeleton className="h-6 w-32 mb-3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg shadow bg-card h-36"
              >
                <Skeleton className="h-6 w-3/4 mb-1" />
              </div>
            ))}
          </div>
        </div>

        {!isMobile && (
          <div className="fixed right-0 top-0 w-full md:w-72 h-screen border-t md:border-t-0 md:border-l border-border bg-card flex flex-col z-40">
            <div className="p-3 sm:p-4 text-sm md:text-base font-medium text-foreground border-b">
              <Skeleton className="h-5 w-3/4" />
            </div>
            <ScrollArea className="flex-1 px-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="mb-4 first:mt-4">
                  <div className="mb-2 flex items-start gap-2">
                    <Skeleton className="flex-1 h-10 rounded-lg" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                  </div>
                </div>
              ))}
            </ScrollArea>
            <div className="border-t border-border p-3 sm:p-4">
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 p-3 px-6 bg-transparent z-50">
          <div className="max-w-xs mx-auto justify-around items-center bg-card/95 backdrop-blur-sm p-2 grid grid-cols-3 gap-2 rounded-lg shadow-xl border border-border/50">
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface DocumentCardProps {
  doc: DocumentFlutter;
  dealId: string;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ doc, dealId }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImageFile, setIsImageFile] = useState(false);

  useEffect(() => {
    if (doc.filePath) {
      setIsLoading(true);
      const filePath = doc.filePath;
      const imageExtensions = /\.(jpeg|jpg|gif|png|webp)$/i;
      const isImg = imageExtensions.test(filePath);
      setIsImageFile(isImg);

      if (isImg) {
        try {
          const { data } = supabase.storage
            .from("documents")
            .getPublicUrl(filePath);

          if (data?.publicUrl) {
            setPreviewUrl(data.publicUrl);
          } else {
            setPreviewUrl(null);
          }
        } catch (e) {
          console.error("Error getting public URL for preview:", e);
          setPreviewUrl(null);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
        setPreviewUrl(null);
      }
    } else {
      setIsLoading(false);
      setPreviewUrl(null);
    }
  }, [doc.filePath]);

  return (
    <Link
      to="/share/deals/$dealId/$documentId"
      params={{ dealId: dealId, documentId: doc.id }}
      className="block p-4 border rounded-lg shadow hover:shadow-md transition-shadow bg-card text-card-foreground flex flex-col h-full"
    >
      <div className="mt-auto">
        <div className="font-semibold truncate text-lg mb-1">
          {doc.type || doc.filePath?.split("/").pop() || `Документ ${doc.id}`}
        </div>
      </div>
    </Link>
  );
};
