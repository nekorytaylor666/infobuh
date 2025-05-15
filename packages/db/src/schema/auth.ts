import {
	pgSchema,
	pgTable,
	serial,
	text,
	timestamp,
	uuid,
	varchar,
	jsonb,
	date,
	boolean,
	integer,
	PgTable,
	type PgTableWithColumns,
	index,
	primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { legalEntities } from "./legal-entities";
import { fcmTokens } from "./fcmTokens";
import {
	documentFlutterPins,
	documentFlutterReadStatus,
} from "./documents-flutter";

const authSchema = pgSchema("auth");

export const users = authSchema.table("users", {
	id: uuid("id").primaryKey(),
});

export const profile = pgTable("profile", {
	id: uuid("id")
		.primaryKey()
		.references(() => users.id, { onDelete: "cascade" }),
	name: varchar("name", { length: 256 }).notNull(),
	image: varchar("image"),
	email: varchar("email", { length: 256 }).notNull(),
});

export const onboardingStatus = pgTable("onboarding_status", {
	userId: uuid("user_id")
		.primaryKey()
		.references(() => profile.id, { onDelete: "cascade" })
		.notNull(),
	isComplete: boolean("is_complete").notNull().default(false),
	currentStep: varchar("current_step", { length: 50 })
		.notNull()
		.default("profile"),
	completedAt: timestamp("completed_at"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

export const onboardingStatusRelations = relations(
	onboardingStatus,
	({ one }) => ({
		profile: one(profile, {
			fields: [onboardingStatus.userId],
			references: [profile.id],
		}),
	}),
);
