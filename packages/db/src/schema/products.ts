import {
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
	date,
	integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { legalEntities } from "./legal-entities";
import { relations } from "drizzle-orm";

export const products = pgTable("products", {
	id: uuid("id").primaryKey().defaultRandom(),
	legalEntityId: uuid("legal_entity_id")
		.references(() => legalEntities.id, { onDelete: "cascade" })
		.notNull(),
	type: varchar("type", { length: 50 }).notNull(),
	name: varchar("name", { length: 256 }).notNull(),
	measurement: varchar("measurement", { length: 50 }).notNull(),
	price: integer("price").notNull(),
	vat: integer("vat").notNull(),
});

export const productZodSchema = createSelectSchema(products);
export const productInsertSchema = createInsertSchema(products);
