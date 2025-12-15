import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { Link } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface DocumentFlutter {
  id: string;
  filePath?: string | null;
  type?: string | null;
  receiverName?: string | null;
}

interface DocumentsSectionProps {
  documents: DocumentFlutter[];
  dealId: string;
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

      // Use filePath directly as URL (it's already a full Supabase public URL)
      const imageExtensions = /\.(jpeg|jpg|gif|png|webp)$/i;
      const isImg = imageExtensions.test(doc.filePath);
      setIsImageFile(isImg);

      if (isImg) {
        // Use the filePath directly as the preview URL
        setPreviewUrl(doc.filePath);
      } else {
        setPreviewUrl(null);
      }

      setIsLoading(false);
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

export function DocumentsSection({
  documents,
  dealId,
}: DocumentsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Документы</CardTitle>
        <CardDescription>
          {documents.length === 0
            ? "Нет документов"
            : `${documents.length} ${
                documents.length === 1
                  ? "документ"
                  : documents.length < 5
                    ? "документа"
                    : "документов"
              }`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {documents.length > 0 ? (
          <AnimatedGroup
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            preset="scale"
          >
            {documents.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} dealId={dealId} />
            ))}
          </AnimatedGroup>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            Документы для этой сделки не найдены
          </p>
        )}
      </CardContent>
    </Card>
  );
}
