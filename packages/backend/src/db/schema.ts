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
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

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

export const profileRelations = relations(profile, ({ one, many }) => ({
	onboardingStatus: one(onboardingStatus, {
		fields: [profile.id],
		references: [onboardingStatus.userId],
	}),
	legalEntities: many(legalEntities),
}));

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

export const employees = pgTable("employees", {
	id: uuid("id").primaryKey().defaultRandom(),
	legalEntityId: uuid("legal_entity_id")
		.references(() => legalEntities.id, { onDelete: "cascade" })
		.notNull(),
	fullName: varchar("full_name", { length: 256 }).notNull(),
	pfp: varchar("pfp"),
	role: varchar("role", { length: 100 }).notNull(),
	address: text("address").notNull(),
	iin: varchar("iin", { length: 12 }).notNull(),
	dateOfBirth: date("date_of_birth").notNull(),
	udosId: varchar("udos_id", { length: 100 }).notNull(),
	udosDateGiven: date("udos_date_given").notNull(),
	udosWhoGives: varchar("udos_who_gives", { length: 256 }).notNull(),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

export const employeeZodSchema = createSelectSchema(employees);
export const employeeInsertSchema = createInsertSchema(employees);

export type Employee = typeof employees.$inferSelect;

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
	}),
);

export const banksRelations = relations(banks, ({ one }) => ({
	legalEntity: one(legalEntities, {
		fields: [banks.legalEntityId],
		references: [legalEntities.id],
	}),
}));

export const employeesRelations = relations(employees, ({ one }) => ({
	legalEntity: one(legalEntities, {
		fields: [employees.legalEntityId],
		references: [legalEntities.id],
	}),
}));
