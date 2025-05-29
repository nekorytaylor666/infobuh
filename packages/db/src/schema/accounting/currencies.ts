import {
	pgTable,
	uuid,
	varchar,
	boolean,
	timestamp,
	decimal,
	date,
	unique,
	integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const currencies = pgTable("currencies", {
	id: uuid("id").primaryKey().defaultRandom(),
	code: varchar("code", { length: 3 }).notNull().unique(),
	name: varchar("name", { length: 100 }).notNull(),
	symbol: varchar("symbol", { length: 10 }),
	decimals: integer("decimals").notNull().default(2),
	isBaseCurrency: boolean("is_base_currency").default(false).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const exchangeRates = pgTable(
	"exchange_rates",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		fromCurrencyId: uuid("from_currency_id")
			.notNull()
			.references(() => currencies.id),
		toCurrencyId: uuid("to_currency_id")
			.notNull()
			.references(() => currencies.id),
		rate: decimal("rate", { precision: 18, scale: 8 }).notNull(),
		rateDate: date("rate_date").notNull(),
		source: varchar("source", { length: 100 }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		uniqueRatePerDay: unique().on(
			table.fromCurrencyId,
			table.toCurrencyId,
			table.rateDate,
		),
	}),
);

export const currenciesRelations = relations(currencies, ({ many }) => ({
	fromExchangeRates: many(exchangeRates, {
		relationName: "from_currency",
	}),
	toExchangeRates: many(exchangeRates, {
		relationName: "to_currency",
	}),
}));

export const exchangeRatesRelations = relations(exchangeRates, ({ one }) => ({
	fromCurrency: one(currencies, {
		fields: [exchangeRates.fromCurrencyId],
		references: [currencies.id],
		relationName: "from_currency",
	}),
	toCurrency: one(currencies, {
		fields: [exchangeRates.toCurrencyId],
		references: [currencies.id],
		relationName: "to_currency",
	}),
}));

export const insertCurrencySchema = createInsertSchema(currencies, {
	code: z.string().length(3).toUpperCase(),
	name: z.string().min(1).max(100),
	symbol: z.string().max(10).optional(),
	decimals: z.number().int().min(0).max(10).default(2),
});

export const insertExchangeRateSchema = createInsertSchema(exchangeRates, {
	rate: z
		.string()
		.regex(
			/^\d+(\.\d{1,8})?$/,
			"Rate must be a valid decimal with up to 8 decimal places",
		),
	rateDate: z.string().date(),
	source: z.string().max(100).optional(),
});

export const selectCurrencySchema = createSelectSchema(currencies);
export const selectExchangeRateSchema = createSelectSchema(exchangeRates);

export type Currency = typeof currencies.$inferSelect;
export type NewCurrency = typeof currencies.$inferInsert;
export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type NewExchangeRate = typeof exchangeRates.$inferInsert;
