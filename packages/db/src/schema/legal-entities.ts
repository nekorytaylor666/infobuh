import {
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
	date,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { profile } from "./auth";
import { z } from "zod";
import { employees } from "./employees";
import { banks } from "./banks";
import { documents } from "./documents";

export const legalEntities = pgTable("legal_entities", {
	id: uuid("id").primaryKey().defaultRandom(),
	profileId: uuid("profile_id")
		.references(() => profile.id, { onDelete: "cascade" })
		.notNull(),
	name: varchar("name", { length: 256 }).notNull(),
	image: varchar("image"),
	type: varchar("type", { length: 100 }).notNull(),
	address: text("address").notNull(),
	phone: varchar("phone", { length: 20 }).notNull(),
	oked: varchar("oked", { length: 20 }).notNull(),
	bin: varchar("bin", { length: 12 }).notNull(),
	registrationDate: timestamp("registration_date").notNull(),
	ugd: varchar("ugd", { length: 100 }).notNull(),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

export const legalEntityZodSchema = createSelectSchema(legalEntities);
export const legalEntityInsertSchema = createInsertSchema(legalEntities)
	.omit({ profileId: true })
	.extend({
		registrationDate: z.preprocess((arg) => {
			if (typeof arg === "string" || arg instanceof Date) {
				return new Date(arg);
			}
		}, z.date()),
	});
export const legalEntityUpdateSchema = legalEntityZodSchema.partial().extend({
	registrationDate: z
		.preprocess(
			(arg) =>
				typeof arg === "string" || arg instanceof Date ? new Date(arg) : arg,
			z.date(),
		)
		.optional(),
});

export type LegalEntity = typeof legalEntities.$inferSelect;

export const legalEntitiesRelations = relations(
	legalEntities,
	({ one, many }) => ({
		profile: one(profile, {
			fields: [legalEntities.profileId],
			references: [profile.id],
		}),
		banks: many(banks),
		employees: many(employees),
		documents: many(documents),
	}),
);
