/**
 * Test script for the Accounting System
 * Run this to test all accounting functionality
 */

import { accounts, and, createDbClient, eq } from "@accounting-kz/db";

const BASE_URL = "http://localhost:3000/accounting";
// Define a placeholder Legal Entity ID. 
// !! REPLACE THIS with an actual legalEntityId from your test data or seed script !!
const testLegalEntityId = "fe4d7f2a-adda-4db9-9d18-772bded63c29"; 

interface ApiResponse<T = any> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

interface Currency {
	id: string;
	code: string;
	name: string;
	symbol: string;
}

interface Account {
	id: string;
	code: string;
	name: string;
	accountType: string;
}

interface JournalEntry {
	id: string;
	entryNumber: string;
	description: string;
	entryDate: string;
	status: string;
}

async function makeRequest<T>(
	path: string, // Renamed from url to path for clarity, as BASE_URL is prepended
	options?: RequestInit,
	isLegalEntityScoped: boolean = true, // Flag to indicate if legalEntityId should be added
): Promise<ApiResponse<T>> {
	try {
		let fullPath = path;
		if (isLegalEntityScoped && testLegalEntityId) {
			fullPath = path.includes('?') ? `${path}&legalEntityId=${testLegalEntityId}` : `${path}?legalEntityId=${testLegalEntityId}`;
		}

		const response = await fetch(`${BASE_URL}${fullPath}`, {
			headers: {
				"Content-Type": "application/json",
				// Assuming your auth middleware sets a test user ID, if not, you might need a test token
				// "Authorization": "Bearer your_test_jwt_token_if_needed"
				...options?.headers,
			},
			...options,
		});

		return await response.json();
	} catch (error) {
		console.error(`Request failed: ${BASE_URL}${path}`, error);
		throw error;
	}
}

