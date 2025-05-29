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
} from "@accounting-kz/db";

export class AccountingService {
	constructor(private db: Database) {}

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

	async getAccountById(id: string): Promise<Account | null> {
		const [account] = await this.db
			.select()
			.from(accounts)
			.where(eq(accounts.id, id))
			.limit(1);

		return account || null;
	}

	async getAccountByCode(code: string): Promise<Account | null> {
		const [account] = await this.db
			.select()
			.from(accounts)
			.where(eq(accounts.code, code))
			.limit(1);

		return account || null;
	}

	async getAccounts(): Promise<Account[]> {
		return await this.db
			.select()
			.from(accounts)
			.where(eq(accounts.isActive, true))
			.orderBy(asc(accounts.code));
	}

	async getAccountsByType(accountType: AccountType): Promise<Account[]> {
		return await this.db
			.select()
			.from(accounts)
			.where(
				and(eq(accounts.accountType, accountType), eq(accounts.isActive, true)),
			)
			.orderBy(asc(accounts.code));
	}

	async getChildAccounts(parentId: string): Promise<Account[]> {
		return await this.db
			.select()
			.from(accounts)
			.where(and(eq(accounts.parentId, parentId), eq(accounts.isActive, true)))
			.orderBy(asc(accounts.code));
	}

	async getAccountHierarchy(): Promise<Account[]> {
		// Get all accounts and organize them hierarchically
		const allAccounts = await this.getAccounts();
		return this.buildAccountTree(allAccounts);
	}

	private buildAccountTree(
		accounts: Account[],
		parentId: string | null = null,
	): Account[] {
		return accounts
			.filter((account) => account.parentId === parentId)
			.map((account) => ({
				...account,
				children: this.buildAccountTree(accounts, account.id),
			}));
	}

	// ===== JOURNAL ENTRY OPERATIONS =====

	async createJournalEntry(
		entryData: Omit<NewJournalEntry, "totalDebit" | "totalCredit">,
		lines: Omit<NewJournalEntryLine, "journalEntryId" | "lineNumber">[],
	): Promise<JournalEntry | null> {
		try {
			
		
		return await this.db.transaction(async (trx) => {
			// Calculate totals
			const totalDebit = lines.reduce(
				(sum, line) => sum + (line.debitAmount || 0),
				0,
			);
			const totalCredit = lines.reduce(
				(sum, line) => sum + (line.creditAmount || 0),
				0,
			);

			if (totalDebit !== totalCredit) {
				throw new Error(
					`Debits (${totalDebit}) must equal credits (${totalCredit})`,
				);
			}

			// Create journal entry
			const [entry] = await trx
				.insert(journalEntries)
				.values({
					...entryData,
					totalDebit: totalDebit,
					totalCredit: totalCredit,
				})
				.returning();

			// Create journal entry lines
			const entryLines = lines.map((line, index) => ({
				...line,
				journalEntryId: entry.id,
				lineNumber: index + 1,
			}));

			await trx.insert(journalEntryLines).values(entryLines);

			return entry;
		});
		} catch (error) {
			console.log(error)
			return null;
		}
	}

