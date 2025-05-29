import {
	pgTable,
	uuid,
	date,
	bigint,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";
import { accounts } from "./accounts";
import { journalEntryLines } from "./journal-entries";

export const generalLedger = pgTable("general_ledger", {
	id: uuid("id").primaryKey().defaultRandom(),
	accountId: uuid("account_id")
		.notNull()
		.references(() => accounts.id),
	journalEntryLineId: uuid("journal_entry_line_id")
		.notNull()
		.references(() => journalEntryLines.id),
	transactionDate: date("transaction_date").notNull(),
	debitAmount: bigint("debit_amount", { mode: "number" }).default(0).notNull(),
	creditAmount: bigint("credit_amount", { mode: "number" })
		.default(0)
		.notNull(),
	runningBalance: bigint("running_balance", { mode: "number" }).notNull(),
	description: text("description"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const generalLedgerRelations = relations(generalLedger, ({ one }) => ({
	account: one(accounts, {
		fields: [generalLedger.accountId],
		references: [accounts.id],
	}),
	journalEntryLine: one(journalEntryLines, {
		fields: [generalLedger.journalEntryLineId],
		references: [journalEntryLines.id],
	}),
}));

export const insertGeneralLedgerSchema = createInsertSchema(generalLedger, {
	transactionDate: z.string().date(),
	debitAmount: z.number().min(0).default(0),
	creditAmount: z.number().min(0).default(0),
	runningBalance: z.number(),
	description: z.string().optional(),
});

export const selectGeneralLedgerSchema = createSelectSchema(generalLedger);

export type GeneralLedger = typeof generalLedger.$inferSelect;
export type NewGeneralLedger = typeof generalLedger.$inferInsert;
