import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import {
	accounts,
	journalEntries,
	journalEntryLines,
	generalLedger,
	currencies,
	accountingPeriods,
	toSmallestUnit,
	fromSmallestUnit,
	formatAmount,
	type Account,
	type NewAccount,
	type JournalEntry,
	type NewJournalEntry,
	type JournalEntryLine,
	type NewJournalEntryLine,
	type Currency,
	type NewCurrency,
	type AccountType,
	type Database,
	eq,
	and,
	asc,
	desc,
	sql,
	isNull,
} from "@accounting-kz/db";
import { PartnerService } from "./partner-service";

// Define a type for the structure returned by getTrialBalance and used in reporting
interface TrialBalanceAccountItem {
	accountCode: string;
	accountName: string;
	accountType: AccountType;
	debitBalance: number;
	creditBalance: number;
	balance?: number; // Optional net balance, can be added during processing
}

export type CreateJournalEntryResult =
	| { success: true; entry: JournalEntry }
	| { success: false; error: { type: "ACCOUNT_NOT_FOUND" | "TRANSACTION_ERROR"; message: string } };

export class AccountingService {
	private partnerService: PartnerService;

	constructor(private db: Database) {
		this.partnerService = new PartnerService(db);
	}

	// ===== CURRENCY OPERATIONS =====

	async createCurrency(data: NewCurrency): Promise<Currency> {
		const [currency] = await this.db
			.insert(currencies)
			.values(data)
			.returning();
		return currency;
	}

	async getCurrencies(): Promise<Currency[]> {
		return await this.db
			.select()
			.from(currencies)
			.where(eq(currencies.isActive, true));
	}

	async getBaseCurrency(): Promise<Currency> {
		const [currency] = await this.db
			.select()
			.from(currencies)
			.where(
				and(eq(currencies.isBaseCurrency, true), eq(currencies.isActive, true)),
			)
			.limit(1);

		if (!currency) {
			throw new Error("Base currency not found");
		}

		return currency;
	}

	// ===== ACCOUNT OPERATIONS =====

	async createAccount(data: NewAccount): Promise<Account> {
		const [account] = await this.db.insert(accounts).values(data).returning();
		return account;
	}

	async createAccountsBulk(accountsData: NewAccount[]): Promise<Account[]> {
		return await this.db.transaction(async (trx) => {
			const createdAccounts = await trx
				.insert(accounts)
				.values(accountsData)
				.returning();
			return createdAccounts;
		});
	}

	async getAccountById(id: string, legalEntityId: string): Promise<Account | null> {
		const [account] = await this.db
			.select()
			.from(accounts)
			.where(and(eq(accounts.id, id), eq(accounts.legalEntityId, legalEntityId)))
			.limit(1);

		return account || null;
	}

	async getAccountByCode(code: string, legalEntityId: string): Promise<Account | null> {
		const [account] = await this.db
			.select()
			.from(accounts)
			.where(and(eq(accounts.code, code), eq(accounts.legalEntityId, legalEntityId)))
			.limit(1);

		return account || null;
	}

	async getAccounts(legalEntityId: string): Promise<Account[]> {
		return await this.db
			.select()
			.from(accounts)
			.where(and(eq(accounts.isActive, true), eq(accounts.legalEntityId, legalEntityId)))
			.orderBy(asc(accounts.code));
	}

	async getAccountsByType(accountType: AccountType, legalEntityId: string): Promise<Account[]> {
		return await this.db
			.select()
			.from(accounts)
			.where(
				and(
					eq(accounts.accountType, accountType),
					eq(accounts.isActive, true),
					eq(accounts.legalEntityId, legalEntityId)
				),
			)
			.orderBy(asc(accounts.code));
	}

	async getChildAccounts(parentId: string, legalEntityId: string): Promise<Account[]> {
		return await this.db
			.select()
			.from(accounts)
			.where(and(eq(accounts.parentId, parentId), eq(accounts.isActive, true), eq(accounts.legalEntityId, legalEntityId)))
			.orderBy(asc(accounts.code));
	}

	async getAccountHierarchy(legalEntityId: string): Promise<Account[]> {
		const allAccounts = await this.getAccounts(legalEntityId);
		return this.buildAccountTree(allAccounts, null, legalEntityId);
	}

	private buildAccountTree(
		allAccounts: Account[],
		parentId: string | null = null,
		legalEntityId: string
	): Account[] {
		return allAccounts
			.filter((account) => account.parentId === parentId)
			.map((account) => ({
				...account,
				children: this.buildAccountTree(allAccounts, account.id, legalEntityId),
			}));
	}

