import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Deal {
  id: string;
  dealType: "service" | "product";
  status: "draft" | "active" | "completed" | "cancelled";
  receiverBin: string;
  totalAmount?: number | null;
  createdAt: string;
  updatedAt: string;
  documentsFlutter?: any[];
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

function fmtMoneyKzt(value: number) {
  return new Intl.NumberFormat("ru-KZ", {
    style: "currency",
    currency: "KZT",
    maximumFractionDigits: 0,
  }).format(value);
}

export function DealInfoSection({ deal }: DealInfoSectionProps) {
  const doc0 = deal.documentsFlutter?.[0];

  const orgName =
    doc0?.fields?.orgName?.trim() ?? doc0?.documentPayload?.data?.orgName?.trim();
  const orgBin =
    doc0?.fields?.orgBin?.trim() ?? doc0?.documentPayload?.data?.orgBin?.trim();

  const buyerName =
    doc0?.fields?.buyerName?.trim() ??
    doc0?.receiverName?.trim() ??
    doc0?.documentPayload?.data?.buyerName?.trim();

  const buyerBin =
    doc0?.fields?.buyerBin?.trim() ??
    doc0?.receiverBin?.trim() ??
    doc0?.documentPayload?.data?.buyerBin?.trim();

  const bankDoc =
    deal.documentsFlutter?.find(
      (d: any) => d?.fields?.selectedBank || d?.documentPayload?.data?.selectedBank
    ) ?? null;

  const selectedBank =
    bankDoc?.fields?.selectedBank ?? bankDoc?.documentPayload?.data?.selectedBank;

  const bankName = selectedBank?.name?.trim?.() ?? selectedBank?.name;
  const bankBik = selectedBank?.bik?.trim?.() ?? selectedBank?.bik;
  const bankAccount = selectedBank?.account?.trim?.() ?? selectedBank?.account;

  const itemsDoc =
    deal.documentsFlutter?.find(
      (d: any) =>
        Array.isArray(d?.fields?.items) ||
        Array.isArray(d?.documentPayload?.data?.items)
    ) ?? null;

  const items: any[] =
    itemsDoc?.fields?.items ?? itemsDoc?.documentPayload?.data?.items ?? [];

  const computedTotal = items.reduce((sum, it) => {
    const price = Number(it?.price ?? 0);
    const qty = Number(it?.quantity ?? 0);
    return sum + price * qty;
  }, 0);

  const total =
    typeof deal.totalAmount === "number" && !Number.isNaN(deal.totalAmount)
      ? deal.totalAmount
      : computedTotal;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Информация о Сделке</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground">Отправитель</Label>
            <p className="font-medium mt-1">{orgName || "—"}</p>
            <p className="text-sm text-muted-foreground mt-1">
              БИН: {orgBin || "—"}
            </p>
          </div>

          <div>
            <Label className="text-muted-foreground">Получатель</Label>
            <p className="font-medium mt-1">{buyerName || "—"}</p>
            <p className="text-sm text-muted-foreground mt-1">
              БИН: {buyerBin || deal.receiverBin || "—"}
            </p>
          </div>

          <div>
            <Label className="text-muted-foreground">Тип</Label>
            <p className="font-medium mt-1">{getDealTypeLabel(deal.dealType)}</p>
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

        <div>
          <Label className="text-muted-foreground">Реквизиты отправителя</Label>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-muted-foreground">Банк</Label>
              <p className="mt-1">{bankName || "—"}, {bankBik || "—"}</p>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-muted-foreground">Счет</Label>
              <p className="mt-1 font-medium">{bankAccount || "—"}</p>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <Label className="text-muted-foreground">Товары</Label>

          {items.length === 0 ? (
            <p className="text-sm mt-2 text-muted-foreground">Нет позиций</p>
          ) : (
            <div className="mt-2 space-y-2">
              <div className="grid grid-cols-10 gap-2 text-xs text-muted-foreground">
                <div className="col-span-4">Название</div>
                <div className="col-span-3 text-right">Кол-во</div>
                <div className="col-span-3 text-right">Сумма за одну</div>
              </div>

              {items.map((it, idx) => {
                const name = String(it?.name ?? "—");
                const qty = Number(it?.quantity ?? 0);
                const unit = String(it?.unit ?? "—");
                const price = Number(it?.price ?? 0);

                return (
                  <div key={idx} className="grid grid-cols-10 gap-2 text-sm">
                    <div className="col-span-4 font-medium truncate">{name}</div>
                    <div className="col-span-3 text-right">
                      {qty || "—"} {unit}
                    </div>
                    <div className="col-span-3 text-right">
                      {price ? fmtMoneyKzt(price) : "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Separator />

        <div className="flex items-center justify-between text-sm">
          <Label className="text-muted-foreground">Общая сумма</Label>
          <p className="font-semibold">{total ? fmtMoneyKzt(total) : "—"}</p>
        </div>

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
