import {
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
	date,
	index,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
// New table for BIN registry data
/**
 * Table for storing official business registry data from Kazakhstan's government database
 * This table stores comprehensive information about legal entities registered in Kazakhstan
 */
export const binRegistry = pgTable(
	"bin_registry",
	{
		id: uuid("id").primaryKey().defaultRandom(), // Unique identifier for each registry entry
		bin: text("bin").notNull().unique(), // Business Identification Number - unique 12-digit code
		fullNameKz: text("full_name_kz"), // Full legal name in Kazakh language
		fullNameRu: text("full_name_ru"), // Full legal name in Russian language
		registrationDate: date("registration_date"), // Date when the entity was officially registered
		oked: text("oked"), // General Classification of Economic Activities code
		primaryActivityKz: text("primary_activity_kz"), // Primary business activity description in Kazakh
		primaryActivityRu: text("primary_activity_ru"), // Primary business activity description in Russian
		secondaryOked: text("secondary_oked"), // Secondary economic activity code if applicable
		krp: text("krp"), // Size of enterprise code (small, medium, large)
		krpNameKz: text("krp_name_kz"), // Size of enterprise name in Kazakh
		krpNameRu: text("krp_name_ru"), // Size of enterprise name in Russian
		kse: text("kse"), // Legal form code
		kseNameKz: text("kse_name_kz"), // Legal form name in Kazakh (LLC, JSC, etc.)
		kseNameRu: text("kse_name_ru"), // Legal form name in Russian (ТОО, АО, etc.)
		kfs: text("kfs"), // Form of ownership code
		kfsNameKz: text("kfs_name_kz"), // Form of ownership name in Kazakh (private, state, etc.)
		kfsNameRu: text("kfs_name_ru"), // Form of ownership name in Russian (частная, государственная, etc.)
		kato: text("kato"), // Administrative-territorial classification code
		localityNameKz: text("locality_name_kz"), // Location/city name in Kazakh
		localityNameRu: text("locality_name_ru"), // Location/city name in Russian
		legalAddress: text("legal_address"), // Full registered legal address
		directorName: text("director_name"), // Name of the company director/CEO
		// Timestamps for tracking data changes
		createdAt: timestamp("created_at").defaultNow(), // When this record was first created
		updatedAt: timestamp("updated_at").defaultNow(), // When this record was last updated
	},
	(t) => ({
		binIndex: index("bin_index").on(t.bin),
	}),
);



// Schema definitions for validation and type safety
export const binRegistrySelectSchema = createSelectSchema(binRegistry); // For retrieving data
export const binRegistryInsertSchema = createInsertSchema(binRegistry); // For inserting new records
export type BinRegistryEntry = typeof binRegistry.$inferSelect; // TypeScript type for use in application code
