import { AccountingService } from "./accounting-service.index";
import {
	baseCurrency,
	additionalCurrencies,
	kazakhstanChartOfAccounts,
} from "./seed-data";
import { createDbClient, type Account, type Database } from "@accounting-kz/db";

export class AccountingSeedService {
	private accountingService: AccountingService;

	constructor(private db: Database) {
		this.accountingService = new AccountingService(db);
	}

	async seedDatabase(): Promise<{
		currencies: number;
		accounts: number;
		message: string;
	}> {
		try {
			console.log("🌱 Starting accounting database seeding...");

			// 1. Seed currencies
			console.log("📱 Creating currencies...");

			// Create base currency
			const existingBaseCurrency = await this.accountingService.getCurrencies();
			if (existingBaseCurrency.length === 0) {
				await this.accountingService.createCurrency(baseCurrency);
				console.log(`✅ Created base currency: ${baseCurrency.code}`);

				// Create additional currencies
				for (const currency of additionalCurrencies) {
					await this.accountingService.createCurrency(currency);
					console.log(`✅ Created currency: ${currency.code}`);
				}
			} else {
				console.log("💡 Currencies already exist, skipping...");
			}

			// 2. Seed chart of accounts
			console.log("📊 Creating chart of accounts...");

			const existingAccounts = await this.accountingService.getAccounts();
			if (existingAccounts.length === 0) {
				const accountMap = new Map<string, Account>();

				// First pass: Create accounts without parent references
				for (const accountData of kazakhstanChartOfAccounts) {
					if (!accountData.parentCode) {
						const { parentCode, ...accountToCreate } = accountData;
						const account =
							await this.accountingService.createAccount(accountToCreate);
						accountMap.set(account.code, account);
						console.log(
							`✅ Created root account: ${account.code} - ${account.name}`,
						);
					}
				}

				// Subsequent passes: Create child accounts
				let remainingAccounts = kazakhstanChartOfAccounts.filter(
					(acc) => acc.parentCode,
				);
				let previousCount = remainingAccounts.length;

				while (remainingAccounts.length > 0) {
					const currentPass: typeof remainingAccounts = [];

					for (const accountData of remainingAccounts) {
						const parentAccount = accountMap.get(accountData.parentCode!);

						if (parentAccount) {
							const { parentCode, ...accountToCreate } = accountData;
							const account = await this.accountingService.createAccount({
								...accountToCreate,
								parentId: parentAccount.id,
							});
							accountMap.set(account.code, account);
							console.log(
								`✅ Created account: ${account.code} - ${account.name} (parent: ${parentAccount.code})`,
							);
						} else {
							currentPass.push(accountData);
						}
					}

					remainingAccounts = currentPass;

					// Prevent infinite loop
					if (remainingAccounts.length === previousCount) {
						console.error(
							"❌ Unable to resolve all parent-child relationships",
						);
						console.error(
							"Remaining accounts:",
							remainingAccounts.map(
								(acc) => `${acc.code} (parent: ${acc.parentCode})`,
							),
						);
						break;
					}
					previousCount = remainingAccounts.length;
				}

				console.log(`✅ Created ${accountMap.size} accounts`);
			} else {
				console.log("💡 Accounts already exist, skipping...");
			}

			const transactions = await this.createSampleTransactions()
			// 3. Summary
			const currencies = await this.accountingService.getCurrencies();
			const accounts = await this.accountingService.getAccounts();

			const result = {
				currencies: currencies.length,
				accounts: accounts.length,
				message:
					"Database seeded successfully with Kazakhstan chart of accounts",
			};

			console.log("🎉 Seeding completed successfully!");
			console.log(`📱 Currencies: ${result.currencies}`);
			console.log(`📊 Accounts: ${result.accounts}`);
			console.log(`Transactions seed: ${transactions.transactions}`)
			

			return result;
		} catch (error) {
			console.error("❌ Error seeding database:", error);
			throw error;
		}
	}