	// ===== JOURNAL ENTRY OPERATIONS =====

	async createJournalEntry(
		entryData: Omit<NewJournalEntry, "id" | "totalDebit" | "totalCredit" | "createdAt" | "updatedAt">,
		lines: Omit<NewJournalEntryLine, "id" | "journalEntryId" | "lineNumber" | "createdAt" | "updatedAt">[],
		partnerBin?: string,
		tx?: any,
	): Promise<CreateJournalEntryResult> {
		try {
			// Zod validation for debit/credit balance, min lines, etc., is handled by the route middleware.

			// If transaction context provided, use it; otherwise create new transaction
			const executeWithinTransaction = tx
				? async (fn: (trx: any) => Promise<any>) => fn(tx)
				: async (fn: (trx: any) => Promise<any>) => this.db.transaction(fn);

			const entry = await executeWithinTransaction(async (trx) => {
				// Handle partner lookup/creation if BIN provided
				let partnerId: string | undefined;
				if (partnerBin) {
					try {
						const partner = await this.partnerService.findOrCreatePartnerByBin(
							partnerBin,
							entryData.legalEntityId
						);
						partnerId = partner.id;
					} catch (partnerError: any) {
						console.warn(`Partner lookup/creation failed for BIN ${partnerBin}:`, partnerError.message);
						// Continue without partner - this is not a critical error
					}
				}

				// Check if all accounts exist concurrently
				try {
					const accountExistenceChecks = lines.map(async (line) => {
						const account = await trx.query.accounts.findFirst({
							columns: { id: true }, // Only fetch necessary columns
							where: and(
								eq(accounts.id, line.accountId),
								eq(accounts.legalEntityId, entryData.legalEntityId),
								eq(accounts.isActive, true),
							),
						});
						if (!account) {
							const err = new Error(
								`Account with ID ${line.accountId} not found or not active for legal entity ${entryData.legalEntityId}.`,
							);
							err.name = "AccountNotFoundError"; // Custom marker for specific error handling
							throw err;
						}
					});
					await Promise.all(accountExistenceChecks);
				} catch (err: any) {
					// Re-throw to be caught by the transaction's error handling, which will roll back
					// and then be caught by the outer catch block of this createJournalEntry method.
					throw err;
				}

				const totalDebit = lines.reduce(
					(sum, line) => sum + (line.debitAmount || 0),
					0,
				);
				const totalCredit = lines.reduce(
					(sum, line) => sum + (line.creditAmount || 0),
					0,
				);

				const [createdEntry] = await trx
					.insert(journalEntries)
					.values({
						...entryData,
						partnerId,
						totalDebit: totalDebit,
						totalCredit: totalCredit,
					})
					.returning();

				const entryLinesToInsert = lines.map((line, index) => ({
					...line,
					journalEntryId: createdEntry.id,
					lineNumber: index + 1,
				}));

				await trx.insert(journalEntryLines).values(entryLinesToInsert);
				return createdEntry;
			});

			if (!entry) {
				// This case is unlikely if transaction throws on error and returns value on success.
				// But as a safeguard:
				return { success: false, error: { type: "TRANSACTION_ERROR", message: "Transaction completed but returned no entry." } };
			}
			return { success: true, entry };

		} catch (error: any) {
			console.error("Error creating journal entry in service:", error.message); // Log the actual error
			if (error.name === "AccountNotFoundError") {
				return { success: false, error: { type: "ACCOUNT_NOT_FOUND", message: error.message } };
			}
			// For any other errors caught from the transaction (DB constraints, etc.)
			return { success: false, error: { type: "TRANSACTION_ERROR", message: error.message || "An unexpected error occurred during journal entry creation." } };
		}
	}

	async postJournalEntry(entryId: string, legalEntityId: string, userId: string): Promise<void> {
		await this.db.transaction(async (trx) => {
			const [entry] = await trx
				.select()
				.from(journalEntries)
				.where(and(eq(journalEntries.id, entryId), eq(journalEntries.legalEntityId, legalEntityId)))
				.limit(1);

			if (!entry) {
				throw new Error("Journal entry not found or not associated with this legal entity");
			}

			if (entry.status === "posted") {
				throw new Error("Journal entry already posted");
			}

			const lines = await trx
				.select()
				.from(journalEntryLines)
				.where(eq(journalEntryLines.journalEntryId, entryId));

			await trx
				.update(journalEntries)
				.set({ status: "posted", approvedBy: userId, updatedAt: new Date() })
				.where(eq(journalEntries.id, entryId));

			for (const line of lines) {
				const runningBalance = await this.calculateRunningBalance(
					trx,
					line.accountId,
					line.debitAmount - line.creditAmount,
					legalEntityId,
				);

				await trx.insert(generalLedger).values({
					accountId: line.accountId,
					journalEntryLineId: line.id,
					legalEntityId: legalEntityId,
					transactionDate: entry.entryDate,
					debitAmount: line.debitAmount,
					creditAmount: line.creditAmount,
					runningBalance,
					description: line.description || entry.description,
				});
			}
		});
	}

