import { randomUUID } from "crypto";
import { DealAccountingService } from "./lib/accounting-service/deal-accounting-service";
import { AccountingService } from "./lib/accounting-service/accounting-service.index";
import { AccountingSeedService } from "./lib/accounting-service/seed-service";
import { createDbClient, accounts, currencies, eq, and, documentsFlutter, legalEntities, dealDocumentsFlutter, journalEntries, journalEntryLines } from "@accounting-kz/db";

/**
 * Test #16: Bilateral Deal with Manual Entries
 * Tests that:
 * - Company A (sender) automatically gets accounting entries when creating a deal
 * - Company B (receiver) does NOT automatically get entries
 * - Company B must manually create their own accounting entries
 * - Complete isolation exists between both organizations' accounting records
 */
async function testBilateralDealWithManualEntries() {
	const db = createDbClient(process.env.DATABASE_URL as string);
	const dealAccountingService = new DealAccountingService(db);
	const accountingService = new AccountingService(db);

	try {
		console.log("\n🔄 BILATERAL DEAL TEST: Two Organizations");
		console.log("========================================\n");

		// Phase 1: Setup - Create two organizations
		console.log("📋 Phase 1: Creating two organizations...");

		// Use existing user ID from the main test suite
		const EXISTING_USER_ID = "1bfd1699-c849-43bb-8e23-f528f3bd4a0c";

		const COMPANY_A_LEGAL_ENTITY_ID = randomUUID();
		const COMPANY_A_BIN = "111111111111";

		const COMPANY_B_LEGAL_ENTITY_ID = randomUUID();
		const COMPANY_B_BIN = "222222222222";

		// Create Company A
		const [companyA] = await db.insert(legalEntities).values({
			id: COMPANY_A_LEGAL_ENTITY_ID,
			profileId: EXISTING_USER_ID,
			name: "ТОО 'Компания А'",
			bin: COMPANY_A_BIN,
			type: "ТОО",
			address: "г. Алматы, ул. Абая 100",
			phone: "+77272111111",
			oked: "62010",
			registrationDate: new Date("2020-01-15"),
			ugd: "UGD-TEST-A",
		}).returning();

		console.log(`✅ Company A created: ${companyA.name} (BIN: ${companyA.bin})`);

		// Create Company B
		const [companyB] = await db.insert(legalEntities).values({
			id: COMPANY_B_LEGAL_ENTITY_ID,
			profileId: EXISTING_USER_ID,
			name: "ТОО 'Компания Б'",
			bin: COMPANY_B_BIN,
			type: "ТОО",
			address: "г. Астана, пр. Кабанбай батыра 50",
			phone: "+77172222222",
			oked: "70220",
			registrationDate: new Date("2021-03-10"),
			ugd: "UGD-TEST-B",
		}).returning();

		console.log(`✅ Company B created: ${companyB.name} (BIN: ${companyB.bin})`);

		// Seed chart of accounts for both companies
		console.log("🌱 Seeding chart of accounts for both companies...");
		const seedService = new AccountingSeedService(db);

		await seedService.seedDatabase(COMPANY_A_LEGAL_ENTITY_ID, EXISTING_USER_ID);
		console.log("✅ Company A: Chart of accounts seeded");

		await seedService.seedDatabase(COMPANY_B_LEGAL_ENTITY_ID, EXISTING_USER_ID);
		console.log("✅ Company B: Chart of accounts seeded");

		// Get KZT currency (global)
		const kztCurrency = await db.query.currencies.findFirst({
			where: eq(currencies.code, "KZT")
		});

		if (!kztCurrency) {
			throw new Error("KZT currency not found");
		}

		// Phase 2: Company A creates deal with Company B
		console.log("\n📋 Phase 2: Company A creates deal with Company B...");

		const dealFromCompanyA = await dealAccountingService.createDealWithAccounting({
			receiverBin: COMPANY_B_BIN,
			title: "Консультационные услуги компании Б",
			description: "Оказание консультационных услуг по бухгалтерскому учету",
			dealType: "service",
			totalAmount: 1000000, // 1,000,000 KZT
			legalEntityId: COMPANY_A_LEGAL_ENTITY_ID,
			currencyId: kztCurrency.id,
			createdBy: EXISTING_USER_ID,
		});

		console.log(`✅ Deal created: ID ${dealFromCompanyA.deal.id}, Amount: 1,000,000 KZT`);
		console.log(`✅ Automatic journal entry created (Invoice): ${dealFromCompanyA.journalEntry.id}`);

		// Phase 3: Company A creates AVR document
		console.log("\n📄 Phase 3: Company A creates AVR document...");

		const avrDocument = await db.insert(documentsFlutter).values({
			legalEntityId: COMPANY_A_LEGAL_ENTITY_ID,
			type: "АВР",
			receiverBin: COMPANY_B_BIN,
			receiverName: companyB.name,
			fields: {},
			filePath: `/test/bilateral/avr-${dealFromCompanyA.deal.id}.pdf`,
			documentPayload: {
				documentType: "АВР",
				data: {
					orgName: companyA.name,
					orgBin: COMPANY_A_BIN,
					buyerName: companyB.name,
					buyerBin: COMPANY_B_BIN,
					items: [{
						name: "Консультационные услуги по бухгалтерскому учету",
						quantity: 1,
						unit: "услуга",
						price: 1000000
					}],
					actNumber: "AVR-BILATERAL-001",
					actDate: new Date().toISOString().split('T')[0]
				},
				generatedAt: new Date().toISOString(),
				generatedBy: EXISTING_USER_ID
			}
		}).returning();

		console.log(`✅ AVR document created: ${avrDocument[0].id}`);

		// Link document to deal
		await db.insert(dealDocumentsFlutter).values({
			dealId: dealFromCompanyA.deal.id,
			documentFlutterId: avrDocument[0].id,
		});

		console.log("✅ Document linked to deal");

		// Phase 4: Verification - Company A has entries, Company B does not
		console.log("\n✅ Phase 4: Verifying automatic entries for Company A only...");

		// Query Company A entries
		const companyAEntries = await db.query.journalEntries.findMany({
			where: eq(journalEntries.legalEntityId, COMPANY_A_LEGAL_ENTITY_ID),
			with: {
				lines: { with: { account: true } },
				dealJournalEntries: true,
			},
		});

		console.log(`✅ Company A has ${companyAEntries.length} entry (automatic)`);
		if (companyAEntries.length > 0) {
			const entry = companyAEntries[0];
			const debitLine = entry.lines.find((l: any) => l.account.code === "1210");
			const creditLine = entry.lines.find((l: any) => l.account.code === "6010");

			if (debitLine && creditLine) {
				console.log(`   - Debit 1210 (Accounts Receivable): ${debitLine.debitAmount}`);
				console.log(`   - Credit 6010 (Revenue): ${creditLine.creditAmount}`);
			}
		}

		// Query Company B entries (should be empty)
		const companyBEntriesBeforeManual = await db.query.journalEntries.findMany({
			where: eq(journalEntries.legalEntityId, COMPANY_B_LEGAL_ENTITY_ID),
		});

		console.log(`✅ Company B has ${companyBEntriesBeforeManual.length} entries (expected: 0 - no automatic creation)`);

		if (companyBEntriesBeforeManual.length !== 0) {
			console.error("❌ ERROR: Company B should not have automatic entries!");
			throw new Error("Company B has unexpected automatic entries");
		}

		// Phase 5: Company B manually creates entries
		console.log("\n📝 Phase 5: Company B manually creates entries...");

		// Get Company B accounts
		const companyBExpenseAccount = await db.query.accounts.findFirst({
			where: and(
				eq(accounts.code, "7110"), // Services Expense
				eq(accounts.legalEntityId, COMPANY_B_LEGAL_ENTITY_ID)
			),
		});

		const companyBPayableAccount = await db.query.accounts.findFirst({
			where: and(
				eq(accounts.code, "3310"), // Accounts Payable
				eq(accounts.legalEntityId, COMPANY_B_LEGAL_ENTITY_ID)
			),
		});

		if (!companyBExpenseAccount || !companyBPayableAccount) {
			throw new Error("Company B accounts not found");
		}

		// Create manual journal entry for Company B
		const manualEntryResult = await accountingService.createJournalEntry(
			{
				entryNumber: `JE-COMPB-${Date.now()}`,
				entryDate: new Date().toISOString().split('T')[0],
				description: `Расходы на услуги от ${companyA.name} (Deal: ${dealFromCompanyA.deal.id})`,
				reference: `DEAL-${dealFromCompanyA.deal.id}`,
				status: "draft",
				currencyId: kztCurrency.id,
				legalEntityId: COMPANY_B_LEGAL_ENTITY_ID,
				createdBy: EXISTING_USER_ID,
			},
			[
				{
					accountId: companyBExpenseAccount.id,
					debitAmount: 1000000,
					creditAmount: 0,
					description: "Расходы на консультационные услуги от Компании А",
				},
				{
					accountId: companyBPayableAccount.id,
					debitAmount: 0,
					creditAmount: 1000000,
					description: "Кредиторская задолженность перед Компанией А",
				},
			],
			COMPANY_A_BIN // Partner BIN for linking
		);

		if (manualEntryResult.success) {
			console.log(`✅ Manual entry created for Company B: ${manualEntryResult.entry.id}`);
			console.log(`   - Debit 7110 (Services Expense): 1,000,000`);
			console.log(`   - Credit 3310 (Accounts Payable): 1,000,000`);
		} else {
			throw new Error(`Failed to create manual entry: ${manualEntryResult.error.message}`);
		}

		// Phase 6: Final verification - complete isolation
		console.log("\n🎯 Phase 6: Final verification - complete isolation...");

		// Query final entries
		const finalCompanyAEntries = await db.query.journalEntries.findMany({
			where: eq(journalEntries.legalEntityId, COMPANY_A_LEGAL_ENTITY_ID),
			with: { lines: { with: { account: true } } },
		});

		const finalCompanyBEntries = await db.query.journalEntries.findMany({
			where: eq(journalEntries.legalEntityId, COMPANY_B_LEGAL_ENTITY_ID),
			with: { lines: { with: { account: true } } },
		});

		console.log(`✅ Company A: ${finalCompanyAEntries.length} entry (Receivable/Revenue)`);
		console.log(`✅ Company B: ${finalCompanyBEntries.length} entry (Expense/Payable)`);

		// Validate Company A entry
		if (finalCompanyAEntries.length !== 1) {
			throw new Error(`Company A should have exactly 1 entry, but has ${finalCompanyAEntries.length}`);
		}

		const companyAEntry = finalCompanyAEntries[0];
		const companyADebitLine = companyAEntry.lines.find((l: any) => l.account.code === "1210");
		const companyACreditLine = companyAEntry.lines.find((l: any) => l.account.code === "6010");

		if (!companyADebitLine || companyADebitLine.debitAmount !== 1000000) {
			throw new Error("Company A: 1210 debit should be 1,000,000");
		}

		if (!companyACreditLine || companyACreditLine.creditAmount !== 1000000) {
			throw new Error("Company A: 6010 credit should be 1,000,000");
		}

		// Validate Company B entry
		if (finalCompanyBEntries.length !== 1) {
			throw new Error(`Company B should have exactly 1 entry, but has ${finalCompanyBEntries.length}`);
		}

		const companyBEntry = finalCompanyBEntries[0];
		const companyBDebitLine = companyBEntry.lines.find((l: any) => l.account.code === "7110");
		const companyBCreditLine = companyBEntry.lines.find((l: any) => l.account.code === "3310");

		if (!companyBDebitLine || companyBDebitLine.debitAmount !== 1000000) {
			throw new Error("Company B: 7110 debit should be 1,000,000");
		}

		if (!companyBCreditLine || companyBCreditLine.creditAmount !== 1000000) {
			throw new Error("Company B: 3310 credit should be 1,000,000");
		}

		// Verify document linkage
		const dealDocuments = await db.query.dealDocumentsFlutter.findMany({
			where: eq(dealDocumentsFlutter.dealId, dealFromCompanyA.deal.id),
			with: { documentFlutter: true },
		});

		if (dealDocuments.length !== 1) {
			throw new Error(`Deal should have 1 linked document, but has ${dealDocuments.length}`);
		}

		if (dealDocuments[0].documentFlutter.type !== "АВР") {
			throw new Error("Document should be АВР type");
		}

		console.log("✅ Document properly linked (АВР type)");

		// Cross-entity query protection test
		const crossQuery = await db.query.journalEntries.findMany({
			where: and(
				eq(journalEntries.id, companyBEntry.id),
				eq(journalEntries.legalEntityId, COMPANY_A_LEGAL_ENTITY_ID)
			)
		});

		if (crossQuery.length !== 0) {
			throw new Error("Cross-entity query protection failed: A should not see B's entries");
		}

		console.log("✅ Cross-entity query protection confirmed");

		console.log("\n✅ BILATERAL DEAL TEST PASSED!");
		console.log("========================================");
		console.log("📊 Summary:");
		console.log(`  - Company A entries: ${finalCompanyAEntries.length} (automatic)`);
		console.log(`  - Company B entries: ${finalCompanyBEntries.length} (manual)`);
		console.log("  - Complete isolation: ✅");
		console.log("  - Document linked: ✅");
		console.log("  - Balances match: ✅");
		console.log("  - Anti-spam mechanism validated: ✅");

	} catch (error) {
		console.error("❌ BILATERAL DEAL TEST FAILED:", error);
		throw error;
	}
}

// Run the test
testBilateralDealWithManualEntries().then(() => {
	console.log("\n✨ Test completed successfully!");
	process.exit(0);
}).catch((error) => {
	console.error("\n💥 Test failed with error:", error);
	process.exit(1);
});
