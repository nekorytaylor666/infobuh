import {
	dealJournalEntries,
	type DealType,
	type DealStatus,
	DEAL_TYPES,
	DEAL_STATUSES,
	deals as dealsTable,
	Database,
	eq,
	dealDocumentsFlutter,
} from "@accounting-kz/db";
import { AccountingService } from "./accounting-service.index";
import { DocumentGenerationService, type DocumentGenerationResult } from "./document-generation-service";

export interface CreateDealJournalEntryParams {
	dealId: string;
	description: string;
	reference?: string;
	amount: number;
	entryType: "invoice" | "payment" | "adjustment";
	legalEntityId: string;
	currencyId: string;
	createdBy: string;
	accountsReceivableId: string; // Account for receivables
	revenueAccountId?: string; // For invoice entries
	cashAccountId?: string; // For payment entries
}

export interface DealBalance {
	dealId: string;
	totalAmount: number;
	paidAmount: number;
	remainingBalance: number;
	journalEntries: {
		id: string;
		entryType: string;
		amount: number;
		entryDate: string;
		status: string;
	}[];
}

export interface ReconciliationReport {
	dealId: string;
	dealTitle: string;
	totalAmount: number;
	paidAmount: number;
	remainingBalance: number;
	discrepancies: {
		type: "missing_payment" | "overpayment" | "unmatched_entry";
		amount: number;
		description: string;
	}[];
	isBalanced: boolean;
	journalEntries: {
		id: string;
		entryNumber: string;
		entryType: string;
		amount: number;
		entryDate: string;
		status: string;
		description?: string;
	}[];
}

export class DealAccountingService {
	private documentGenerationService: DocumentGenerationService;

	constructor(private db: Database) {
		this.documentGenerationService = new DocumentGenerationService(db);
	}

	async createDealWithAccounting(params: {
		receiverBin: string;
		title: string;
		description?: string;
		dealType: DealType;
		totalAmount: number;
		legalEntityId: string;
		currencyId: string;
		createdBy: string;
		accountsReceivableId: string;
		revenueAccountId: string;
	}) {
		const accountingService = new AccountingService(this.db);

		// First create the deal and journal entries in a transaction
		const { deal, journalEntry } = await this.db.transaction(async (tx) => {
			// 1. Create the deal
			const [deal] = await tx.insert(dealsTable).values({
				receiverBin: params.receiverBin,
				title: params.title,
				description: params.description,
				dealType: params.dealType,
				totalAmount: params.totalAmount,
				status: "active",
				legalEntityId: params.legalEntityId,
			}).returning();

			// 2. Create journal entry for the invoice
			const entryNumber = await this.generateEntryNumber(params.legalEntityId);

			const journalEntryResult = await accountingService.createJournalEntry(
				{
					entryNumber,
					entryDate: new Date().toISOString().split('T')[0],
					description: `${params.dealType === 'service' ? 'Услуги' : 'Товары'}: ${params.title}`,
					reference: `DEAL-${deal.id}`,
					status: "draft",
					currencyId: params.currencyId,
					legalEntityId: params.legalEntityId,
					createdBy: params.createdBy,
				},
				[
					{
						accountId: params.accountsReceivableId,
						debitAmount: params.totalAmount,
						creditAmount: 0,
						description: `Дебиторская задолженность: ${params.title}`,
					},
					{
						accountId: params.revenueAccountId,
						debitAmount: 0,
						creditAmount: params.totalAmount,
						description: `${params.dealType === 'service' ? 'Доходы от услуг' : 'Доходы от продажи товаров'}`,
					},
				]
			);

			if (!journalEntryResult.success) {
				throw new Error(`Failed to create journal entry: ${journalEntryResult.error.message}`);
			}

			// 3. Link deal with journal entry
			await tx.insert(dealJournalEntries).values({
				dealId: deal.id,
				journalEntryId: journalEntryResult.entry.id,
				entryType: "invoice",
			});

			return {
				deal,
				journalEntry: journalEntryResult.entry,
			};
		});

		// 4. Generate document outside the transaction
		let generatedDocument: DocumentGenerationResult | null = null;
		try {
			const documentResult = await this.documentGenerationService.generateDocumentForDeal({
				dealId: deal.id,
				dealType: params.dealType,
				legalEntityId: params.legalEntityId,
				receiverBin: params.receiverBin,
				title: params.title,
				description: params.description,
				totalAmount: params.totalAmount,
				createdBy: params.createdBy,
			});

			if (documentResult.success) {
				// 5. Link document with deal in a separate transaction
				await this.db.insert(dealDocumentsFlutter).values({
					dealId: deal.id,
					documentFlutterId: documentResult.documentId,
				});
				generatedDocument = documentResult;
			} else {
				// Log error but don't fail the deal creation
				console.error("Failed to generate document for deal:", documentResult.error);
				generatedDocument = {
					success: false,
					error: documentResult.error,
				} as DocumentGenerationResult;
			}
		} catch (error) {
			// Log error but don't fail the deal creation
			console.error("Document generation error:", error);
			generatedDocument = {
				success: false,
				error: {
					code: "GENERATION_ERROR",
					message: error instanceof Error ? error.message : "Unknown document generation error",
				},
			} as DocumentGenerationResult;
		}

		return {
			deal,
			journalEntry,
			document: generatedDocument,
		};
	}

