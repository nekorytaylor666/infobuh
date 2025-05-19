import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { legalEntities } from "./legal-entities";

export const partners = pgTable("partners", {
	id: uuid("id").primaryKey().defaultRandom(),
	legalEntityId: uuid("legal_entity_id")
		.references(() => legalEntities.id, { onDelete: "cascade" })
		.notNull(),
	bin: varchar("bin", { length: 12 }).notNull(),
	name: varchar("name", { length: 256 }).notNull(),
	address: text("address").notNull(),
	executerName: varchar("executer_name", { length: 256 }).notNull(),
	executerRole: varchar("executer_role", { length: 100 }).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const partnersRelations = relations(partners, ({ one }) => ({
	legalEntity: one(legalEntities, {
		fields: [partners.legalEntityId],
		references: [legalEntities.id],
	}),
}));

export const partnerZodSchema = createSelectSchema(partners);
export const partnerInsertSchema = createInsertSchema(partners);
