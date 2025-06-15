import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { AccountingService, type CreateJournalEntryResult } from "../lib/accounting-service/accounting-service.index";
import { AccountingSeedService } from "../lib/accounting-service/seed-service";
import type { HonoEnv } from "../env";

const accountingRouter = new Hono<HonoEnv>();

// ===== SEED ENDPOINTS =====

accountingRouter.post("/seed", async (c) => {
	try {
		const seedService = new AccountingSeedService(c.env.db);
		const legalEntityId = c.req.query("legalEntityId") as string | undefined;
		const userId = c.get("userId") as string | undefined;

		if (!legalEntityId) {
			return c.json({ success: false, error: "Bad Request: Legal entity ID is missing from query parameters." }, 400);
		}
		const result = await seedService.seedDatabase(legalEntityId, userId);

		return c.json({
			success: true,
			data: result,
		});
	} catch (error) {
		console.error("Seed error:", error);
		return c.json(
			{
				success: false,
				error: "Failed to seed database",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			500,
		);
	}
});

accountingRouter.post("/seed/transactions", async (c) => {
	try {
		const seedService = new AccountingSeedService(c.env.db);
		const legalEntityId = c.req.query("legalEntityId") as string | undefined;
		const userId = c.get("userId") as string | undefined;

		if (!legalEntityId) {
			return c.json({ success: false, error: "Bad Request: Legal entity ID is missing from query parameters." }, 400);
		}
		if (!userId) {
			return c.json({ success: false, error: "Unauthorized: User ID is missing." }, 401);
		}
		const result = await seedService.createSampleTransactions(legalEntityId, userId);

		return c.json({
			success: true,
			data: result,
		});
	} catch (error) {
		console.error("Sample transactions error:", error);
		return c.json(
			{
				success: false,
				error: "Failed to create sample transactions",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			500,
		);
	}
});

// ===== CURRENCY ENDPOINTS =====

accountingRouter.get("/currencies", async (c) => {
	try {
		const service = new AccountingService(c.env.db);
		const currencies = await service.getCurrencies();

		return c.json({
			success: true,
			data: currencies,
		});
	} catch (error) {
		return c.json(
			{
				success: false,
				error: "Failed to fetch currencies",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			500,
		);
	}
});

// ===== ACCOUNT ENDPOINTS =====

accountingRouter.get("/accounts", async (c) => {
	try {
		const legalEntityId = c.req.query("legalEntityId") as string | undefined;
		if (!legalEntityId) {
			return c.json({ success: false, error: "Unauthorized: Legal entity ID is missing from query parameters." }, 400);
		}

		const service = new AccountingService(c.env.db);
		const accountType = c.req.query("type");

		let accounts;
		if (accountType) {
			accounts = await service.getAccountsByType(accountType as any, legalEntityId);
		} else {
			accounts = await service.getAccounts(legalEntityId);
		}

		return c.json({
			success: true,
			data: accounts,
		});
	} catch (error) {
		return c.json(
			{
				success: false,
				error: "Failed to fetch accounts",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			500,
		);
	}
});

accountingRouter.get("/accounts/hierarchy", async (c) => {
	try {
		const legalEntityId = c.req.query("legalEntityId") as string | undefined;
		if (!legalEntityId) {
			return c.json({ success: false, error: "Unauthorized: Legal entity ID is missing from query parameters." }, 400);
		}
		const service = new AccountingService(c.env.db);
		const hierarchy = await service.getAccountHierarchy(legalEntityId);

		return c.json({
			success: true,
			data: hierarchy,
		});
	} catch (error) {
		return c.json(
			{
				success: false,
				error: "Failed to fetch account hierarchy",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			500,
		);
	}
});

accountingRouter.get("/accounts/:id", async (c) => {
	try {
		const legalEntityId = c.req.query("legalEntityId") as string | undefined;
		if (!legalEntityId) {
			return c.json({ success: false, error: "Unauthorized: Legal entity ID is missing from query parameters." }, 400);
		}
		const id = c.req.param("id");
		const service = new AccountingService(c.env.db);
		const account = await service.getAccountById(id, legalEntityId);

		if (!account) {
			return c.json(
				{
					success: false,
					error: "Account not found",
				},
				404,
			);
		}

		return c.json({
			success: true,
			data: account,
		});
	} catch (error) {
		return c.json(
			{
				success: false,
				error: "Failed to fetch account",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			500,
		);
	}
});

accountingRouter.get("/accounts/:id/ledger", async (c) => {
	try {
		const legalEntityId = c.req.query("legalEntityId") as string | undefined;
		if (!legalEntityId) {
			return c.json({ success: false, error: "Unauthorized: Legal entity ID is missing from query parameters." }, 400);
		}
		const id = c.req.param("id");
		const service = new AccountingService(c.env.db);
		const ledger = await service.getAccountLedger(id, legalEntityId);

		return c.json({
			success: true,
			data: ledger,
		});
	} catch (error) {
		return c.json(
			{
				success: false,
				error: "Failed to fetch account ledger",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			500,
		);
	}
});

// ===== JOURNAL ENTRY ENDPOINTS =====

const createJournalEntrySchema = z
	.object({
		entryNumber: z.string().min(1),
		entryDate: z.string().date(),
		description: z.string().optional(),
		reference: z.string().optional(),
		currencyId: z.string().uuid(),
		partnerBin: z.string().regex(/^\d{12}$/, "BIN must be 12 digits").optional(),
		lines: z
			.array(
				z.object({
					accountId: z.string().uuid(),
					debitAmount: z.number().min(0).default(0),
					creditAmount: z.number().min(0).default(0),
					description: z.string().optional(),
				}),
			)
			.min(2),
	})
	.refine(
		(data) => {
			const totalDebits = data.lines.reduce(
				(sum, line) => sum + line.debitAmount,
				0,
			);
			const totalCredits = data.lines.reduce(
				(sum, line) => sum + line.creditAmount,
				0,
			);
			return Math.abs(totalDebits - totalCredits) < 0.01; // Allow for small rounding differences
		},
		{
			message: "Total debits must equal total credits",
		},
	);

accountingRouter.post(
	"/journal-entries",
	zValidator("json", createJournalEntrySchema),
	async (c) => {
		try {
			const userId = c.get("userId") as string | undefined;
			const legalEntityId = c.req.query("legalEntityId") as string | undefined;

			if (!userId) {
				return c.json({ success: false, error: "Unauthorized: User ID is missing." }, 401);
			}
			if (!legalEntityId) {
				return c.json({ success: false, error: "Bad Request: Legal entity ID is missing from query parameters." }, 400);
			}

			const data = c.req.valid("json");
			const service = new AccountingService(c.env.db);

			const { lines, partnerBin, ...entryData } = data;

			const result: CreateJournalEntryResult = await service.createJournalEntry(
				{
					...entryData,
					status: "draft",
					createdBy: userId,
					legalEntityId: legalEntityId,
				},
				lines,
				partnerBin,
			);

			if (!result.success) {
				switch (result.error.type) {
					case "ACCOUNT_NOT_FOUND":
						return c.json({ success: false, error: "Bad Request", message: result.error.message }, 400);
					case "TRANSACTION_ERROR":
						return c.json({ success: false, error: "Internal Server Error", message: "Failed to create journal entry due to a server issue. Check server logs for details." }, 500);
					default:
						console.error("Unhandled error type from createJournalEntry in route:", (result.error as any));
						return c.json({ success: false, error: "Internal Server Error", message: "An unexpected error occurred while processing the journal entry." }, 500);
				}
			}

			return c.json({
				success: true,
				data: result.entry,
				message: "Journal entry created successfully",
			});
		} catch (error: any) {
			console.error("Unexpected error in POST /journal-entries route:", error);
			return c.json(
				{
					success: false,
					error: "Internal Server Error",
					message: error.message || "An unexpected critical error occurred.",
				},
				500,
			);
		}
	},
);

accountingRouter.get("/journal-entries", async (c) => {
	try {
		const legalEntityId = c.req.query("legalEntityId") as string | undefined;
		if (!legalEntityId) {
			return c.json({ success: false, error: "Unauthorized: Legal entity ID is missing from query parameters." }, 400);
		}
		const service = new AccountingService(c.env.db);
		const entries = await service.getJournalEntries(legalEntityId);

		return c.json({
			success: true,
			data: entries,
		});
	} catch (error) {
		return c.json(
			{
				success: false,
				error: "Failed to fetch journal entries",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			500,
		);
	}
});

accountingRouter.get("/journal-entries/:id", async (c) => {
	try {
		const legalEntityId = c.req.query("legalEntityId") as string | undefined;
		if (!legalEntityId) {
			return c.json({ success: false, error: "Unauthorized: Legal entity ID is missing from query parameters." }, 400);
		}
		const id = c.req.param("id");
		const service = new AccountingService(c.env.db);

		const entry = await service.getJournalEntryById(id, legalEntityId);
		const lines = entry ? await service.getJournalEntryLines(id) : [];

		if (!entry) {
			return c.json(
				{
					success: false,
					error: "Journal entry not found",
				},
				404,
			);
		}

		return c.json({
			success: true,
			data: {
				...entry,
				lines,
			},
		});
	} catch (error) {
		return c.json(
			{
				success: false,
				error: "Failed to fetch journal entry",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			500,
		);
	}
});

accountingRouter.post("/journal-entries/:id/post", async (c) => {
	try {
		const legalEntityId = c.req.query("legalEntityId") as string | undefined;
		const userId = c.get("userId") as string | undefined;

		if (!userId) {
			return c.json({ success: false, error: "Unauthorized: User ID is missing." }, 401);
		}
		if (!legalEntityId) {
			return c.json({ success: false, error: "Bad Request: Legal entity ID is missing from query parameters." }, 400);
		}
		const id = c.req.param("id");
		const service = new AccountingService(c.env.db);

		await service.postJournalEntry(id, legalEntityId, userId);

		return c.json({
			success: true,
			message: "Journal entry posted successfully",
		});
	} catch (error) {
		return c.json(
			{
				success: false,
				error: "Failed to post journal entry",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			500,
		);
	}
});

// ===== REPORTING ENDPOINTS =====

accountingRouter.get("/reports/trial-balance", async (c) => {
	try {
		const legalEntityId = c.req.query("legalEntityId") as string | undefined;
		if (!legalEntityId) {
			return c.json({ success: false, error: "Unauthorized: Legal entity ID is missing from query parameters." }, 400);
		}
		const service = new AccountingService(c.env.db);
		const trialBalance = await service.getTrialBalance(legalEntityId);

		// Calculate totals
		const totalDebits = trialBalance.reduce(
			(sum, acc) => sum + acc.debitBalance,
			0,
		);
		const totalCredits = trialBalance.reduce(
			(sum, acc) => sum + acc.creditBalance,
			0,
		);

		return c.json({
			success: true,
			data: {
				accounts: trialBalance,
				totals: {
					debits: totalDebits,
					credits: totalCredits,
					balanced: Math.abs(totalDebits - totalCredits) < 0.01,
				},
			},
		});
	} catch (error) {
		return c.json(
			{
				success: false,
				error: "Failed to generate trial balance",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			500,
		);
	}
});

accountingRouter.get("/reports/balance-sheet", async (c) => {
	try {
		const legalEntityId = c.req.query("legalEntityId") as string | undefined;
		if (!legalEntityId) {
			return c.json({ success: false, error: "Unauthorized: Legal entity ID is missing from query parameters." }, 400);
		}
		const service = new AccountingService(c.env.db);
		const balanceSheet = await service.getBalanceSheet(legalEntityId);

		return c.json({
			success: true,
			data: balanceSheet,
		});
	} catch (error) {
		return c.json(
			{
				success: false,
				error: "Failed to generate balance sheet",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			500,
		);
	}
});

accountingRouter.get("/reports/income-statement", async (c) => {
	try {
		const legalEntityId = c.req.query("legalEntityId") as string | undefined;
		if (!legalEntityId) {
			return c.json({ success: false, error: "Unauthorized: Legal entity ID is missing from query parameters." }, 400);
		}
		const service = new AccountingService(c.env.db);
		const incomeStatement = await service.getIncomeStatement(legalEntityId);

		return c.json({
			success: true,
			data: incomeStatement,
		});
	} catch (error) {
		return c.json(
			{
				success: false,
				error: "Failed to generate income statement",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			500,
		);
	}
});

accountingRouter.get("/partners/:id/subledger", async (c) => {
	try {
		const legalEntityId = c.req.query("legalEntityId") as string | undefined;
		if (!legalEntityId) {
			return c.json({ success: false, error: "Unauthorized: Legal entity ID is missing from query parameters." }, 400);
		}

		const id = c.req.param("id");
		const service = new AccountingService(c.env.db);
		const subledger = await service.getPartnerSubledger(id, legalEntityId);

		return c.json({
			success: true,
			data: subledger,
		});
	} catch (error) {
		return c.json(
			{
				success: false,
				error: "Failed to fetch partner subledger",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			500,
		);
	}
});

accountingRouter.get("/partners/:id/balance", async (c) => {
	try {
		const legalEntityId = c.req.query("legalEntityId") as string | undefined;
		if (!legalEntityId) {
			return c.json({ success: false, error: "Unauthorized: Legal entity ID is missing from query parameters." }, 400);
		}

		const id = c.req.param("id");
		const service = new AccountingService(c.env.db);
		const balance = await service.getPartnerBalance(id, legalEntityId);

		return c.json({
			success: true,
			data: { partnerId: id, balance },
		});
	} catch (error) {
		return c.json(
			{
				success: false,
				error: "Failed to fetch partner balance",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			500,
		);
	}
});

// ===== TEST ENDPOINT =====

accountingRouter.get("/test", async (c) => {
	try {
		const service = new AccountingService(c.env.db);
		const legalEntityId = c.req.query("legalEntityId") || "test-legal-entity-id";

		const currencies = await service.getCurrencies();
		const accounts = await service.getAccounts(legalEntityId);
		const entries = await service.getJournalEntries(legalEntityId);

		return c.json({
			success: true,
			message: "Accounting system is working!",
			data: {
				currencies: currencies.length,
				accounts: accounts.length,
				journalEntries: entries.length,
			},
		});
	} catch (error) {
		return c.json(
			{
				success: false,
				error: "Accounting system test failed",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			500,
		);
	}
});

export default accountingRouter;
