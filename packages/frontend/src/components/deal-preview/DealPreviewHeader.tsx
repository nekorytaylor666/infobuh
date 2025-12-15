import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

interface Deal {
  id: string;
  title?: string | null;
  receiverBin: string;
  dealType: "service" | "product";
  status: "draft" | "active" | "completed" | "cancelled";
}

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

export function DealPreviewHeader({ deal }: DealPreviewHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {deal.title || "Сделка"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            БИН: {deal.receiverBin}
          </p>
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
