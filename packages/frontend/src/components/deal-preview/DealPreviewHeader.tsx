import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";



interface DealPreviewHeaderProps {
  deal: Deal;
}

function getStatusVariant(
  status: string
): "default" | "success" | "error" | "warning" | "neutral" {
  switch (status) {
    case "active":
      return "success";
    case "completed":
      return "neutral";
    case "cancelled":
      return "error";
    case "draft":
      return "warning";
    default:
      return "default";
  }
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: "Активна",
    completed: "Завершена",
    cancelled: "Отменена",
    draft: "Черновик",
  };
  return labels[status] || status;
}

function getDealTypeLabel(dealType: string): string {
  const labels: Record<string, string> = {
    service: "Услуга",
    product: "Товар",
  };
  return labels[dealType] || dealType;
}

interface Deal {
  id: string;
  title?: string | null;
  receiverBin: string;
  dealType: "service" | "product";
  status: "draft" | "active" | "completed" | "cancelled";
  documentsFlutter: any[];
}

export function DealPreviewHeader({ deal }: DealPreviewHeaderProps) {
  const orgName = deal.documentsFlutter?.[0].fields.orgName?.trim();
  const receiverName = deal.documentsFlutter?.[0].fields.buyerName?.trim();
  console.log(deal)

  const headerTitle =
    orgName && receiverName
      ? `Сделка от ${orgName} для ${receiverName}`
      : "Сделка";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{headerTitle}</h1>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-12 sm:ml-0">
        <Badge variant={getStatusVariant(deal.status)}>
          {getStatusLabel(deal.status)}
        </Badge>
        <Badge variant="neutral">{getDealTypeLabel(deal.dealType)}</Badge>
      </div>
    </div>
  );
}
