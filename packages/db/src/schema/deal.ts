import {
	pgTable,
	primaryKey,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { documentsFlutter } from "./documents-flutter";
import { legalEntities } from "./legal-entities";
import { comments } from "./comments";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const deals = pgTable("deals", {
	id: uuid("id").defaultRandom().primaryKey(),
	// Add any other fields relevant to a deal here, for example:
	// name: varchar("name", { length: 256 }),
	// status: varchar("status", { length: 50 }),
	receiverBin: varchar("receiver_bin").notNull(),
	title: varchar("title"),
	description: varchar("description"),
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
}).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});
export const dealUpdateSchema = dealInsertSchema.partial();

export const dealsRelations = relations(deals, ({ many }) => ({
	dealDocumentsFlutter: many(dealDocumentsFlutter),
	comments: many(comments),
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

export type DealDocuments = typeof dealDocumentsFlutter.$inferSelect;
type DealComments = typeof comments.$inferSelect;

export type DealWithRelations = typeof deals.$inferSelect & {
	dealDocumentsFlutter: DealDocuments[];
	comments: DealComments[];
};
