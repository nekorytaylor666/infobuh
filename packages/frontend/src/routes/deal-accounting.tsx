import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
    useCurrencies,
    useAccounts,
    useDeals,
    useDealBalance,
    useDealReconciliation,
    useCreateDeal,
    useRecordPayment,
    useGenerateDocument,
    type Deal,
    type CreateDealRequest,
    type RecordPaymentRequest,
    type BalanceResponse,
    type ReconciliationReport
} from '@/hooks/use-deal-accounting'

export const Route = createFileRoute('/deal-accounting')({
    component: RouteComponent,
})

// For demo purposes, we'll use a hardcoded legal entity ID
// In a real app, this would come from user context/authentication
const DEMO_LEGAL_ENTITY_ID = "2cc7dc33-f82a-4248-b969-f1d7902250ce"

function RouteComponent() {
    const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)

    // TanStack Query hooks
    const { data: currencies = [], isLoading: currenciesLoading } = useCurrencies()
    const { data: accounts = [], isLoading: accountsLoading } = useAccounts(DEMO_LEGAL_ENTITY_ID)
    const { data: deals = [], isLoading: dealsLoading, refetch: refetchDeals } = useDeals(DEMO_LEGAL_ENTITY_ID)
    const { data: balanceInfo, isLoading: balanceLoading } = useDealBalance(selectedDeal?.id || '')
    const { data: reconciliationReport, isLoading: reconciliationLoading } = useDealReconciliation(selectedDeal?.id || '')

    // Mutations
    const createDealMutation = useCreateDeal(DEMO_LEGAL_ENTITY_ID)
    const recordPaymentMutation = useRecordPayment(DEMO_LEGAL_ENTITY_ID)
    const generateDocumentMutation = useGenerateDocument()

    const loadingData = currenciesLoading || accountsLoading

    // Create Deal Form State
    const [dealForm, setDealForm] = useState<Omit<CreateDealRequest, 'totalAmount'> & { totalAmount: string; counterpartyName: string }>({
        dealType: 'service',
        counterpartyName: '',
        receiverBin: '',
        title: '',
        totalAmount: '',
        description: '',
        currencyId: '',
        accountsReceivableId: '',
        revenueAccountId: ''
    })

    // Payment Form State  
    const [paymentForm, setPaymentForm] = useState<Omit<RecordPaymentRequest, 'amount' | 'currencyId' | 'cashAccountId' | 'accountsReceivableId'> & { amount: string }>({
        amount: '',
        description: '',
        reference: ''
    })

    // Auto-select defaults when data loads
    useEffect(() => {
        if (currencies.length > 0 && accounts.length > 0 && !dealForm.currencyId) {
            const kztCurrency = currencies.find(c => c.code === 'KZT')
            const receivableAccount = accounts.find(a => a.code === '1121')
            const revenueAccount = accounts.find(a => a.code === '4110')

            if (kztCurrency && receivableAccount && revenueAccount) {
                setDealForm(prev => ({
                    ...prev,
                    currencyId: kztCurrency.id,
                    accountsReceivableId: receivableAccount.id,
                    revenueAccountId: revenueAccount.id
                }))
            }
        }
    }, [currencies, accounts, dealForm.currencyId])

    const handleCreateDeal = () => {
        if (!dealForm.receiverBin || !dealForm.title || !dealForm.totalAmount || !dealForm.currencyId || !dealForm.accountsReceivableId || !dealForm.revenueAccountId) {
            return // Validation will be shown by the UI
        }

        createDealMutation.mutate({
            receiverBin: dealForm.receiverBin,
            title: dealForm.title,
            description: dealForm.description,
            dealType: dealForm.dealType,
            totalAmount: parseFloat(dealForm.totalAmount),
            currencyId: dealForm.currencyId,
            accountsReceivableId: dealForm.accountsReceivableId,
            revenueAccountId: dealForm.revenueAccountId
        }, {
            onSuccess: () => {
                // Reset form
                setDealForm({
                    dealType: 'service',
                    counterpartyName: '',
                    receiverBin: '',
                    title: '',
                    totalAmount: '',
                    description: '',
                    currencyId: '',
                    accountsReceivableId: '',
                    revenueAccountId: ''
                })

                // Auto-select defaults again
                const kztCurrency = currencies.find(c => c.code === 'KZT')
                const receivableAccount = accounts.find(a => a.code === '1121')
                const revenueAccount = accounts.find(a => a.code === '4110')

                if (kztCurrency && receivableAccount && revenueAccount) {
                    setDealForm(prev => ({
                        ...prev,
                        currencyId: kztCurrency.id,
                        accountsReceivableId: receivableAccount.id,
                        revenueAccountId: revenueAccount.id
                    }))
                }
            }
        })
    }

    const handleRecordPayment = () => {
        if (!selectedDeal || !paymentForm.amount) {
            return // Validation handled by UI
        }

        // Need to get required IDs for payment
        const kztCurrency = currencies.find(c => c.code === 'KZT')
        const cashAccount = accounts.find(a => a.code === '1112') // Bank account
        const receivableAccount = accounts.find(a => a.code === '1121')

        if (!kztCurrency || !cashAccount || !receivableAccount) {
            return // Can't proceed without required accounts
        }

        recordPaymentMutation.mutate({
            dealId: selectedDeal.id,
            amount: parseFloat(paymentForm.amount),
            description: paymentForm.description || `Оплата по сделке ${selectedDeal.title || selectedDeal.receiverBin}`,
            reference: paymentForm.reference,
            currencyId: kztCurrency.id,
            cashAccountId: cashAccount.id,
            accountsReceivableId: receivableAccount.id
        }, {
            onSuccess: (data) => {
                setSelectedDeal(data.deal)
                setPaymentForm({ amount: '', description: '', reference: '' })
            }
        })
    }

    const handleGenerateDocument = (dealId: string) => {
        generateDocumentMutation.mutate(dealId)
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ru-KZ', {
            style: 'currency',
            currency: 'KZT'
        }).format(amount)
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'neutral' | 'error' | 'warning' | 'success'> = {
            draft: 'neutral',
            active: 'default',
            completed: 'success',
            cancelled: 'error'
        }

        const labels: Record<string, string> = {
            draft: 'Черновик',
            active: 'Активная',
            completed: 'Завершена',
            cancelled: 'Отменена'
        }

        return <Badge variant={variants[status] || 'neutral'}>{labels[status] || status}</Badge>
    }



    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Учет Сделок</h1>
                    <p className="text-muted-foreground">
                        Система учета сделок с автоматическим формированием проводок и документов
                    </p>
                </div>
            </div>

            <Tabs defaultValue="create" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="create">Создать Сделку</TabsTrigger>
                    <TabsTrigger value="deals">Список Сделок</TabsTrigger>
                    <TabsTrigger value="payments">Платежи</TabsTrigger>
                    <TabsTrigger value="balance">Баланс</TabsTrigger>
                    <TabsTrigger value="reconciliation">Сверка</TabsTrigger>
                </TabsList>

                <TabsContent value="create">
                    <Card>
                        <CardHeader>
                            <CardTitle>Создание Новой Сделки</CardTitle>
                            <CardDescription>
                                Создайте сделку с автоматическим формированием бухгалтерских проводок
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="dealType">Тип Сделки</Label>
                                    <select
                                        id="dealType"
                                        value={dealForm.dealType}
                                        onChange={(e) => setDealForm(prev => ({ ...prev, dealType: e.target.value as 'service' | 'product' }))}
                                        className="w-full p-2 border rounded-md"
                                    >
                                        <option value="service">Услуга (АВР)</option>
                                        <option value="product">Товар (Накладная)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="totalAmount">Сумма *</Label>
                                    <Input
                                        id="totalAmount"
                                        type="number"
                                        placeholder="100000"
                                        value={dealForm.totalAmount}
                                        onChange={(e) => setDealForm(prev => ({ ...prev, totalAmount: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Название сделки *</Label>
                                    <Input
                                        id="title"
                                        placeholder="Консультационные услуги"
                                        value={dealForm.title}
                                        onChange={(e) => setDealForm(prev => ({ ...prev, title: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="receiverBin">БИН контрагента *</Label>
                                    <Input
                                        id="receiverBin"
                                        placeholder="123456789012"
                                        maxLength={12}
                                        value={dealForm.receiverBin}
                                        onChange={(e) => setDealForm(prev => ({ ...prev, receiverBin: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="counterpartyName">Название контрагента (для отображения)</Label>
                                <Input
                                    id="counterpartyName"
                                    placeholder="ТОО Рога и Копыта"
                                    value={dealForm.counterpartyName}
                                    onChange={(e) => setDealForm(prev => ({ ...prev, counterpartyName: e.target.value }))}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="currencyId">Валюта *</Label>
                                    <select
                                        id="currencyId"
                                        value={dealForm.currencyId}
                                        onChange={(e) => setDealForm(prev => ({ ...prev, currencyId: e.target.value }))}
                                        className="w-full p-2 border rounded-md"
                                        disabled={loadingData}
                                    >
                                        <option value="">Выберите валюту</option>
                                        {currencies.map(currency => (
                                            <option key={currency.id} value={currency.id}>
                                                {currency.code} - {currency.name} {currency.symbol || ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="accountsReceivableId">Счет дебиторской задолженности *</Label>
                                    <select
                                        id="accountsReceivableId"
                                        value={dealForm.accountsReceivableId}
                                        onChange={(e) => setDealForm(prev => ({ ...prev, accountsReceivableId: e.target.value }))}
                                        className="w-full p-2 border rounded-md"
                                        disabled={loadingData}
                                    >
                                        <option value="">Выберите счет</option>
                                        {accounts.filter(acc => acc.accountType === 'asset').map(account => (
                                            <option key={account.id} value={account.id}>
                                                {account.code} - {account.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="revenueAccountId">Счет доходов *</Label>
                                    <select
                                        id="revenueAccountId"
                                        value={dealForm.revenueAccountId}
                                        onChange={(e) => setDealForm(prev => ({ ...prev, revenueAccountId: e.target.value }))}
                                        className="w-full p-2 border rounded-md"
                                        disabled={loadingData}
                                    >
                                        <option value="">Выберите счет</option>
                                        {accounts.filter(acc => acc.accountType === 'revenue').map(account => (
                                            <option key={account.id} value={account.id}>
                                                {account.code} - {account.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Описание (опционально)</Label>
                                <Input
                                    id="description"
                                    placeholder="Описание услуги или товара"
                                    value={dealForm.description}
                                    onChange={(e) => setDealForm(prev => ({ ...prev, description: e.target.value }))}
                                />
                            </div>

                            <Button onClick={handleCreateDeal} disabled={createDealMutation.isPending || loadingData} className="w-full">
                                {loadingData ? 'Загружаем данные...' : createDealMutation.isPending ? 'Создание...' : 'Создать Сделку'}
                            </Button>

                            <div className="text-sm text-muted-foreground space-y-1">
                                <p><strong>Автоматические проводки:</strong></p>
                                <p>• Дебет: 1121 (Торговая дебиторская задолженность)</p>
                                <p>• Кредит: 4110 (Доходы от реализации товаров, работ, услуг)</p>
                                <p><strong>Документы:</strong> {dealForm.dealType === 'service' ? 'АВР' : 'Накладная'}</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="deals">
                    <Card>
                        <CardHeader>
                            <CardTitle>Список Сделок</CardTitle>
                            <CardDescription>Все созданные сделки в системе</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {dealsLoading ? (
                                <p className="text-center text-muted-foreground py-8">
                                    Загружаем сделки...
                                </p>
                            ) : deals.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    Нет созданных сделок. Создайте первую сделку во вкладке "Создать Сделку"
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {deals.map((deal) => (
                                        <div
                                            key={deal.id}
                                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedDeal?.id === deal.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                                                }`}
                                            onClick={() => setSelectedDeal(deal)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-medium">{deal.title || deal.receiverBin}</h3>
                                                        {getStatusBadge(deal.status)}
                                                        <Badge variant="neutral">
                                                            {deal.dealType === 'service' ? 'Услуга' : 'Товар'}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Создано: {new Date(deal.createdAt).toLocaleString('ru-KZ')}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium">{formatCurrency(deal.totalAmount)}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Оплачено: {formatCurrency(deal.paidAmount)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payments">
                    <Card>
                        <CardHeader>
                            <CardTitle>Запись Платежей</CardTitle>
                            <CardDescription>
                                Записывайте поступления платежей по сделкам
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!selectedDeal ? (
                                <p className="text-center text-muted-foreground py-8">
                                    Выберите сделку в списке сделок для записи платежа
                                </p>
                            ) : (
                                <>
                                    <div className="p-4 border rounded-lg bg-muted/50">
                                        <h3 className="font-medium mb-2">Выбранная сделка:</h3>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p>{selectedDeal.title || selectedDeal.receiverBin}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {selectedDeal.dealType === 'service' ? 'Услуга' : 'Товар'} • {selectedDeal.receiverBin}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p>Сумма: {formatCurrency(selectedDeal.totalAmount)}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Остаток: {formatCurrency(selectedDeal.totalAmount - selectedDeal.paidAmount)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="paymentAmount">Сумма Платежа</Label>
                                            <Input
                                                id="paymentAmount"
                                                type="number"
                                                placeholder="50000"
                                                value={paymentForm.amount}
                                                onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="paymentDescription">Описание</Label>
                                            <Input
                                                id="paymentDescription"
                                                placeholder="Частичная оплата"
                                                value={paymentForm.description}
                                                onChange={(e) => setPaymentForm(prev => ({ ...prev, description: e.target.value }))}
                                            />
                                        </div>
                                    </div>

                                    <Button onClick={handleRecordPayment} disabled={recordPaymentMutation.isPending} className="w-full">
                                        {recordPaymentMutation.isPending ? 'Записываем...' : 'Записать Платеж'}
                                    </Button>

                                    <div className="text-sm text-muted-foreground space-y-1">
                                        <p><strong>Автоматические проводки при платеже:</strong></p>
                                        <p>• Дебет: 1112 (Банковские счета в тенге)</p>
                                        <p>• Кредит: 1121 (Торговая дебиторская задолженность)</p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="balance">
                    <Card>
                        <CardHeader>
                            <CardTitle>Баланс Сделки</CardTitle>
                            <CardDescription>
                                Детальная информация о балансе выбранной сделки
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!selectedDeal ? (
                                <p className="text-center text-muted-foreground py-8">
                                    Выберите сделку в списке для просмотра баланса
                                </p>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-medium">Сделка: {selectedDeal.title || selectedDeal.receiverBin}</h3>
                                        <Button onClick={() => refetchDeals()} disabled={balanceLoading}>
                                            {balanceLoading ? 'Обновляем...' : 'Обновить Баланс'}
                                        </Button>
                                    </div>

                                    {balanceInfo && (
                                        <>
                                            <div className="grid grid-cols-3 gap-4">
                                                <Card>
                                                    <CardContent className="pt-6">
                                                        <div className="text-center">
                                                            <p className="text-sm text-muted-foreground">Общая Сумма</p>
                                                            <p className="text-2xl font-bold">{formatCurrency(balanceInfo.totalAmount)}</p>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                                <Card>
                                                    <CardContent className="pt-6">
                                                        <div className="text-center">
                                                            <p className="text-sm text-muted-foreground">Оплачено</p>
                                                            <p className="text-2xl font-bold text-green-600">{formatCurrency(balanceInfo.paidAmount)}</p>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                                <Card>
                                                    <CardContent className="pt-6">
                                                        <div className="text-center">
                                                            <p className="text-sm text-muted-foreground">Остаток</p>
                                                            <p className={`text-2xl font-bold ${balanceInfo.remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                                {formatCurrency(balanceInfo.remainingBalance)}
                                                            </p>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>

                                            <div className="flex items-center justify-center">
                                                <Badge variant={balanceInfo.remainingBalance <= 0 ? 'success' : 'error'} className="text-lg px-4 py-2">
                                                    {balanceInfo.remainingBalance <= 0 ? '✅ Полностью Оплачено' : '⏳ Ожидает Оплаты'}
                                                </Badge>
                                            </div>

                                            <Separator />

                                            <div className="space-y-4">
                                                <h4 className="font-medium">Бухгалтерские Проводки:</h4>
                                                <div className="space-y-2">
                                                    {balanceInfo.journalEntries.map((entry) => (
                                                        <div key={entry.id} className="p-3 border rounded-lg">
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <p className="font-medium">
                                                                        {entry.entryType}
                                                                    </p>
                                                                    <p className="text-sm text-muted-foreground">Статус: {entry.status}</p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {new Date(entry.entryDate).toLocaleString('ru-KZ')}
                                                                    </p>
                                                                </div>
                                                                <p className="font-bold">{formatCurrency(entry.amount)}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="reconciliation">
                    <Card>
                        <CardHeader>
                            <CardTitle>Сверка Сделки</CardTitle>
                            <CardDescription>
                                Отчет о сверке платежей и выявлении расхождений
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!selectedDeal ? (
                                <p className="text-center text-muted-foreground py-8">
                                    Выберите сделку в списке для генерации отчета о сверке
                                </p>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-medium">Сделка: {selectedDeal.title || selectedDeal.receiverBin}</h3>
                                        <div className="space-x-2">
                                            <Button onClick={() => {/* This will auto-load when deal is selected */ }} disabled={reconciliationLoading}>
                                                {reconciliationLoading ? 'Генерируем...' : 'Сгенерировать Сверку'}
                                            </Button>
                                            <Button onClick={() => handleGenerateDocument(selectedDeal.id)} disabled={generateDocumentMutation.isPending} variant="outline">
                                                {generateDocumentMutation.isPending ? 'Генерируем...' : 'Сгенерировать Документ'}
                                            </Button>
                                        </div>
                                    </div>

                                    {reconciliationReport && (
                                        <>
                                            <div className="grid grid-cols-4 gap-4">
                                                <Card>
                                                    <CardContent className="pt-6">
                                                        <div className="text-center">
                                                            <p className="text-sm text-muted-foreground">Сумма Сделки</p>
                                                            <p className="text-xl font-bold">{formatCurrency(reconciliationReport.totalAmount)}</p>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                                <Card>
                                                    <CardContent className="pt-6">
                                                        <div className="text-center">
                                                            <p className="text-sm text-muted-foreground">Получено</p>
                                                            <p className="text-xl font-bold">{formatCurrency(reconciliationReport.paidAmount)}</p>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                                <Card>
                                                    <CardContent className="pt-6">
                                                        <div className="text-center">
                                                            <p className="text-sm text-muted-foreground">Остаток</p>
                                                            <p className={`text-xl font-bold ${reconciliationReport.remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                                {formatCurrency(reconciliationReport.remainingBalance)}
                                                            </p>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                                <Card>
                                                    <CardContent className="pt-6">
                                                        <div className="text-center">
                                                            <p className="text-sm text-muted-foreground">Статус</p>
                                                            <div className="mt-2">
                                                                <Badge variant={reconciliationReport.isBalanced ? 'success' : 'error'}>
                                                                    {reconciliationReport.isBalanced ? 'Сбалансировано' : 'Не сбалансировано'}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>

                                            {reconciliationReport.discrepancies.length > 0 && (
                                                <>
                                                    <Separator />
                                                    <div className="space-y-4">
                                                        <h4 className="font-medium text-red-600">⚠️ Обнаруженные расхождения:</h4>
                                                        <div className="space-y-2">
                                                            {reconciliationReport.discrepancies.map((discrepancy, index) => (
                                                                <div key={index} className="p-3 border border-red-200 rounded-lg bg-red-50">
                                                                    <div className="flex items-center justify-between">
                                                                        <div>
                                                                            <p className="font-medium">
                                                                                {discrepancy.type}
                                                                            </p>
                                                                            <p className="text-sm text-muted-foreground">{discrepancy.description}</p>
                                                                        </div>
                                                                        <p className="font-bold text-red-600">{formatCurrency(discrepancy.amount)}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            <Separator />

                                            <div className="space-y-4">
                                                <h4 className="font-medium">Все Проводки по Сделке:</h4>
                                                <div className="space-y-2">
                                                    {reconciliationReport.journalEntries.map((entry) => (
                                                        <div key={entry.id} className="p-3 border rounded-lg">
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <p className="font-medium">
                                                                        {entry.entryNumber} - {entry.entryType}
                                                                    </p>
                                                                    <p className="text-sm text-muted-foreground">Статус: {entry.status}</p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {new Date(entry.entryDate).toLocaleString('ru-KZ')}
                                                                    </p>
                                                                </div>
                                                                <p className="font-bold">{formatCurrency(entry.amount)}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
