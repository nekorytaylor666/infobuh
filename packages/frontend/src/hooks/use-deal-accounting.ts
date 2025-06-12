import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'

// Types based on backend schema
export interface Currency {
    id: string
    code: string
    name: string
    symbol?: string
    decimals: number
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export interface Account {
    id: string
    code: string
    name: string
    accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
    parentId?: string
    description?: string
    isActive: boolean
    legalEntityId: string
    createdAt: string
    updatedAt: string
}

export interface Deal {
    id: string
    receiverBin: string
    title: string | null
    description: string | null
    dealType: 'service' | 'product'
    totalAmount: number
    paidAmount: number
    status: 'draft' | 'active' | 'completed' | 'cancelled'
    legalEntityId: string
    createdAt: string
    updatedAt: string
}

export interface JournalEntry {
    id: string
    entryNumber: string
    description?: string
    status: string
    entryDate: string
    amount: number
}

export interface CreateDealRequest {
    receiverBin: string
    title: string
    description?: string
    dealType: 'service' | 'product'
    totalAmount: number
    currencyId: string
    accountsReceivableId: string
    revenueAccountId: string
}

export interface RecordPaymentRequest {
    amount: number
    description?: string
    reference?: string
    currencyId: string
    cashAccountId: string
    accountsReceivableId: string
}

export interface DealResponse {
    deal: Deal
    journalEntry: JournalEntry
    document?: {
        success: boolean
        documentId?: string
        filePath?: string
        fileName?: string
        documentType?: string
        error?: {
            code: string
            message: string
        }
    } | null
}

export interface PaymentResponse {
    deal: Deal
    journalEntry: JournalEntry
}

export interface BalanceResponse {
    dealId: string
    totalAmount: number
    paidAmount: number
    remainingBalance: number
    journalEntries: Array<{
        id: string
        entryType: string
        amount: number
        entryDate: string
        status: string
    }>
}

export interface ReconciliationReport {
    dealId: string
    dealTitle: string
    totalAmount: number
    paidAmount: number
    remainingBalance: number
    isBalanced: boolean
    discrepancies: Array<{
        type: string
        amount: number
        description: string
    }>
    journalEntries: Array<{
        id: string
        entryNumber: string
        entryType: string
        amount: number
        entryDate: string
        status: string
    }>
}

// Query Keys
export const dealAccountingKeys = {
    all: ['deal-accounting'] as const,
    currencies: () => [...dealAccountingKeys.all, 'currencies'] as const,
    accounts: (legalEntityId: string) => [...dealAccountingKeys.all, 'accounts', legalEntityId] as const,
    deals: (legalEntityId: string) => [...dealAccountingKeys.all, 'deals', legalEntityId] as const,
    deal: (dealId: string) => [...dealAccountingKeys.all, 'deal', dealId] as const,
    balance: (dealId: string) => [...dealAccountingKeys.all, 'balance', dealId] as const,
    reconciliation: (dealId: string) => [...dealAccountingKeys.all, 'reconciliation', dealId] as const,
}

// Queries
export function useCurrencies() {
    return useQuery({
        queryKey: dealAccountingKeys.currencies(),
        queryFn: async (): Promise<Currency[]> => {
            const response = await api.get<{ success: boolean; data: Currency[] }>('/accounting/currencies')
            return response.data.data
        },
    })
}

export function useAccounts(legalEntityId: string) {
    return useQuery({
        queryKey: dealAccountingKeys.accounts(legalEntityId),
        queryFn: async (): Promise<Account[]> => {
            const response = await api.get<{ success: boolean; data: Account[] }>('/accounting/accounts', {
                params: { legalEntityId }
            })
            return response.data.data
        },
        enabled: !!legalEntityId,
    })
}

export function useDeals(legalEntityId: string) {
    return useQuery({
        queryKey: dealAccountingKeys.deals(legalEntityId),
        queryFn: async (): Promise<Deal[]> => {
            const response = await api.get<Deal[]>(`/deals/legalEntity/${legalEntityId}`)
            return response.data
        },
        enabled: !!legalEntityId,
    })
}

export function useDealBalance(dealId: string) {
    return useQuery({
        queryKey: dealAccountingKeys.balance(dealId),
        queryFn: async (): Promise<BalanceResponse> => {
            const response = await api.get<BalanceResponse>(`/deals/${dealId}/balance`)
            return response.data
        },
        enabled: !!dealId,
    })
}

export function useDealReconciliation(dealId: string) {
    return useQuery({
        queryKey: dealAccountingKeys.reconciliation(dealId),
        queryFn: async (): Promise<ReconciliationReport> => {
            const response = await api.get<ReconciliationReport>(`/deals/${dealId}/reconciliation`)
            return response.data
        },
        enabled: !!dealId,
    })
}

// Mutations
export function useCreateDeal(legalEntityId: string) {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: async (data: CreateDealRequest): Promise<DealResponse> => {
            const response = await api.post<DealResponse>('/deals/with-accounting', data, {
                params: { legalEntityId }
            })
            return response.data
        },
        onSuccess: (data) => {
            // Invalidate and refetch deals
            queryClient.invalidateQueries({ queryKey: dealAccountingKeys.deals(legalEntityId) })
            
            toast.success(`Сделка создана! ${data.document?.success ?
                `Документ ${data.document.documentType} сгенерирован: ${data.document.fileName}` :
                'Без документа'
            }`)
        },
        onError: (error: any) => {
            toast.error(`Ошибка при создании сделки: ${error.response?.data?.error || error.message}`)
        }
    })
}

export function useRecordPayment(legalEntityId: string) {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: async ({ dealId, ...data }: RecordPaymentRequest & { dealId: string }): Promise<PaymentResponse> => {
            const response = await api.post<PaymentResponse>(`/deals/${dealId}/payments`, data, {
                params: { legalEntityId }
            })
            return response.data
        },
        onSuccess: (data, variables) => {
            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: dealAccountingKeys.deals(legalEntityId) })
            queryClient.invalidateQueries({ queryKey: dealAccountingKeys.balance(variables.dealId) })
            queryClient.invalidateQueries({ queryKey: dealAccountingKeys.reconciliation(variables.dealId) })
            
            toast.success('Платеж записан успешно!')
        },
        onError: (error: any) => {
            toast.error(`Ошибка при записи платежа: ${error.response?.data?.error || error.message}`)
        }
    })
}

export function useGenerateDocument() {
    return useMutation({
        mutationFn: async (dealId: string) => {
            const response = await api.post(`/deals/${dealId}/generate-document`)
            return response.data
        },
        onSuccess: (data) => {
            if (data.deprecated) {
                toast.info(data.message)
            } else if (data.success) {
                toast.success(`Документ ${data.documentType} сгенерирован: ${data.fileName}`)
            } else {
                toast.error(`Ошибка генерации документа: ${data.error}`)
            }
        },
        onError: (error: any) => {
            toast.error(`Ошибка при генерации документа: ${error.response?.data?.error || error.message}`)
        }
    })
} 