	async createSampleTransactions(): Promise<{
		message: string;
		transactions: number;
	}> {
		try {
			console.log("💰 Creating sample transactions...");

			const baseCurrency = await this.accountingService.getBaseCurrency();
			const existingEntries = await this.accountingService.getJournalEntries();

			if (existingEntries.length > 0) {
				return {
					message: "Sample transactions already exist",
					transactions: existingEntries.length,
				};
			}

			// Get required accounts
			const bankAccount = await this.accountingService.getAccountByCode("1112"); // Bank Account - KZT
			const salesRevenue =
				await this.accountingService.getAccountByCode("4110"); // Sales Revenue
			const salariesExpense =
				await this.accountingService.getAccountByCode("6110"); // Salaries and Wages
			const officeSupplies =
				await this.accountingService.getAccountByCode("6120"); // Office Supplies
			const tradePayables =
				await this.accountingService.getAccountByCode("2111"); // Trade Payables
			const shareCapital =
				await this.accountingService.getAccountByCode("3100"); // Share Capital

			if (
				!bankAccount ||
				!salesRevenue ||
				!salariesExpense ||
				!officeSupplies ||
				!tradePayables ||
				!shareCapital
			) {
				throw new Error(
					"Required accounts not found. Please seed accounts first.",
				);
			}

			// Sample transactions using amounts in tenge (multiply by 100 for smallest unit representation)
			const transactions = [
				{
					description: "Initial capital investment",
					entries: [
						{ account: bankAccount, debit: 100000000, credit: 0 }, // 1,000,000 KZT
						{ account: shareCapital, debit: 0, credit: 100000000 },
					],
				},
				{
					description: "Sales revenue for consulting services",
					entries: [
						{ account: bankAccount, debit: 50000000, credit: 0 }, // 500,000 KZT
						{ account: salesRevenue, debit: 0, credit: 50000000 },
					],
				},
				{
					description: "Monthly salary payments",
					entries: [
						{ account: salariesExpense, debit: 20000000, credit: 0 }, // 200,000 KZT
						{ account: bankAccount, debit: 0, credit: 20000000 },
					],
				},
				{
					description: "Purchase of office supplies on credit",
					entries: [
						{ account: officeSupplies, debit: 5000000, credit: 0 }, // 50,000 KZT
						{ account: tradePayables, debit: 0, credit: 5000000 },
					],
				},
				{
					description: "Payment to supplier",
					entries: [
						{ account: tradePayables, debit: 5000000, credit: 0 }, // 50,000 KZT
						{ account: bankAccount, debit: 0, credit: 5000000 },
					],
				},
			];

			let transactionCount = 0;

			for (const [index, transaction] of transactions.entries()) {
				const entryNumber = `JE${String(index + 1).padStart(4, "0")}`;
				const entryDate = new Date(2024, 0, 1 + index * 7)
					.toISOString()
					.split("T")[0]; // Weekly intervals

				const entry = await this.accountingService.createJournalEntry(
					{
						entryNumber,
						entryDate,
						description: transaction.description,
						currencyId: baseCurrency.id,
						status: "draft",
						createdBy: "40309566-fdc6-4b8e-9bb7-68c15f7ce335", // In real app, this would be user ID
					},
					transaction.entries.map((line, lineIndex) => ({
						lineNumber: lineIndex + 1,
						accountId: line.account.id,
						debitAmount: line.debit,
						creditAmount: line.credit,
						description: transaction.description,
					})),
				);

				if (!entry) {
					console.error(`❌ Failed to create journal entry: ${entryNumber}`);
					continue;
				}

				// Post the journal entry
				await this.accountingService.postJournalEntry(entry.id);
				transactionCount++;

				console.log(
					`✅ Created and posted transaction: ${entryNumber} - ${transaction.description}`,
				);
			}

			console.log("🎉 Sample transactions created successfully!");

			return {
				message: "Sample transactions created and posted successfully",
				transactions: transactionCount,
			};
		} catch (error) {
			console.error("❌ Error creating sample transactions:", error);
			throw error;
		}
	}
}


// Run seeding if this file is run directly
if (require.main === module) {
	const dbClient = createDbClient(process.env.DATABASE_URL!);
	const seedService = new AccountingSeedService(dbClient);

	seedService
		.seedDatabase()
		.then((result) => {
			console.log("✅ Seeding completed successfully!");
			console.log(result);
			process.exit(0);
		})
		.catch((error) => {
			console.error("❌ Seeding failed:", error);
			process.exit(1);
		});
}

