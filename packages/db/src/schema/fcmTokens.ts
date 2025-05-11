import {
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
	date,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { profile } from "./auth";
import { relations } from "drizzle-orm";
// New table for FCM tokens
export const fcmTokens = pgTable("fcm_tokens", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id")
		.references(() => profile.id, { onDelete: "cascade" })
		.notNull(),
	token: text("token").notNull().unique(), // Ensure tokens are unique
	deviceType: varchar("device_type", { length: 50 }), // e.g., 'ios', 'android', 'web'
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type FcmToken = typeof fcmTokens.$inferSelect;
export const fcmTokenInsertSchema = createInsertSchema(fcmTokens);
export const fcmTokenSelectSchema = createSelectSchema(fcmTokens);

// Relations for FCM tokens
export const fcmTokensRelations = relations(fcmTokens, ({ one }) => ({
	profile: one(profile, {
		fields: [fcmTokens.userId],
		references: [profile.id],
	}),
}));
