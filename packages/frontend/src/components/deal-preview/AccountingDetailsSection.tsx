import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface BalanceInfo {
  dealId: string;
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  journalEntries?: Array<{
    id: string;
    entryType: string;
    amount: number;
    entryDate: string;
    status: string;
  }>;
}

interface ReconciliationInfo {
  dealId: string;
  dealTitle: string;
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  isBalanced: boolean;
  discrepancies?: Array<{
    type: string;
    amount: number;
    description: string;
  }>;
}

interface TransactionInfo {
  dealId: string;
  dealTitle: string;
  totalAmount: number;
  paidAmount: number;
  transactions?: Array<{
    id: string;
    entryType: string;
    entryNumber: string;
    entryDate: string;
    description: string;
    status: string;
  }>;
}

interface AccountingDetailsSectionProps {
  balance: BalanceInfo | null;
  reconciliation: ReconciliationInfo | null;
  transactions: TransactionInfo | null;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ru-KZ", {
    style: "currency",
    currency: "KZT",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function AccountingDetailsSection({
  balance,
  reconciliation,
  transactions,
}: AccountingDetailsSectionProps) {
  if (!balance && !reconciliation && !transactions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Бухгалтерская Информация</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Бухгалтерская информация недоступна
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      {balance && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Общая Сумма</p>
                <p className="text-2xl font-bold mt-1">
                  {formatCurrency(balance.totalAmount)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Оплачено</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(balance.paidAmount)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Остаток</p>
                <p
                  className={`text-2xl font-bold mt-1 ${
                    balance.remainingBalance > 0
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {formatCurrency(balance.remainingBalance)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Journal Entries */}
      {balance?.journalEntries && balance.journalEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Бухгалтерские Проводки</CardTitle>
            <CardDescription>
              {balance.journalEntries.length} проводок
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {balance.journalEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{entry.entryType}</p>
                        <Badge variant="neutral" className="text-xs">
                          {entry.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(entry.entryDate).toLocaleString("ru-KZ", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <p className="font-bold text-lg">
                      {formatCurrency(entry.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reconciliation Summary */}
      {reconciliation && (
        <Card>
          <CardHeader>
            <CardTitle>Сверка</CardTitle>
            <CardDescription>
              {reconciliation.isBalanced
                ? "Сверка прошла успешно"
                : "Обнаружены расхождения"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Discrepancies Warning */}
            {reconciliation.discrepancies &&
              reconciliation.discrepancies.length > 0 && (
                <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-900 mb-2">
                        Обнаруженные расхождения
                      </h4>
                      <div className="space-y-2">
                        {reconciliation.discrepancies.map((disc, idx) => (
                          <div
                            key={idx}
                            className="p-2 bg-white border border-red-200 rounded"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-sm">{disc.type}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {disc.description}
                                </p>
                              </div>
                              <p className="font-bold text-red-600">
                                {formatCurrency(disc.amount)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
          </CardContent>
        </Card>
      )}

      {/* Transactions List */}
      {transactions?.transactions && transactions.transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>История Транзакций</CardTitle>
            <CardDescription>
              {transactions.transactions.length} транзакций
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {transactions.transactions.map((txn) => (
                <div
                  key={txn.id}
                  className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{txn.entryType}</p>
                        <Badge variant="neutral" className="text-xs">
                          {txn.entryNumber}
                        </Badge>
                        <Badge variant="neutral" className="text-xs">
                          {txn.status}
                        </Badge>
                      </div>
                      {txn.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {txn.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(txn.entryDate).toLocaleString("ru-KZ", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
