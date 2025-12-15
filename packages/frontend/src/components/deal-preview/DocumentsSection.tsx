import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { Link } from "@tanstack/react-router";
import React, { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

interface DocumentFlutter {
  id: string;
  filePath?: string | null;
  type?: string | null;
  receiverName?: string | null;
}

type Signature = {
  signedAt?: string | null;
  signer?: { name?: string | null } | null;
  legalEntity?: { name?: string | null } | null;
};

interface DocumentsSectionProps {
  documents: DocumentFlutter[];
  dealId: string;
  legalEntityId: string; // добавь
}

interface DocumentCardProps {
  doc: DocumentFlutter;
  dealId: string;
  legalEntityId: string;
}

function buildSignatureLabel(signatures: Signature[]) {
  if (!signatures || signatures.length === 0) return "Не подписано";

  // Считаем, что legalEntity.name в сигнатуре это кто подписал (у тебя в with: { signer, legalEntity })
  // Если нужно именно "ТОО Заказчик", бери legalEntity.name или signer.name в зависимости от твоей модели.
  const uniq = Array.from(
    new Set(
      signatures
        .map((s) => s?.legalEntity?.name || s?.signer?.name)
        .filter(Boolean) as string[]
    )
  );

  if (uniq.length === 0) return "Подписано";
  if (uniq.length === 1) return `Подписано: ${uniq[0]}`;
  return `Подписано: ${uniq[0]} +${uniq.length - 1}`;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ doc, dealId, legalEntityId }) => {
  const [signatureLabel, setSignatureLabel] = useState<string>("Загрузка подписей...");
  const [signatureOk, setSignatureOk] = useState<boolean>(false);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const res = ''


        const signatures = (res.data || []) as Signature[];
        const label = buildSignatureLabel(signatures);

        if (!alive) return;
        setSignatureLabel(label);
        setSignatureOk(signatures.length > 0);
      } catch (e) {
        if (!alive) return;
        setSignatureLabel("Подписи недоступны");
        setSignatureOk(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [doc.id, legalEntityId]);

  return (
    <Link
      to="/share/deals/$dealId/$documentId"
      params={{ dealId: dealId, documentId: doc.id }}
      className="block p-4 border rounded-lg shadow hover:shadow-md transition-shadow bg-card text-card-foreground flex flex-col h-full"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="font-semibold truncate text-lg">
          {doc.type || doc.filePath?.split("/").pop() || `Документ ${doc.id}`}
        </div>

        <Badge variant={signatureOk ? "success" : "neutral"} className="shrink-0">
          {signatureOk ? "Подписан" : "Без подписи"}
        </Badge>
      </div>

      <div className="mt-2 text-sm text-muted-foreground line-clamp-2">
        {signatureLabel}
      </div>

      <div className="mt-auto" />
    </Link>
  );
};

export function DocumentsSection({ documents, dealId, legalEntityId }: DocumentsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Документы</CardTitle>
        <CardDescription>
          {documents.length === 0
            ? "Нет документов"
            : `${documents.length} ${
                documents.length === 1 ? "документ" : documents.length < 5 ? "документа" : "документов"
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
              <DocumentCard
                key={doc.id}
                doc={doc}
                dealId={dealId}
                legalEntityId={legalEntityId}
              />
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
