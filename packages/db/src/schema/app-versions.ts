import {
	pgTable,
	timestamp,
	uuid,
	varchar
} from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";

export const appVersions = pgTable("appVersions", {
    id: uuid("id").defaultRandom().primaryKey(),
    type: varchar("type", { length: 50 }).notNull(), // "IOS / ANDROID"
    buildNumber:varchar("build_number", { length: 256 }).notNull(),
    version:varchar("version", { length: 256 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),  
})

export const appVersionsZodSchema = createSelectSchema(appVersions);