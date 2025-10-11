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
	accounts,
	and,
	journalEntries,
	journalEntryLines,
} from "@accounting-kz/db";
import { AccountingService } from "./accounting-service.index";

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
	constructor(private db: Database) { }

	/**
	 * Find account by code within a legal entity
	 */
	private async findAccountByCode(legalEntityId: string, accountCode: string) {
		const account = await this.db.query.accounts.findFirst({
			where: and(
				eq(accounts.legalEntityId, legalEntityId),
				eq(accounts.code, accountCode)
			),
		});

		if (!account) {
			throw new Error(`Account with code ${accountCode} not found for legal entity ${legalEntityId}`);
		}

		return account;
	}

	/**
	 * Get standard accounts for deal transactions
	 */
	private async getStandardAccounts(legalEntityId: string) {
		const [accountsReceivable, revenue, bankAccount] = await Promise.all([
			this.findAccountByCode(legalEntityId, "1210"), // Accounts Receivable
			this.findAccountByCode(legalEntityId, "6010"), // Revenue
			this.findAccountByCode(legalEntityId, "1030"), // Bank Account
		]);

		return {
			accountsReceivable,
			revenue,
			bankAccount,
		};
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
	}) {
		const accountingService = new AccountingService(this.db);

		// First get the standard accounts
		const standardAccounts = await this.getStandardAccounts(params.legalEntityId);

		// Create the deal and journal entries in a transaction
		const { deal, journalEntry, partner } = await this.db.transaction(async (tx) => {
			// 1. Find or create partner from BIN
			const partner = await accountingService.findOrCreatePartnerByBin(
				params.receiverBin,
				params.legalEntityId
			);

			// 2. Create the deal
			const [deal] = await tx.insert(dealsTable).values({
				receiverBin: params.receiverBin,
				title: params.title,
				description: params.description,
				dealType: params.dealType,
				totalAmount: params.totalAmount,
				status: "active",
				legalEntityId: params.legalEntityId,
			}).returning();

			// 3. Create journal entry for the invoice with partner reference
			const entryNumber = await this.generateEntryNumber(params.legalEntityId);

			const journalEntryResult = await accountingService.createJournalEntry(
				{
					entryNumber,
					entryDate: new Date().toISOString().split('T')[0],
					description: `${params.dealType === 'service' ? 'Услуги' : 'Товары'}: ${params.title} (${partner.name})`,
					reference: `DEAL-${deal.id}`,
					status: "draft",
					currencyId: params.currencyId,
					legalEntityId: params.legalEntityId,
					createdBy: params.createdBy,
				},
				[
					{
						accountId: standardAccounts.accountsReceivable.id, // Account code 1210
						debitAmount: params.totalAmount,
						creditAmount: 0,
						description: `Дебиторская задолженность: ${partner.name}`,
					},
					{
						accountId: standardAccounts.revenue.id, // Account code 6010
						debitAmount: 0,
						creditAmount: params.totalAmount,
						description: `${params.dealType === 'service' ? 'Доходы от услуг' : 'Доходы от продажи товаров'}: ${partner.name}`,
					},
				],
				params.receiverBin // Pass the BIN for partner linkage
			);

			if (!journalEntryResult.success) {
				throw new Error(`Failed to create journal entry: ${journalEntryResult.error.message}`);
			}

			// 4. Link deal with journal entry
			await tx.insert(dealJournalEntries).values({
				dealId: deal.id,
				journalEntryId: journalEntryResult.entry.id,
				entryType: "invoice",
			});

			return {
				deal,
				journalEntry: journalEntryResult.entry,
				partner,
			};
		});

		return {
			deal,
			journalEntry,
			partner,
			document: null, // Document generation is now a separate process
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
		paymentMethod?: "bank" | "cash"; // Optional, defaults to bank
	}) {
		const accountingService = new AccountingService(this.db);

		// Get the standard accounts
		const standardAccounts = await this.getStandardAccounts(params.legalEntityId);

		// Get the appropriate cash account based on payment method
		const cashAccount = params.paymentMethod === "cash"
			? await this.findAccountByCode(params.legalEntityId, "1010") // Cash account
			: standardAccounts.bankAccount; // Bank account (1030)

		return await this.db.transaction(async (tx) => {
			// 1. Get current deal
			const deal = await tx.query.deals.findFirst({
				where: eq(dealsTable.id, params.dealId),
			});

			if (!deal) {
				throw new Error("Deal not found");
			}

			// 2. Get partner information for better descriptions
			const partner = await accountingService.findOrCreatePartnerByBin(
				deal.receiverBin,
				params.legalEntityId
			);

			// 3. Validate payment amount
			const newPaidAmount = deal.paidAmount + params.amount;
			if (newPaidAmount > deal.totalAmount) {
				throw new Error("Payment amount exceeds remaining balance");
			}

			// 4. Create payment journal entry
			const entryNumber = await this.generateEntryNumber(params.legalEntityId);

			const journalEntryResult = await accountingService.createJournalEntry(
				{
					entryNumber,
					entryDate: new Date().toISOString().split('T')[0],
					description: params.description || `Оплата по сделке: ${deal.title} (${partner.name})`,
					reference: params.reference || `PAY-${params.dealId}`,
					status: "draft",
					currencyId: params.currencyId,
					legalEntityId: params.legalEntityId,
					createdBy: params.createdBy,
				},
				[
					{
						accountId: cashAccount.id, // Account code 1030 (bank) or 1010 (cash)
						debitAmount: params.amount,
						creditAmount: 0,
						description: `Поступление денежных средств от ${partner.name}`,
					},
					{
						accountId: standardAccounts.accountsReceivable.id, // Account code 1210
						debitAmount: 0,
						creditAmount: params.amount,
						description: `Погашение дебиторской задолженности: ${partner.name}`,
					},
				],
				deal.receiverBin // Pass the BIN for partner linkage
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

	async recordExpensePayment(params: {
		dealId: string;
		amount: number;
		description?: string;
		reference?: string;
		legalEntityId: string;
		currencyId: string;
		createdBy: string;
		paymentMethod?: "bank" | "cash"; // Optional, defaults to bank
	}) {
		const accountingService = new AccountingService(this.db);

		// Get the standard accounts
		const standardAccounts = await this.getStandardAccounts(params.legalEntityId);

		// Get the appropriate cash account based on payment method
		const cashAccount = params.paymentMethod === "cash"
			? await this.findAccountByCode(params.legalEntityId, "1010") // Cash account
			: standardAccounts.bankAccount; // Bank account (1030)

		return await this.db.transaction(async (tx) => {
			// 1. Get current deal
			const deal = await tx.query.deals.findFirst({
				where: eq(dealsTable.id, params.dealId),
			});

			if (!deal) {
				throw new Error("Deal not found");
			}

			// 2. Get partner information for better descriptions
			const partner = await accountingService.findOrCreatePartnerByBin(
				deal.receiverBin,
				params.legalEntityId
			);

			// 3. Validate payment amount
			const newPaidAmount = deal.paidAmount + params.amount;
			if (newPaidAmount > deal.totalAmount) {
				throw new Error("Payment amount exceeds remaining balance");
			}

			// 4. Create expense payment journal entry
			const entryNumber = await this.generateEntryNumber(params.legalEntityId);

			const journalEntryResult = await accountingService.createJournalEntry(
				{
					entryNumber,
					entryDate: new Date().toISOString().split('T')[0],
					description: params.description || `Расход по сделке: ${deal.title} (${partner.name})`,
					reference: params.reference || `EXP-${params.dealId}`,
					status: "draft",
					currencyId: params.currencyId,
					legalEntityId: params.legalEntityId,
					createdBy: params.createdBy,
				},
				[
					{
						accountId: standardAccounts.revenue.id, // Account code 6010 - Expense account
						debitAmount: params.amount,
						creditAmount: 0,
						description: `Расходы на ${partner.name}`,
					},
					{
						accountId: cashAccount.id, // Account code 1030 (bank) or 1010 (cash)
						debitAmount: 0,
						creditAmount: params.amount,
						description: `Выплата денежных средств для ${partner.name}`,
					},
				],
				deal.receiverBin // Pass the BIN for partner linkage
			);

			if (!journalEntryResult.success) {
				throw new Error(`Failed to create expense payment journal entry: ${journalEntryResult.error.message}`);
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

	async getDealTransactions(dealId: string) {
		// Get deal with all related journal entries
		const deal = await this.db.query.deals.findFirst({
			where: eq(dealsTable.id, dealId),
			with: {
				dealJournalEntries: {
					with: {
						journalEntry: {
							with: {
								lines: {
									with: {
										account: true,
									},
								},
								partner: true,
							},

						},
					},
				},
			},
		});

		if (!deal) {
			return null;
		}

		// Transform the data to get real transaction details
		const transactions = deal.dealJournalEntries.map((dealJournalEntry) => {
			const journalEntry = dealJournalEntry.journalEntry;

			return {
				id: journalEntry.id,
				dealId: dealJournalEntry.dealId,
				entryType: dealJournalEntry.entryType,
				entryNumber: journalEntry.entryNumber,
				entryDate: journalEntry.entryDate,
				description: journalEntry.description || '',
				reference: journalEntry.reference || '',
				status: journalEntry.status,
				lines: journalEntry.lines.map((line) => ({
					id: line.id,
					accountId: line.accountId,
					accountCode: line.account.code,
					accountName: line.account.name,
					debitAmount: line.debitAmount || 0,
					creditAmount: line.creditAmount || 0,
					description: line.description || '',
				})),
			};
		});

		return {
			dealId: deal.id,
			dealTitle: deal.title || '',
			totalAmount: deal.totalAmount,
			paidAmount: deal.paidAmount,
			transactions,
		};
	}

	private async generateEntryNumber(legalEntityId: string): Promise<string> {
		// This is a placeholder for a more robust entry number generation logic
		const timestamp = Date.now();
		return `JE-${legalEntityId.slice(0, 4)}-${timestamp}`;
	}
}

export type { DealType, DealStatus };
export { DEAL_TYPES, DEAL_STATUSES }; 