	async recordPayment(params: {
		dealId: string;
		amount: number;
		description?: string;
		reference?: string;
		legalEntityId: string;
		currencyId: string;
		createdBy: string;
		cashAccountId: string;
		accountsReceivableId: string;
	}) {
		const accountingService = new AccountingService(this.db);

		return await this.db.transaction(async (tx) => {
			// 1. Get current deal
			const deal = await tx.query.deals.findFirst({
				where: eq(dealsTable.id, params.dealId),
			});

			if (!deal) {
				throw new Error("Deal not found");
			}

			// 2. Validate payment amount
			const newPaidAmount = deal.paidAmount + params.amount;
			if (newPaidAmount > deal.totalAmount) {
				throw new Error("Payment amount exceeds remaining balance");
			}

			// 3. Create payment journal entry
			const entryNumber = await this.generateEntryNumber(params.legalEntityId);

			const journalEntryResult = await accountingService.createJournalEntry(
				{
					entryNumber,
					entryDate: new Date().toISOString().split('T')[0],
					description: params.description || `Оплата по сделке: ${deal.title}`,
					reference: params.reference || `PAY-${params.dealId}`,
					status: "draft",
					currencyId: params.currencyId,
					legalEntityId: params.legalEntityId,
					createdBy: params.createdBy,
				},
				[
					{
						accountId: params.cashAccountId,
						debitAmount: params.amount,
						creditAmount: 0,
						description: "Поступление денежных средств",
					},
					{
						accountId: params.accountsReceivableId,
						debitAmount: 0,
						creditAmount: params.amount,
						description: "Погашение дебиторской задолженности",
					},
				]
			);

			if (!journalEntryResult.success) {
				throw new Error(`Failed to create payment journal entry: ${journalEntryResult.error.message}`);
			}

			// 4. Update deal paid amount
			const [updatedDeal] = await tx
				.update(dealsTable)
				.set({
					paidAmount: newPaidAmount,
					status: newPaidAmount === deal.totalAmount ? "completed" : "active",
					updatedAt: new Date(),
				})
				.where(eq(dealsTable.id, params.dealId))
				.returning();

			// 5. Link payment with deal
			await tx.insert(dealJournalEntries).values({
				dealId: params.dealId,
				journalEntryId: journalEntryResult.entry.id,
				entryType: "payment",
			});

			return { deal: updatedDeal, journalEntry: journalEntryResult.entry };
		});
	}

	async getDealBalance(dealId: string): Promise<DealBalance | null> {
		const deal = await this.db.query.deals.findFirst({
			where: eq(dealsTable.id, dealId),
			with: {
				dealJournalEntries: true,
			},
		});

		if (!deal) {
			return null;
		}

		// Get all journal entries for this deal
		const journalEntries = await this.db.query.dealJournalEntries.findMany({
			where: eq(dealJournalEntries.dealId, dealId),
		});

		// Transform journal entries data (simplified - in real implementation would join with journal_entries table)
		const entriesData = journalEntries.map(entry => ({
			id: entry.journalEntryId,
			entryType: entry.entryType,
			amount: 0, // Would be calculated from journal entry lines
			entryDate: entry.createdAt.toISOString().split('T')[0],
			status: "draft", // Would come from journal entry
		}));

		return {
			dealId: deal.id,
			totalAmount: deal.totalAmount,
			paidAmount: deal.paidAmount,
			remainingBalance: deal.totalAmount - deal.paidAmount,
			journalEntries: entriesData,
		};
	}

	async generateReconciliationReport(dealId: string): Promise<ReconciliationReport | null> {
		const deal = await this.db.query.deals.findFirst({
			where: eq(dealsTable.id, dealId),
			with: {
				dealJournalEntries: true,
			},
		});

		if (!deal) {
			return null;
		}

		// Calculate balances and find discrepancies
		const calculatedBalance = deal.totalAmount - deal.paidAmount;
		const discrepancies: ReconciliationReport["discrepancies"] = [];

		// Check for overpayment
		if (deal.paidAmount > deal.totalAmount) {
			discrepancies.push({
				type: "overpayment",
				amount: deal.paidAmount - deal.totalAmount,
				description: "Переплата по сделке",
			});
		}

		// Check for remaining balance
		if (calculatedBalance > 0 && deal.status === "completed") {
			discrepancies.push({
				type: "missing_payment",
				amount: calculatedBalance,
				description: "Недоплата при статусе 'завершено'",
			});
		}

		// Get journal entries (simplified)
		const journalEntries = deal.dealJournalEntries.map(entry => ({
			id: entry.journalEntryId,
			entryNumber: `JE-${entry.journalEntryId.slice(0, 8)}`, // Simplified
			entryType: entry.entryType,
			amount: 0, // Would be calculated from actual journal entry lines
			entryDate: entry.createdAt.toISOString().split('T')[0],
			status: "draft", // Would come from journal entry
			description: undefined,
		}));

		const report: ReconciliationReport = {
			dealId: deal.id,
			dealTitle: deal.title || "",
			totalAmount: deal.totalAmount,
			paidAmount: deal.paidAmount,
			remainingBalance: calculatedBalance,
			discrepancies,
			isBalanced: discrepancies.length === 0,
			journalEntries,
		};

		const dealBalance = await this.getDealBalance(dealId);
		report.isBalanced = dealBalance ? dealBalance.remainingBalance === 0 : false;

		return report;
	}

	private async generateEntryNumber(legalEntityId: string): Promise<string> {
		// This is a placeholder for a more robust entry number generation logic
		const timestamp = Date.now();
		return `JE-${legalEntityId.slice(0, 4)}-${timestamp}`;
	}
}

export type { DealType, DealStatus };
export { DEAL_TYPES, DEAL_STATUSES }; 