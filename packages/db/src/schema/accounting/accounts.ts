import {
	pgTable,
	uuid,
	varchar,
	boolean,
	timestamp,
	text,
	type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";
import { type AccountType, ACCOUNT_TYPES } from "./enums";

export const accounts = pgTable("accounts", {
	id: uuid("id").primaryKey().defaultRandom(),
	code: varchar("code", { length: 10 }).notNull().unique(),
	name: varchar("name", { length: 255 }).notNull(),
	accountType: varchar("account_type", { length: 20 })
		.notNull()
		.$type<AccountType>(),
	parentId: uuid("parent_id").references((): AnyPgColumn => accounts.id),
	description: text("description"),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accountsRelations = relations(accounts, ({ one, many }) => ({
	parent: one(accounts, {
		fields: [accounts.parentId],
		references: [accounts.id],
		relationName: "account_hierarchy",
	}),
	children: many(accounts, {
		relationName: "account_hierarchy",
	}),
}));

export const insertAccountSchema = createInsertSchema(accounts, {
	code: z
		.string()
		.min(1)
		.max(10)
		.regex(/^\d+$/, "Account code must be numeric"),
	name: z.string().min(1).max(255),
	accountType: z.enum(ACCOUNT_TYPES),
	description: z.string().optional(),
});

export const selectAccountSchema = createSelectSchema(accounts);

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
