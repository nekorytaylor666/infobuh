import { api } from '@/lib/api'

// Types for our deal accounting system
export interface Deal {
    id: string;
    receiverBin: string;
    title: string | null;
    description: string | null;
    dealType: 'service' | 'product';
    totalAmount: number;
    paidAmount: number;
    status: 'draft' | 'active' | 'completed' | 'cancelled';
    legalEntityId: string;
    createdAt: string;
    updatedAt: string;
}

export interface JournalEntry {
    id: string;
    debitAccountCode: string;
    creditAccountCode: string;
    amount: number;
    description: string;
    createdAt: string;
}

export interface DealResponse {
    deal: Deal;
    journalEntry: JournalEntry;
    document?: {
        success: boolean;
        documentType?: string;
        fileName?: string;
        error?: string;
    };
}

export interface PaymentResponse {
    deal: Deal;
    journalEntry: JournalEntry;
}

export interface BalanceResponse {
    deal: Deal;
    totalAmount: number;
    paidAmount: number;
    remainingBalance: number;
    isFullyPaid: boolean;
    journalEntries: JournalEntry[];
}

export interface ReconciliationReport {
    deal: Deal;
    totalAmount: number;
    paidAmount: number;
    discrepancy: number;
    status: 'balanced' | 'overpaid' | 'underpaid';
    journalEntries: JournalEntry[];
    unmatchedEntries: JournalEntry[];
}

export interface CreateDealRequest {
    receiverBin: string;
    title: string;
    description?: string;
    dealType: 'service' | 'product';
    totalAmount: number;
    currencyId: string;
    accountsReceivableId: string;
    revenueAccountId: string;
}

export interface RecordPaymentRequest {
    amount: number;
    description?: string;
}

export const dealAccountingService = {
    async createDealWithAccounting(data: CreateDealRequest): Promise<DealResponse> {
        const response = await api.post<DealResponse>('/deals/with-accounting', data)
        return response.data
    },

    async recordPayment(dealId: string, data: RecordPaymentRequest): Promise<PaymentResponse> {
        const response = await api.post<PaymentResponse>(`/deals/${dealId}/payments`, data)
        return response.data
    },

    async getDealBalance(dealId: string): Promise<BalanceResponse> {
        const response = await api.get<BalanceResponse>(`/deals/${dealId}/balance`)
        return response.data
    },

    async generateReconciliationReport(dealId: string): Promise<ReconciliationReport> {
        const response = await api.get<ReconciliationReport>(`/deals/${dealId}/reconciliation`)
        return response.data
    },

    async generateDocument(dealId: string) {
        const response = await api.post(`/deals/${dealId}/generate-document`)
        return response.data
    },

    async getAllDeals(): Promise<Deal[]> {
        const response = await api.get<Deal[]>('/deals')
        return response.data
    }
} 