async function testAccountingSystem() {
	console.log("🧪 Testing Accounting System");
	console.log("=".repeat(50));

	try {
		// 1. Test basic connectivity (not legal entity scoped)
		console.log("\n1. Testing system connectivity...");
		const testResponse = await makeRequest("/test", {}, false); 
		console.log("✅ System test:", testResponse);

		// 2. Seed the database (not legal entity scoped)
		console.log("\n2. Seeding database...");
		const seedResponse = await makeRequest("/seed", { method: "POST" }, false);
		console.log("✅ Database seeded:", seedResponse);

		// 3. Create sample transactions (not legal entity scoped, assuming seed handles LE association if needed)
		console.log("\n3. Creating sample transactions...");
		const transactionsResponse = await makeRequest("/seed/transactions", {
			method: "POST",
		}, false);
		console.log("✅ Sample transactions:", transactionsResponse);

		// 4. Test currencies (assuming global, not legal entity scoped)
		console.log("\n4. Testing currencies...");
		const currenciesResponse = await makeRequest<Currency[]>("/currencies", {}, false);
		console.log(
			"✅ Currencies:",
			currenciesResponse.data?.length || 0,
			"currencies found",
		);
		console.log(
			"Currencies:",
			currenciesResponse.data?.map((c: Currency) => `${c.code} (${c.name})`) || [],
		);

		// 5. Test accounts (scoped to legalEntityId)
		console.log("\n5. Testing accounts...");
		const accountsResponse = await makeRequest<Account[]>("/accounts"); // Will add legalEntityId by default
		console.log(
			"✅ Accounts:",
			accountsResponse.data?.length || 0,
			"accounts found",
		);

		// 6. Test account hierarchy (scoped to legalEntityId)
		console.log("\n6. Testing account hierarchy...");
		const hierarchyResponse = await makeRequest<Account[]>("/accounts/hierarchy"); // Will add legalEntityId
		console.log("✅ Account hierarchy loaded");
		console.log(
			"Root accounts:",
			hierarchyResponse.data?.map((a: Account) => `${a.code} - ${a.name}`) || [],
		);

		// 7. Test journal entries
		console.log("\n7. Testing journal entries...");
		const entriesResponse = await makeRequest<JournalEntry[]>("/journal-entries");
		console.log(
			"✅ Journal entries:",
			entriesResponse.data?.length || 0,
			"entries found",
		);

		if (entriesResponse.data && entriesResponse.data.length > 0) {
			const firstEntry = entriesResponse.data[0];
			console.log(
				"Sample entry:",
				firstEntry.entryNumber,
				"-",
				firstEntry.description,
			);

			// Get detailed entry
			const entryDetailResponse = await makeRequest(
				`/journal-entries/${firstEntry.id}`,
			);
			console.log(
				"Entry details:",
				(entryDetailResponse.data as any)?.lines?.length || 0,
				"lines",
			);
		}

		// 8. Test reports
		console.log("\n8. Testing reports...");

		// Trial Balance
		const trialBalanceResponse = await makeRequest("/reports/trial-balance");
		console.log("✅ Trial Balance:");
		console.log(
			"  Total Accounts:",
			(trialBalanceResponse.data as any)?.accounts?.length || 0,
		);
		console.log("  Total Debits:", (trialBalanceResponse.data as any)?.totals?.debits || 0);
		console.log("  Total Credits:", (trialBalanceResponse.data as any)?.totals?.credits || 0);
		console.log(
			"  Balanced:",
			(trialBalanceResponse.data as any)?.totals?.balanced ? "✅" : "❌",
		);

		// Balance Sheet
		const balanceSheetResponse = await makeRequest("/reports/balance-sheet");
		console.log("✅ Balance Sheet:");
		console.log("  Assets:", (balanceSheetResponse.data as any)?.assets?.total || 0);
		console.log(
			"  Liabilities:",
			(balanceSheetResponse.data as any)?.liabilities?.total || 0,
		);
		console.log("  Equity:", (balanceSheetResponse.data as any)?.equity?.total || 0);

		// Income Statement
		const incomeStatementResponse = await makeRequest(
			"/reports/income-statement",
		);
		console.log("✅ Income Statement:");
		console.log("  Revenue:", (incomeStatementResponse.data as any)?.revenue?.total || 0);
		console.log("  Expenses:", (incomeStatementResponse.data as any)?.expenses?.total || 0);
		console.log("  Net Income:", (incomeStatementResponse.data as any)?.netIncome || 0);

		// 9. Test account ledger
		console.log("\n9. Testing account ledger...");
		const accountsData = accountsResponse.data;
		if (accountsData && accountsData.length > 0) {
			const bankAccount = accountsData.find((a: Account) => a.code === "1112");
			if (bankAccount) {
				const ledgerResponse = await makeRequest(
					`/accounts/${bankAccount.id}/ledger`,
				);
				console.log(
					"✅ Bank Account Ledger:",
					(ledgerResponse.data as any[])?.length || 0,
					"transactions",
				);

				if (ledgerResponse.data && (ledgerResponse.data as any[]).length > 0) {
					console.log("Recent transactions:");
					(ledgerResponse.data as any[]).slice(0, 3).forEach((tx: any) => {
						console.log(
							`  ${tx.transactionDate}: ${tx.description} | Debit: ${tx.debitAmount} | Credit: ${tx.creditAmount} | Balance: ${tx.runningBalance}`,
						);
					});
				}
			}
		}

		console.log("\n🎉 All tests completed successfully!");
		console.log("\n📊 Summary:");
		console.log(`  ✅ ${currenciesResponse.data?.length || 0} currencies`);
		console.log(`  ✅ ${accountsResponse.data?.length || 0} accounts`);
		console.log(`  ✅ ${entriesResponse.data?.length || 0} journal entries`);
		console.log(`  ✅ Reports generated successfully`);
	} catch (error) {
		console.error("❌ Test failed:", error);
	}
}