	async postJournalEntry(entryId: string): Promise<void> {
		await this.db.transaction(async (trx) => {
			// Get journal entry and lines
			const [entry] = await trx
				.select()
				.from(journalEntries)
				.where(eq(journalEntries.id, entryId))
				.limit(1);

			if (!entry) {
				throw new Error("Journal entry not found");
			}

			if (entry.status === "posted") {
				throw new Error("Journal entry already posted");
			}

			const lines = await trx
				.select()
				.from(journalEntryLines)
				.where(eq(journalEntryLines.journalEntryId, entryId));

			// Update journal entry status
			await trx
				.update(journalEntries)
				.set({ status: "posted" })
				.where(eq(journalEntries.id, entryId));

			// Post to general ledger
			for (const line of lines) {
				const runningBalance = await this.calculateRunningBalance(
					trx,
					line.accountId,
					line.debitAmount - line.creditAmount,
				);

				await trx.insert(generalLedger).values({
					accountId: line.accountId,
					journalEntryLineId: line.id,
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
	): Promise<number> {
		const [lastEntry] = await trx
			.select()
			.from(generalLedger)
			.where(eq(generalLedger.accountId, accountId))
			.orderBy(desc(generalLedger.createdAt))
			.limit(1);

		const previousBalance = lastEntry?.runningBalance || 0;
		return previousBalance + changeAmount;
	}

	async getJournalEntries(): Promise<JournalEntry[]> {
		return await this.db
			.select()
			.from(journalEntries)
			.orderBy(desc(journalEntries.entryDate));
	}

	async getJournalEntryById(id: string): Promise<JournalEntry | null> {
		const [entry] = await this.db
			.select()
			.from(journalEntries)
			.where(eq(journalEntries.id, id))
			.limit(1);

		return entry || null;
	}

	async getJournalEntryLines(entryId: string): Promise<JournalEntryLine[]> {
		return await this.db
			.select()
			.from(journalEntryLines)
			.where(eq(journalEntryLines.journalEntryId, entryId))
			.orderBy(asc(journalEntryLines.lineNumber));
	}

	// ===== REPORTING OPERATIONS =====

	async getTrialBalance(): Promise<
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
				accountId: generalLedger.accountId,
				accountCode: accounts.code,
				accountName: accounts.name,
				accountType: accounts.accountType,
				totalDebits: sql<number>`COALESCE(SUM(${generalLedger.debitAmount}), 0)`,
				totalCredits: sql<number>`COALESCE(SUM(${generalLedger.creditAmount}), 0)`,
			})
			.from(generalLedger)
			.innerJoin(accounts, eq(generalLedger.accountId, accounts.id))
			.groupBy(
				generalLedger.accountId,
				accounts.code,
				accounts.name,
				accounts.accountType,
			)
			.orderBy(asc(accounts.code));

		return result.map((row) => {
			const netBalance = row.totalDebits - row.totalCredits;
			const isDebitBalance = ["asset", "expense"].includes(
				row.accountType as string,
			);

			return {
				accountCode: row.accountCode,
				accountName: row.accountName,
				accountType: row.accountType,
				debitBalance: isDebitBalance && netBalance > 0 ? netBalance : 0,
				creditBalance:
					!isDebitBalance && netBalance < 0
						? Math.abs(netBalance)
						: isDebitBalance && netBalance < 0
							? Math.abs(netBalance)
							: !isDebitBalance && netBalance > 0
								? netBalance
								: 0,
			};
		});
	}

	async getAccountLedger(accountId: string): Promise<
		{
			transactionDate: string;
			description: string | null;
			debitAmount: number;
			creditAmount: number;
			runningBalance: number;
			entryNumber: string;
		}[]
	> {
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
			.where(eq(generalLedger.accountId, accountId))
			.orderBy(
				asc(generalLedger.transactionDate),
				asc(generalLedger.createdAt),
			);

		return result;
	}

	async getBalanceSheet(): Promise<{
		assets: { current: number; nonCurrent: number; total: number };
		liabilities: { current: number; nonCurrent: number; total: number };
		equity: { total: number };
	}> {
		const accounts = await this.getTrialBalance();

		const assets = accounts.filter((acc) => acc.accountType === "asset");
		const liabilities = accounts.filter(
			(acc) => acc.accountType === "liability",
		);
		const equity = accounts.filter((acc) => acc.accountType === "equity");

		// Simplified categorization - in practice you'd have more sophisticated logic
		const currentAssets = assets.filter((acc) =>
			acc.accountCode.startsWith("11"),
		); // 1100-1199
		const nonCurrentAssets = assets.filter((acc) =>
			acc.accountCode.startsWith("12"),
		); // 1200+

		const currentLiabilities = liabilities.filter((acc) =>
			acc.accountCode.startsWith("20"),
		); // 2000-2099
		const nonCurrentLiabilities = liabilities.filter((acc) =>
			acc.accountCode.startsWith("21"),
		); // 2100+

		return {
			assets: {
				current: currentAssets.reduce((sum, acc) => sum + acc.debitBalance, 0),
				nonCurrent: nonCurrentAssets.reduce(
					(sum, acc) => sum + acc.debitBalance,
					0,
				),
				total: assets.reduce((sum, acc) => sum + acc.debitBalance, 0),
			},
			liabilities: {
				current: currentLiabilities.reduce(
					(sum, acc) => sum + acc.creditBalance,
					0,
				),
				nonCurrent: nonCurrentLiabilities.reduce(
					(sum, acc) => sum + acc.creditBalance,
					0,
				),
				total: liabilities.reduce((sum, acc) => sum + acc.creditBalance, 0),
			},
			equity: {
				total: equity.reduce((sum, acc) => sum + acc.creditBalance, 0),
			},
		};
	}

	async getIncomeStatement(): Promise<{
		revenue: { total: number };
		expenses: { total: number };
		netIncome: number;
	}> {
		const accounts = await this.getTrialBalance();

		const revenue = accounts.filter((acc) => acc.accountType === "revenue");
		const expenses = accounts.filter((acc) => acc.accountType === "expense");

		const totalRevenue = revenue.reduce(
			(sum, acc) => sum + acc.creditBalance,
			0,
		);
		const totalExpenses = expenses.reduce(
			(sum, acc) => sum + acc.debitBalance,
			0,
		);

		return {
			revenue: { total: totalRevenue },
			expenses: { total: totalExpenses },
			netIncome: totalRevenue - totalExpenses,
		};
	}
}