	private async calculateRunningBalance(
		trx: any,
		accountId: string,
		changeAmount: number,
		legalEntityId: string,
	): Promise<number> {
		const [lastEntry] = await trx
			.select({ runningBalance: generalLedger.runningBalance })
			.from(generalLedger)
			.where(and(eq(generalLedger.accountId, accountId), eq(generalLedger.legalEntityId, legalEntityId)))
			.orderBy(desc(generalLedger.createdAt), desc(generalLedger.id))
			.limit(1);

		const previousBalance = lastEntry?.runningBalance || 0;
		return previousBalance + changeAmount;
	}

	async getJournalEntries(legalEntityId: string): Promise<JournalEntry[]> {
		return await this.db.query.journalEntries.findMany({
			where: eq(journalEntries.legalEntityId, legalEntityId),
			with: {
				lines: {
					with: {
						account: true,
					},
				},
				partner: true,
				dealJournalEntries: {
					with: {
						deal: {
							columns: {
								id: true,
								title: true,
								totalAmount: true,
								paidAmount: true,
							},
						},
					},
				},
			},
			orderBy: [desc(journalEntries.entryDate), desc(journalEntries.createdAt)],
		});
	}

	async getJournalEntryById(id: string, legalEntityId: string): Promise<JournalEntry | null> {
		const entry = await this.db.query.journalEntries.findFirst({
			where: and(eq(journalEntries.id, id), eq(journalEntries.legalEntityId, legalEntityId)),
			with: {
				dealJournalEntries: {
					with: {
						deal: {
							columns: {
								id: true,
								title: true,
								totalAmount: true,
								paidAmount: true,
							},
						},
					},
				},
			},
		});

		return entry || null;
	}

	async getJournalEntryLines(entryId: string): Promise<JournalEntryLine[]> {
		return await this.db
			.select()
			.from(journalEntryLines)
			.where(eq(journalEntryLines.journalEntryId, entryId))
			.orderBy(asc(journalEntryLines.lineNumber));
	}

	// ===== PARTNER OPERATIONS =====

	async findOrCreatePartnerByBin(bin: string, legalEntityId: string) {
		return await this.partnerService.findOrCreatePartnerByBin(bin, legalEntityId);
	}

	async getPartnersByLegalEntity(legalEntityId: string) {
		return await this.partnerService.getPartnersByLegalEntity(legalEntityId);
	}

	async getPartnerById(partnerId: string, legalEntityId: string) {
		return await this.partnerService.getPartnerById(partnerId, legalEntityId);
	}

	async getPartnerSubledger(partnerId: string, legalEntityId: string): Promise<{
		partner: any;
		journalEntries: JournalEntry[];
		totalDebit: number;
		totalCredit: number;
		balance: number;
	}> {
		const partner = await this.partnerService.getPartnerById(partnerId, legalEntityId);
		if (!partner) {
			throw new Error("Partner not found");
		}

		const entries = await this.db.query.journalEntries.findMany({
			where: and(
				eq(journalEntries.partnerId, partnerId),
				eq(journalEntries.legalEntityId, legalEntityId)
			),
			with: {
				lines: {
					with: {
						account: true,
					},
				},
			},
			orderBy: [desc(journalEntries.entryDate), desc(journalEntries.createdAt)],
		});

		let totalDebit = 0;
		let totalCredit = 0;

		entries.forEach(entry => {
			totalDebit += entry.totalDebit;
			totalCredit += entry.totalCredit;
		});

		return {
			partner,
			journalEntries: entries,
			totalDebit,
			totalCredit,
			balance: totalDebit - totalCredit,
		};
	}

