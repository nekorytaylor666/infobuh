import { AccountingService } from "./accounting-service.index";
import {
	baseCurrency,
	additionalCurrencies,
	kazakhstanChartOfAccounts,
} from "./seed-data";
import { createDbClient, type Account, type Database, type NewAccount } from "@accounting-kz/db";

export class AccountingSeedService {
	private accountingService: AccountingService;
	private defaultUserId = "40309566-fdc6-4b8e-9bb7-68c15f7ce335"; // Placeholder for createdBy

	constructor(private db: Database) {
		this.accountingService = new AccountingService(db);
	}

	async seedDatabase(legalEntityId: string, userId?: string): Promise<{
		currencies: number;
		accounts: number;
		message: string;
	}> {
		const effectiveUserId = userId || this.defaultUserId;
		try {
			console.log(`🌱 Starting accounting database seeding for Legal Entity: ${legalEntityId}...`);

			// 1. Seed currencies (assuming currencies are global and not per-LE)
			console.log("📱 Creating currencies...");
			const existingBaseCurrency = await this.accountingService.getCurrencies();
			if (existingBaseCurrency.length === 0) {
				await this.accountingService.createCurrency(baseCurrency);
				console.log(`✅ Created base currency: ${baseCurrency.code}`);
				for (const currency of additionalCurrencies) {
					await this.accountingService.createCurrency(currency);
					console.log(`✅ Created currency: ${currency.code}`);
				}
			} else {
				console.log("💡 Currencies already exist, skipping...");
			}

			// 2. Seed chart of accounts for the given legalEntityId
			console.log(`📊 Creating chart of accounts for LE: ${legalEntityId}...`);

			const existingAccounts = await this.accountingService.getAccounts(legalEntityId);
			if (existingAccounts.length === 0) {
				const accountMap = new Map<string, Account>();

				for (const accountData of kazakhstanChartOfAccounts) {
					if (!accountData.parentCode) {
						const { parentCode, ...accountTemplate } = accountData;
						const accountToCreate: NewAccount = {
							...(accountTemplate as Omit<NewAccount, "legalEntityId" | "parentId">),
							legalEntityId: legalEntityId,
						};
						const account = await this.accountingService.createAccount(accountToCreate);
						accountMap.set(account.code, account);
						console.log(
							`✅ Created root account for LE ${legalEntityId}: ${account.code} - ${account.name}`,
						);
					}
				}

				let remainingAccounts = kazakhstanChartOfAccounts.filter(
					(acc) => acc.parentCode,
				);
				let previousCount = remainingAccounts.length;

				while (remainingAccounts.length > 0) {
					const currentPass: typeof remainingAccounts = [];
					for (const accountData of remainingAccounts) {
						const parentAccount = accountMap.get(accountData.parentCode!);
						if (parentAccount) {
							const { parentCode, ...accountTemplate } = accountData;
							const accountToCreate: NewAccount = {
								...(accountTemplate as Omit<NewAccount, "legalEntityId" | "parentId">),
								legalEntityId: legalEntityId,
								parentId: parentAccount.id,
							};
							const account = await this.accountingService.createAccount(accountToCreate);
							accountMap.set(account.code, account);
							console.log(
								`✅ Created account for LE ${legalEntityId}: ${account.code} - ${account.name} (parent: ${parentAccount.code})`,
							);
						} else {
							currentPass.push(accountData);
						}
					}
					remainingAccounts = currentPass;
					if (remainingAccounts.length === previousCount) {
						console.error(
							"❌ Unable to resolve all parent-child relationships for LE", legalEntityId
						);
						break;
					}
					previousCount = remainingAccounts.length;
				}
				console.log(`✅ Created ${accountMap.size} accounts for LE ${legalEntityId}`);
			} else {
				console.log(`💡 Accounts for LE ${legalEntityId} already exist, skipping...`);
			}

			const transactionsResult = await this.createSampleTransactions(legalEntityId, effectiveUserId);
			
			const currencies = await this.accountingService.getCurrencies(); // Global
			const accountsForLE = await this.accountingService.getAccounts(legalEntityId);

			const result = {
				currencies: currencies.length,
				accounts: accountsForLE.length,
				message:
					`Database seeded successfully with Kazakhstan chart of accounts for LE ${legalEntityId}`,
			};

			console.log("🎉 Seeding completed successfully!");
			console.log(`📱 Currencies: ${result.currencies}`);
			console.log(`📊 Accounts for LE ${legalEntityId}: ${result.accounts}`);
			console.log(`💸 Transactions seeded for LE ${legalEntityId}: ${transactionsResult.transactions}`);
			
			return result;
		} catch (error) {
			console.error(`❌ Error seeding database for LE ${legalEntityId}:`, error);
			throw error;
		}
	}

