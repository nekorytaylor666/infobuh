import {
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
	date,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { legalEntities } from "./legal-entities";
import { relations } from "drizzle-orm";

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

export const employeesRelations = relations(employees, ({ one }) => ({
	legalEntity: one(legalEntities, {
		fields: [employees.legalEntityId],
		references: [legalEntities.id],
	}),
}));
