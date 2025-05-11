import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { legalEntities } from "./legal-entities";
import { relations } from "drizzle-orm";

export const banks = pgTable("banks", {
	id: uuid("id").primaryKey().defaultRandom(),
	legalEntityId: uuid("legal_entity_id")
		.references(() => legalEntities.id, { onDelete: "cascade" })
		.notNull(),
	name: varchar("name", { length: 256 }).notNull(),
	bik: varchar("bik", { length: 20 }).notNull(),
	account: varchar("account", { length: 50 }).notNull(),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

export type Bank = typeof banks.$inferSelect;

export const banksRelations = relations(banks, ({ one }) => ({
	legalEntity: one(legalEntities, {
		fields: [banks.legalEntityId],
		references: [legalEntities.id],
	}),
}));