	async createSampleTransactions(legalEntityId: string, userId: string): Promise<{
		message: string;
		transactions: number;
	}> {
		try {
			console.log(`💰 Creating sample transactions for LE: ${legalEntityId}...`);

			const baseCurrency = await this.accountingService.getBaseCurrency(); // Global
			const existingEntries = await this.accountingService.getJournalEntries(legalEntityId);

			if (existingEntries.length > 0) {
				return {
					message: `Sample transactions for LE ${legalEntityId} already exist`,
					transactions: existingEntries.length,
				};
			}

			const bankAccount = await this.accountingService.getAccountByCode("1112", legalEntityId);
			const salesRevenue = await this.accountingService.getAccountByCode("4110", legalEntityId);
			const salariesExpense = await this.accountingService.getAccountByCode("6110", legalEntityId);
			const officeSupplies = await this.accountingService.getAccountByCode("6120", legalEntityId);
			const tradePayables = await this.accountingService.getAccountByCode("2111", legalEntityId);
			const shareCapital = await this.accountingService.getAccountByCode("3100", legalEntityId);

			if (!bankAccount || !salesRevenue || !salariesExpense || !officeSupplies || !tradePayables || !shareCapital) {
				throw new Error(
					`Required accounts not found for LE ${legalEntityId}. Please seed accounts first.`,
				);
			}

			const transactions = [
				{
					description: "Initial capital investment",
					entries: [
						{ account: bankAccount, debit: 100000000, credit: 0 },
						{ account: shareCapital, debit: 0, credit: 100000000 },
					],
				},
				{
					description: "Sales revenue for consulting services",
					entries: [
						{ account: bankAccount, debit: 50000000, credit: 0 },
						{ account: salesRevenue, debit: 0, credit: 50000000 },
					],
				},
				{
					description: "Monthly salary payments",
					entries: [
						{ account: salariesExpense, debit: 20000000, credit: 0 },
						{ account: bankAccount, debit: 0, credit: 20000000 },
					],
				},
				{
					description: "Purchase of office supplies on credit",
					entries: [
						{ account: officeSupplies, debit: 5000000, credit: 0 },
						{ account: tradePayables, debit: 0, credit: 5000000 },
					],
				},
				{
					description: "Payment to supplier",
					entries: [
						{ account: tradePayables, debit: 5000000, credit: 0 },
						{ account: bankAccount, debit: 0, credit: 5000000 },
					],
				},
			];

			let transactionCount = 0;

			for (const [index, transaction] of transactions.entries()) {
				const entryNumber = `JE-${legalEntityId.substring(0,4)}-${String(index + 1).padStart(4, "0")}`;
				const entryDate = new Date(2024, 0, 1 + index * 7)
					.toISOString()
					.split("T")[0];

				const entry = await this.accountingService.createJournalEntry(
					{
						entryNumber,
						entryDate,
						description: transaction.description,
						currencyId: baseCurrency.id,
						status: "draft",
						createdBy: userId, 
						legalEntityId: legalEntityId, // Pass legalEntityId here
					},
					transaction.entries.map((line, lineIndex) => ({
						// lineNumber: lineIndex + 1, // createJournalEntry in service handles this
						accountId: line.account.id,
						debitAmount: line.debit,
						creditAmount: line.credit,
						description: transaction.description, // Or line specific description if available
					})),
				);

				if (!entry) {
					console.error(`❌ Failed to create journal entry for LE ${legalEntityId}: ${entryNumber}`);
					continue;
				}

				await this.accountingService.postJournalEntry(entry.id, legalEntityId, userId);
				transactionCount++;

				console.log(
					`✅ Created and posted transaction for LE ${legalEntityId}: ${entryNumber} - ${transaction.description}`,
				);
			}

			console.log(`🎉 Sample transactions for LE ${legalEntityId} created successfully!`);

			return {
				message: `Sample transactions for LE ${legalEntityId} created and posted successfully`,
				transactions: transactionCount,
			};
		} catch (error) {
			console.error(`❌ Error creating sample transactions for LE ${legalEntityId}:`, error);
			throw error;
		}
	}
}


// Run seeding if this file is run directly
if (require.main === module) {
	// !!! IMPORTANT: Replace with actual IDs for testing standalone seeding !!!
	const defaultTestLegalEntityId = ["2cc7dc33-f82a-4248-b969-f1d7902250ce", "05c5f8ca-d4e6-4a68-9e70-8482829702e2","ea881ca4-7049-4330-a1ee-aeb81c3a49b3"]; 
	const defaultTestUserId = "1bfd1699-c849-43bb-8e23-f528f3bd4a0c";

	const dbUrl = process.env.DATABASE_URL;
	if (!dbUrl) {
		console.error("❌ DATABASE_URL environment variable is not set.");
		process.exit(1);
	}
	const dbClient = createDbClient(dbUrl);
	const seedService = new AccountingSeedService(dbClient);

	seedService.seedDatabase(defaultTestLegalEntityId[0], defaultTestUserId);
	seedService.seedDatabase(defaultTestLegalEntityId[1], defaultTestUserId);
	seedService.seedDatabase(defaultTestLegalEntityId[2], defaultTestUserId);
}