// Example of creating a new journal entry
async function createSampleJournalEntry() {
	console.log("\n💰 Creating a new journal entry...");

	try {
		// Get currencies and accounts first
		const currenciesResponse = await makeRequest<Currency[]>("/currencies");
		const accountsResponse = await makeRequest<Account[]>("/accounts");

		if (!currenciesResponse.success || !accountsResponse.success) {
			throw new Error("Failed to get currencies or accounts");
		}

		const kztCurrency = currenciesResponse.data?.find(
			(c: Currency) => c.code === "KZT",
		);
		const bankAccount = accountsResponse.data?.find(
			(a: Account) => a.code === "1112",
		); // Bank Account - KZT
		const salesAccount = accountsResponse.data?.find(
			(a: Account) => a.code === "4110",
		); // Sales Revenue

		if (!kztCurrency || !bankAccount || !salesAccount) {
			throw new Error("Required accounts or currency not found");
		}

		const newEntry = {
			entryNumber: `JE-TEST-${Date.now()}`,
			entryDate: new Date().toISOString().split("T")[0],
			description: "Test sale transaction",
			reference: "TEST-001",
			currencyId: kztCurrency.id,
			lines: [
				{
					accountId: bankAccount.id,
					debitAmount: 100000, // 1,000 KZT (in smallest unit: 100,000 tiyn)
					creditAmount: 0,
					description: "Cash received from sale",
				},
				{
					accountId: salesAccount.id,
					debitAmount: 0,
					creditAmount: 100000, // 1,000 KZT (in smallest unit: 100,000 tiyn)
					description: "Sales revenue",
				},
			],
		};

		const createResponse = await makeRequest<JournalEntry>("/journal-entries", {
			method: "POST",
			body: JSON.stringify(newEntry),
		});

		if (createResponse.success && createResponse.data) {
			console.log("✅ Journal entry created:", createResponse.data.entryNumber);

			// Post the entry
			const postResponse = await makeRequest(
				`/journal-entries/${createResponse.data.id}/post`,
				{
					method: "POST",
				},
			);

			if (postResponse.success) {
				console.log("✅ Journal entry posted successfully");
				
				// Check the account ledger to verify posting
				console.log("\n📊 Checking account ledger after posting...");
				const ledgerResponse = await makeRequest(`/accounts/${bankAccount.id}/ledger`);
				
				if (ledgerResponse.success && ledgerResponse.data) {
					console.log(`✅ Bank account ledger has ${(ledgerResponse.data as any[]).length} transactions`);
					
					// Show the latest transaction
					const transactions = ledgerResponse.data as any[];
					if (transactions.length > 0) {
						const latestTx = transactions[transactions.length - 1];
						console.log(`   Latest: ${latestTx.transactionDate} - ${latestTx.description} | Debit: ${latestTx.debitAmount} | Balance: ${latestTx.runningBalance}`);
					}
				}
				
				// Also check trial balance
				console.log("\n📊 Checking trial balance after posting...");
				const trialBalanceResponse = await makeRequest("/reports/trial-balance");
				
				if (trialBalanceResponse.success && trialBalanceResponse.data) {
					const data = trialBalanceResponse.data as any;
					console.log(`   Debits: ${data.totals?.debits || 0}, Credits: ${data.totals?.credits || 0}`);
					console.log(`   Balanced: ${data.totals?.balanced ? "✅" : "❌"}`);
				}
				
				return createResponse.data;
			} else {
				console.log("❌ Failed to post journal entry:", postResponse.error);
				return null;
			}
		} else {
			console.log("❌ Failed to create journal entry:", createResponse.error);
			return null;
		}
	} catch (error) {
		console.error("❌ Error creating journal entry:", error);
		return null;
	}
}

async function getJournalEntries() {
	const entriesResponse = await makeRequest<JournalEntry[]>("/journal-entries");
	console.log("✅ Journal entries:", entriesResponse.data?.length || 0, "entries found");
	console.log(entriesResponse.data);
	return entriesResponse.data;
}

// Run tests
console.log("🚀 Starting Accounting System Tests");
console.log("Make sure the server is running on http://localhost:3000");
console.log("");

// Wait a bit for server to be ready
setTimeout(async () => {
	// await testAccountingSystem();
	// await createSampleJournalEntry();
	// await getJournalEntries();
	const db = createDbClient(process.env.DATABASE_URL as string);
	const account =  await db
						.select({ id: accounts.id })
						.from(accounts)
						.where(
							and(
								eq(accounts.id, "e1929fca-a409-478a-8b4f-2913f3763454"),
							),
						)
	console.log(account);
}, 1000);
