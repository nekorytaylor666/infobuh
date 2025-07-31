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
			const existingAccountCodes = new Set(existingAccounts.map(acc => acc.code));

			const missingAccounts = kazakhstanChartOfAccounts.filter(
				acc => !existingAccountCodes.has(acc.code),
			);

			if (missingAccounts.length > 0) {
				console.log(`💡 Found ${missingAccounts.length} missing accounts for LE ${legalEntityId}. Seeding...`);
				const createdAccounts = await this.createAccountsInBatches(
					missingAccounts,
					legalEntityId,
					existingAccounts,
				);

				console.log(`✅ Created ${createdAccounts.length} new accounts for LE ${legalEntityId}`);
			} else {
				console.log(`💡 Accounts for LE ${legalEntityId} are already up-to-date, skipping...`);
			}


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

			const bankAccount = await this.accountingService.getAccountByCode("1030", legalEntityId);
			const salesRevenue = await this.accountingService.getAccountByCode("6010", legalEntityId);
			const adminExpenses = await this.accountingService.getAccountByCode("7210", legalEntityId);
			const rawMaterials = await this.accountingService.getAccountByCode("1310", legalEntityId);
			const tradePayables = await this.accountingService.getAccountByCode("3310", legalEntityId);
			const shareCapital = await this.accountingService.getAccountByCode("5010", legalEntityId);

			if (!bankAccount || !salesRevenue || !adminExpenses || !rawMaterials || !tradePayables || !shareCapital) {
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
					description: "Administrative expenses",
					entries: [
						{ account: adminExpenses, debit: 20000000, credit: 0 },
						{ account: bankAccount, debit: 0, credit: 20000000 },
					],
				},
				{
					description: "Purchase of raw materials on credit",
					entries: [
						{ account: rawMaterials, debit: 5000000, credit: 0 },
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
				const entryNumber = `JE-${legalEntityId.substring(0, 4)}-${String(index + 1).padStart(4, "0")}`;
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

				if (!entry.success) {
					console.error(`❌ Failed to create journal entry for LE ${legalEntityId}: ${entryNumber}`, entry.error);
					continue;
				}

				transactionCount++;

				console.log(
					`✅ Created transaction for LE ${legalEntityId}: ${entryNumber} - ${transaction.description}`,
				);
			}

			console.log(`🎉 Sample transactions for LE ${legalEntityId} created successfully!`);

			return {
				message: `Sample transactions for LE ${legalEntityId} created successfully`,
				transactions: transactionCount,
			};
		} catch (error) {
			console.error(`❌ Error creating sample transactions for LE ${legalEntityId}:`, error);
			throw error;
		}
	}

	private async createAccountsInBatches(
		accounts: typeof kazakhstanChartOfAccounts,
		legalEntityId: string,
		existingAccounts: Account[] = [],
	): Promise<Account[]> {
		const allCreatedAccounts: Account[] = [];
		const accountMap = new Map<string, Account>();
		existingAccounts.forEach(account => {
			accountMap.set(account.code, account);
		});

		// First batch: Create root accounts
		const rootAccountsData = accounts
			.filter(acc => !acc.parentCode)
			.map(accountData => {
				const { parentCode, ...accountTemplate } = accountData;
				return {
					...(accountTemplate as Omit<NewAccount, "legalEntityId" | "parentId">),
					legalEntityId: legalEntityId,
				} as NewAccount;
			});

		if (rootAccountsData.length > 0) {
			const rootAccounts = await this.accountingService.createAccountsBulk(rootAccountsData);
			allCreatedAccounts.push(...rootAccounts);

			// Build map for parent lookups
			rootAccounts.forEach(account => {
				accountMap.set(account.code, account);
			});

			console.log(`✅ Created ${rootAccounts.length} root accounts in bulk`);
		}

		// Process child accounts in levels
		let remainingAccounts = accounts.filter(acc => acc.parentCode);
		let level = 1;

		while (remainingAccounts.length > 0) {
			const currentLevelAccounts: NewAccount[] = [];
			const nextLevelAccounts: typeof remainingAccounts = [];

			for (const accountData of remainingAccounts) {
				const parentAccount = accountMap.get(accountData.parentCode!);
				if (parentAccount) {
					const { parentCode, ...accountTemplate } = accountData;
					const accountToCreate: NewAccount = {
						...(accountTemplate as Omit<NewAccount, "legalEntityId" | "parentId">),
						legalEntityId: legalEntityId,
						parentId: parentAccount.id,
					};
					currentLevelAccounts.push(accountToCreate);
				} else {
					nextLevelAccounts.push(accountData);
				}
			}

			if (currentLevelAccounts.length === 0 && nextLevelAccounts.length > 0) {
				console.error(`❌ Unable to resolve parent relationships for ${nextLevelAccounts.length} accounts at level ${level}`);
				break;
			}

			if (currentLevelAccounts.length > 0) {
				const levelAccounts = await this.accountingService.createAccountsBulk(currentLevelAccounts);
				allCreatedAccounts.push(...levelAccounts);

				// Add to map for next level
				levelAccounts.forEach(account => {
					accountMap.set(account.code, account);
				});

				console.log(`✅ Created ${levelAccounts.length} accounts at level ${level} in bulk`);
			}

			remainingAccounts = nextLevelAccounts;
			level++;
		}

		return allCreatedAccounts;
	}
}


// Run seeding if this file is run directly
async function runSeeding() {
	const defaultTestUserId = "1bfd1699-c849-43bb-8e23-f528f3bd4a0c";

	const dbUrl = process.env.DATABASE_URL;
	if (!dbUrl) {
		console.error("❌ DATABASE_URL environment variable is not set.");
		process.exit(1);
	}
	const dbClient = createDbClient(dbUrl);
	const seedService = new AccountingSeedService(dbClient);

	// Get all legal entities from the database
	const legalEntities = await dbClient.query.legalEntities.findMany({
		columns: {
			id: true,
			name: true,
		},
	});

	if (legalEntities.length === 0) {
		console.log("❌ No legal entities found in the database.");
		process.exit(1);
	}

	console.log(`🌱 Found ${legalEntities.length} legal entities. Starting seeding process...`);

	// Seed all legal entities
	for (const legalEntity of legalEntities) {
		console.log(`\n📋 Seeding legal entity: ${legalEntity.name} (${legalEntity.id})`);
		try {
			await seedService.seedDatabase(legalEntity.id, defaultTestUserId);
			console.log(`✅ Successfully seeded: ${legalEntity.name}`);
		} catch (error) {
			console.error(`❌ Failed to seed ${legalEntity.name}:`, error);
		}
	}

	console.log(`\n🎉 Seeding process completed for ${legalEntities.length} legal entities!`);
}

if (require.main === module) {
	runSeeding().catch(console.error);
}
