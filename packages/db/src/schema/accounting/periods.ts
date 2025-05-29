import {
	pgTable,
	uuid,
	varchar,
	date,
	timestamp,
	unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { type PeriodStatus, PERIOD_STATUSES } from "./enums";

export const accountingPeriods = pgTable(
	"accounting_periods",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		name: varchar("name", { length: 100 }).notNull(),
		startDate: date("start_date").notNull(),
		endDate: date("end_date").notNull(),
		status: varchar("status", { length: 20 })
			.notNull()
			.default("open")
			.$type<PeriodStatus>(),
		closedBy: uuid("closed_by"),
		closedAt: timestamp("closed_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		uniquePeriod: unique().on(table.startDate, table.endDate),
	}),
);

export const insertAccountingPeriodSchema = createInsertSchema(
	accountingPeriods,
	{
		name: z.string().min(1).max(100),
		startDate: z.string().date(),
		endDate: z.string().date(),
		status: z.enum(PERIOD_STATUSES).default("open"),
	},
).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
	message: "End date must be after start date",
	path: ["endDate"],
});

export const selectAccountingPeriodSchema =
	createSelectSchema(accountingPeriods);

export type AccountingPeriod = typeof accountingPeriods.$inferSelect;
export type NewAccountingPeriod = typeof accountingPeriods.$inferInsert;