	async getPartnerBalance(partnerId: string, legalEntityId: string): Promise<number> {
		const result = await this.db
			.select({
				totalDebit: sql<number>`COALESCE(SUM(${journalEntries.totalDebit}), 0)`.mapWith(Number),
				totalCredit: sql<number>`COALESCE(SUM(${journalEntries.totalCredit}), 0)`.mapWith(Number),
			})
			.from(journalEntries)
			.where(
				and(
					eq(journalEntries.partnerId, partnerId),
					eq(journalEntries.legalEntityId, legalEntityId),
					eq(journalEntries.status, "posted")
				)
			);

		if (!result[0]) {
			return 0;
		}

		return Number(result[0].totalDebit) - Number(result[0].totalCredit);
	}

	// ===== REPORTING OPERATIONS =====

	async getTrialBalance(legalEntityId: string): Promise<
		{
			accountCode: string;
			accountName: string;
			accountType: AccountType;
			debitBalance: number;
			creditBalance: number;
		}[]
	> {
		const result = await this.db
			.select({
				accountCode: accounts.code,
				accountName: accounts.name,
				accountType: accounts.accountType,
				totalDebits: sql<number>`COALESCE(SUM(${generalLedger.debitAmount}), 0)`.mapWith(Number),
				totalCredits: sql<number>`COALESCE(SUM(${generalLedger.creditAmount}), 0)`.mapWith(Number),
			})
			.from(generalLedger)
			.innerJoin(accounts,
				and(
					eq(generalLedger.accountId, accounts.id),
					eq(accounts.legalEntityId, legalEntityId)
				)
			)
			.where(eq(generalLedger.legalEntityId, legalEntityId))
			.groupBy(
				accounts.code,
				accounts.name,
				accounts.accountType,
				accounts.id
			)
			.orderBy(asc(accounts.code));

		return result.map((row) => {
			const rawDebit = Number(row.totalDebits) || 0;
			const rawCredit = Number(row.totalCredits) || 0;
			const netBalance = rawDebit - rawCredit;

			const isDebitType = ["asset", "expense"].includes(row.accountType as string);
			let debitBalance = 0;
			let creditBalance = 0;

			if (isDebitType) {
				if (netBalance >= 0) debitBalance = netBalance;
				else creditBalance = Math.abs(netBalance);
			} else {
				if (netBalance <= 0) creditBalance = Math.abs(netBalance);
				else debitBalance = netBalance;
			}

			return {
				accountCode: row.accountCode,
				accountName: row.accountName,
				accountType: row.accountType,
				debitBalance,
				creditBalance,
			};
		});
	}

	async getAccountLedger(accountId: string, legalEntityId: string): Promise<
		{
			transactionDate: string;
			description: string | null;
			debitAmount: number;
			creditAmount: number;
			runningBalance: number;
			entryNumber: string;
		}[]
	> {
		const account = await this.getAccountById(accountId, legalEntityId);
		if (!account) {
			throw new Error("Account not found or does not belong to the specified legal entity.");
		}

		const result = await this.db
			.select({
				transactionDate: generalLedger.transactionDate,
				description: generalLedger.description,
				debitAmount: generalLedger.debitAmount,
				creditAmount: generalLedger.creditAmount,
				runningBalance: generalLedger.runningBalance,
				entryNumber: journalEntries.entryNumber,
			})
			.from(generalLedger)
			.innerJoin(
				journalEntryLines,
				eq(generalLedger.journalEntryLineId, journalEntryLines.id),
			)
			.innerJoin(
				journalEntries,
				eq(journalEntryLines.journalEntryId, journalEntries.id),
			)
			.where(and(eq(generalLedger.accountId, accountId), eq(generalLedger.legalEntityId, legalEntityId)))
			.orderBy(
				asc(generalLedger.transactionDate),
				asc(generalLedger.createdAt),
				asc(generalLedger.id)
			);

		return result.map(row => ({
			...row,
			debitAmount: Number(row.debitAmount),
			creditAmount: Number(row.creditAmount),
			runningBalance: Number(row.runningBalance)
		}));
	}

