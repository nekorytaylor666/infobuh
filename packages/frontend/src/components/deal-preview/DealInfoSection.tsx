import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Deal {
  id: string;
  title?: string | null;
  description?: string | null;
  dealType: "service" | "product";
  status: "draft" | "active" | "completed" | "cancelled";
  totalAmount: number;
  paidAmount: number;
  receiverBin: string;
  createdAt: string;
  updatedAt: string;
}

interface DealInfoSectionProps {
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ru-KZ", {
    style: "currency",
    currency: "KZT",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function DealInfoSection({ deal }: DealInfoSectionProps) {
  const remainingBalance = deal.totalAmount - deal.paidAmount;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Информация о Сделке</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground">Название</Label>
            <p className="font-medium mt-1">{deal.title || "—"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Тип</Label>
            <p className="font-medium mt-1">{getDealTypeLabel(deal.dealType)}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">БИН Контрагента</Label>
            <p className="font-medium mt-1">{deal.receiverBin}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Статус</Label>
            <div className="mt-1">
              <Badge variant={getStatusVariant(deal.status)}>
                {getStatusLabel(deal.status)}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label className="text-muted-foreground">Общая Сумма</Label>
            <p className="text-xl font-bold mt-1">
              {formatCurrency(deal.totalAmount)}
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground">Оплачено</Label>
            <p className="text-xl font-bold text-green-600 mt-1">
              {formatCurrency(deal.paidAmount)}
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground">Остаток</Label>
            <p
              className={`text-xl font-bold mt-1 ${
                remainingBalance > 0 ? "text-red-600" : "text-green-600"
              }`}
            >
              {formatCurrency(remainingBalance)}
            </p>
          </div>
        </div>

        {deal.description && (
          <>
            <Separator />
            <div>
              <Label className="text-muted-foreground">Описание</Label>
              <p className="text-sm mt-1 leading-relaxed">{deal.description}</p>
            </div>
          </>
        )}

        <Separator />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <Label className="text-muted-foreground">Создано</Label>
            <p className="mt-1">
              {new Date(deal.createdAt).toLocaleString("ru-KZ", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground">Обновлено</Label>
            <p className="mt-1">
              {new Date(deal.updatedAt).toLocaleString("ru-KZ", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
