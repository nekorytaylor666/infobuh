import {
	pgTable,
	primaryKey,
	timestamp,
	uuid,
	varchar,
	bigint,
	text,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { documentsFlutter } from "./documents-flutter";
import { legalEntities } from "./legal-entities";
import { comments } from "./comments";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { journalEntries } from "./accounting";

// Deal types enum
export const DEAL_TYPES = ["service", "product"] as const;
export type DealType = (typeof DEAL_TYPES)[number];

// Deal status enum
export const DEAL_STATUSES = ["draft", "active", "completed", "cancelled"] as const;
export type DealStatus = (typeof DEAL_STATUSES)[number];

export const deals = pgTable("deals", {
	id: uuid("id").defaultRandom().primaryKey(),
	// Add any other fields relevant to a deal here, for example:
	// name: varchar("name", { length: 256 }),
	// status: varchar("status", { length: 50 }),
	receiverBin: varchar("receiver_bin").notNull(),
	title: varchar("title"),
	description: text("description"),
	dealType: varchar("deal_type", { length: 20 })
		.notNull()
		.$type<DealType>(),
	totalAmount: bigint("total_amount", { mode: "number" }).notNull(),
	paidAmount: bigint("paid_amount", { mode: "number" }).default(0).notNull(),
	status: varchar("status", { length: 20 })
		.default("draft")
		.notNull()
		.$type<DealStatus>(),
	legalEntityId: uuid("legal_entity_id")
		.references(() => legalEntities.id)
		.notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const dealZodSchema = createSelectSchema(deals);
export const dealInsertSchema = createInsertSchema(deals, {
	// id, createdAt, updatedAt are auto-generated or set by the server
	// legalEntityId will be required and should be provided in the request
	title: z.string().min(1, "Title is required"),
	receiverBin: z.string().length(12, "Receiver BIN must be 12 characters"),
	dealType: z.enum(DEAL_TYPES),
	totalAmount: z.number().min(0, "Total amount must be positive"),
	status: z.enum(DEAL_STATUSES).default("draft"),
}).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	paidAmount: true,
});
export const dealUpdateSchema = dealInsertSchema.partial();

// Junction table for deals and journal entries
export const dealJournalEntries = pgTable(
	"deal_journal_entries",
	{
		dealId: uuid("deal_id")
			.references(() => deals.id, { onDelete: "cascade" })
			.notNull(),
		journalEntryId: uuid("journal_entry_id").notNull(), // Reference to journal_entries table
		entryType: varchar("entry_type", { length: 20 }).notNull(), // 'invoice', 'payment', 'adjustment'
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.dealId, t.journalEntryId] }),
	}),
);

export const dealsRelations = relations(deals, ({ many }) => ({
	dealDocumentsFlutter: many(dealDocumentsFlutter),
	comments: many(comments),
	dealJournalEntries: many(dealJournalEntries),
}));

export const dealDocumentsFlutter = pgTable(
	"deal_documents_flutter",
	{
		dealId: uuid("deal_id")
			.references(() => deals.id, { onDelete: "cascade" })
			.notNull(),
		documentFlutterId: uuid("document_flutter_id")
			.references(() => documentsFlutter.id, { onDelete: "cascade" })
			.notNull(),
		assignedAt: timestamp("assigned_at").defaultNow().notNull(),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.dealId, t.documentFlutterId] }),
	}),
);

export const dealDocumentsFlutterRelations = relations(
	dealDocumentsFlutter,
	({ one }) => ({
		deal: one(deals, {
			fields: [dealDocumentsFlutter.dealId],
			references: [deals.id],
		}),
		documentFlutter: one(documentsFlutter, {
			fields: [dealDocumentsFlutter.documentFlutterId],
			references: [documentsFlutter.id],
		}),
	}),
);

export const dealJournalEntriesRelations = relations(
	dealJournalEntries,
	({ one }) => ({
		deal: one(deals, {
			fields: [dealJournalEntries.dealId],
			references: [deals.id],
		}),
		journalEntry: one(journalEntries, {
			fields: [dealJournalEntries.journalEntryId],
			references: [journalEntries.id],
		}),
	}),
);

export type DealDocuments = typeof dealDocumentsFlutter.$inferSelect;
type DealComments = typeof comments.$inferSelect;

export type DealWithRelations = typeof deals.$inferSelect & {
	dealDocumentsFlutter: DealDocuments[];
	comments: DealComments[];
};