	async getBalanceSheet(legalEntityId: string): Promise<{
		assets: { currentAccounts: TrialBalanceAccountItem[]; nonCurrentAccounts: TrialBalanceAccountItem[]; current: number; nonCurrent: number; total: number };
		liabilities: { currentAccounts: TrialBalanceAccountItem[]; nonCurrentAccounts: TrialBalanceAccountItem[]; current: number; nonCurrent: number; total: number };
		equity: { accounts: TrialBalanceAccountItem[]; total: number };
		retainedEarnings: number;
		totalLiabilitiesAndEquity: number;
	}> {
		const trialBalanceAccounts = await this.getTrialBalance(legalEntityId);

		const assetsList: TrialBalanceAccountItem[] = [];
		const liabilitiesList: TrialBalanceAccountItem[] = [];
		const equityList: TrialBalanceAccountItem[] = [];

		let totalAssets = 0;
		let totalLiabilities = 0;
		let totalEquity = 0;

		trialBalanceAccounts.forEach(acc => {
			const balance = acc.debitBalance - acc.creditBalance;
			const accountDetail: TrialBalanceAccountItem = { ...acc, balance };

			if (acc.accountType === "asset") {
				assetsList.push(accountDetail);
				totalAssets += balance;
			} else if (acc.accountType === "liability") {
				liabilitiesList.push(accountDetail);
				totalLiabilities -= balance;
			} else if (acc.accountType === "equity") {
				equityList.push(accountDetail);
				totalEquity -= balance;
			}
		});

		const currentAssetsAccounts = assetsList.filter(acc => acc.accountCode.startsWith("10") || acc.accountCode.startsWith("11") || acc.accountCode.startsWith("12") || acc.accountCode.startsWith("13"));
		const nonCurrentAssetsAccounts = assetsList.filter(acc => acc.accountCode.startsWith("2"));

		const currentLiabilitiesAccounts = liabilitiesList.filter(acc => acc.accountCode.startsWith("30") || acc.accountCode.startsWith("31") || acc.accountCode.startsWith("33"));
		const nonCurrentLiabilitiesAccounts = liabilitiesList.filter(acc => acc.accountCode.startsWith("40") || acc.accountCode.startsWith("41"));

		const currentAssetsTotal = currentAssetsAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
		const nonCurrentAssetsTotal = nonCurrentAssetsAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

		const currentLiabilitiesTotal = currentLiabilitiesAccounts.reduce((sum, acc) => sum - (acc.balance || 0), 0);
		const nonCurrentLiabilitiesTotal = nonCurrentLiabilitiesAccounts.reduce((sum, acc) => sum - (acc.balance || 0), 0);

		const incomeStatement = await this.getIncomeStatement(legalEntityId);
		const retainedEarningsOrCurrentYearNetIncome = incomeStatement.netIncome;

		const reportedEquityTotal = totalEquity + retainedEarningsOrCurrentYearNetIncome;

		return {
			assets: {
				currentAccounts: currentAssetsAccounts,
				nonCurrentAccounts: nonCurrentAssetsAccounts,
				current: currentAssetsTotal,
				nonCurrent: nonCurrentAssetsTotal,
				total: totalAssets,
			},
			liabilities: {
				currentAccounts: currentLiabilitiesAccounts,
				nonCurrentAccounts: nonCurrentLiabilitiesAccounts,
				current: currentLiabilitiesTotal,
				nonCurrent: nonCurrentLiabilitiesTotal,
				total: totalLiabilities,
			},
			equity: {
				accounts: equityList,
				total: reportedEquityTotal,
			},
			retainedEarnings: retainedEarningsOrCurrentYearNetIncome,
			totalLiabilitiesAndEquity: totalLiabilities + reportedEquityTotal,
		};
	}

	async getIncomeStatement(legalEntityId: string): Promise<{
		revenueItems: TrialBalanceAccountItem[];
		expenseItems: TrialBalanceAccountItem[];
		revenue: { total: number };
		costOfSales?: { total: number };
		grossProfit?: number;
		operatingExpenses?: { total: number };
		operatingIncome?: number;
		otherIncome?: { total: number };
		otherExpenses?: { total: number };
		incomeBeforeTax?: number;
		incomeTax?: { total: number };
		netIncome: number;
	}> {
		const trialBalanceAccounts = await this.getTrialBalance(legalEntityId);

		const revenueAccounts = trialBalanceAccounts.filter((acc) => acc.accountType === "revenue");
		const expenseAccounts = trialBalanceAccounts.filter((acc) => acc.accountType === "expense");

		const totalRevenue = revenueAccounts.reduce(
			(sum, acc) => sum + acc.creditBalance - acc.debitBalance,
			0,
		);
		const totalExpenses = expenseAccounts.reduce(
			(sum, acc) => sum + acc.debitBalance - acc.creditBalance,
			0,
		);

		return {
			revenueItems: revenueAccounts,
			expenseItems: expenseAccounts,
			revenue: { total: totalRevenue },
			operatingExpenses: { total: totalExpenses },
			netIncome: totalRevenue - totalExpenses,
		};
	}
}
