import {
	pgTable,
	uuid,
	varchar,
	date,
	text,
	bigint,
	timestamp,
	integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations, sql } from "drizzle-orm";
import { z } from "zod";
import { type EntryStatus, ENTRY_STATUSES } from "./enums";
import { accounts } from "./accounts";
import { currencies } from "./currencies";
import { legalEntities } from "../legal-entities";

export const journalEntries = pgTable(
	"journal_entries",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		entryNumber: varchar("entry_number", { length: 50 }).notNull().unique(),
		entryDate: date("entry_date").notNull(),
		description: text("description"),
		reference: varchar("reference", { length: 100 }),
		status: varchar("status", { length: 20 })
			.notNull()
			.default("draft")
			.$type<EntryStatus>(),
		currencyId: uuid("currency_id")
			.notNull()
			.references(() => currencies.id),
		legalEntityId: uuid("legal_entity_id")
			.notNull()
			.references(() => legalEntities.id, { onDelete: "cascade" }),
		totalDebit: bigint("total_debit", { mode: "number" }).notNull(),
		totalCredit: bigint("total_credit", { mode: "number" }).notNull(),
		createdBy: uuid("created_by").notNull(),
		approvedBy: uuid("approved_by"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		debitsEqualCredits: sql`CHECK (${table.totalDebit} = ${table.totalCredit})`,
	}),
);

export const journalEntryLines = pgTable(
	"journal_entry_lines",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		journalEntryId: uuid("journal_entry_id")
			.notNull()
			.references(() => journalEntries.id, { onDelete: "cascade" }),
		accountId: uuid("account_id")
			.notNull()
			.references(() => accounts.id),
		debitAmount: bigint("debit_amount", { mode: "number" })
			.default(0)
			.notNull(),
		creditAmount: bigint("credit_amount", { mode: "number" })
			.default(0)
			.notNull(),
		description: text("description"),
		lineNumber: integer("line_number").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		positiveAmounts: sql`CHECK ((${table.debitAmount} >= 0 AND ${table.creditAmount} = 0) OR (${table.creditAmount} >= 0 AND ${table.debitAmount} = 0))`,
	}),
);

export const journalEntriesRelations = relations(
	journalEntries,
	({ many, one }) => ({
		lines: many(journalEntryLines),
		currency: one(currencies, {
			fields: [journalEntries.currencyId],
			references: [currencies.id],
		}),
		legalEntity: one(legalEntities, {
			fields: [journalEntries.legalEntityId],
			references: [legalEntities.id],
		}),
		// Note: User relations will be added when auth schema is properly integrated
	}),
);

export const journalEntryLinesRelations = relations(
	journalEntryLines,
	({ one }) => ({
		journalEntry: one(journalEntries, {
			fields: [journalEntryLines.journalEntryId],
			references: [journalEntries.id],
		}),
		account: one(accounts, {
			fields: [journalEntryLines.accountId],
			references: [accounts.id],
		}),
	}),
);

export const insertJournalEntrySchema = createInsertSchema(journalEntries, {
	entryNumber: z.string().min(1).max(50),
	entryDate: z.string().date(),
	description: z.string().optional(),
	reference: z.string().max(100).optional(),
	status: z.enum(ENTRY_STATUSES).default("draft"),
	currencyId: z.string().uuid(),
	legalEntityId: z.string().uuid(),
	totalDebit: z.number().min(0),
	totalCredit: z.number().min(0),
}).omit({ createdBy: true })
.refine((data) => data.totalDebit === data.totalCredit, {
	message: "Total debits must equal total credits",
	path: ["totalCredit"],
});

export const insertJournalEntryLineSchema = createInsertSchema(
	journalEntryLines,
	{
		debitAmount: z.number().min(0).default(0),
		creditAmount: z.number().min(0).default(0),
		description: z.string().optional(),
		lineNumber: z.number().int().positive(),
	},
).refine(
	(data) => {
		return (
			(data.debitAmount > 0 && data.creditAmount === 0) ||
			(data.creditAmount > 0 && data.debitAmount === 0)
		);
	},
	{
		message:
			"Either debit or credit amount must be greater than 0, but not both",
		path: ["creditAmount"],
	},
);

export const selectJournalEntrySchema = createSelectSchema(journalEntries);
export const selectJournalEntryLineSchema =
	createSelectSchema(journalEntryLines);

export type JournalEntry = typeof journalEntries.$inferSelect;
export type NewJournalEntry = typeof journalEntries.$inferInsert;
export type JournalEntryLine = typeof journalEntryLines.$inferSelect;
export type NewJournalEntryLine = typeof journalEntryLines.$inferInsert;
