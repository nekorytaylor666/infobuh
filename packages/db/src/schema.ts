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
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

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

export const documentsFlutter = pgTable("documents_flutter", {
	id: uuid("id").defaultRandom().primaryKey(),
	legalEntityId: uuid("legal_entity_id")
		.references(() => legalEntities.id)
		.notNull(),
	type: varchar("type", { length: 50 }).notNull(),
	receiverBin: varchar("receiver_bin", { length: 20 }).notNull(),
	receiverName: varchar("receiver_name", { length: 255 }).notNull(),
	fields: jsonb("fields").notNull(),
	filePath: text("file_path").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Explicitly define the type for the documents table including columns
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type DocumentsTable = PgTableWithColumns<any>;

export const documents = pgTable("documents", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: varchar("name", { length: 255 }).notNull(),
	type: varchar("type", { length: 50 }).notNull(), // "file" or "folder"
	size: varchar("size", { length: 50 }), // Optional for folders
	path: text("path"), // Storage path for files
	// Explicitly type the self-referencing function
	parentId: uuid("parent_id").references(
		(): DocumentsTable["id"] => documents.id,
	),
	legalEntityId: uuid("legal_entity_id")
		.references(() => legalEntities.id)
		.notNull(),
	ownerId: uuid("owner_id")
		.references(() => profile.id)
		.notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type DocumentWithOwnerSignature = typeof documents.$inferSelect & {
	createdBy: typeof profile.$inferSelect;
	signatures: (typeof documentSignatures.$inferSelect)[];
};

export const documentSignatures = pgTable("document_signatures", {
	id: uuid("id").defaultRandom().primaryKey(),
	documentId: uuid("document_id")
		.references(() => documents.id, { onDelete: "cascade" })
		.notNull(),
	signerId: uuid("signer_id")
		.references(() => profile.id)
		.notNull(),
	cms: text("cms").notNull(),
	signedAt: timestamp("signed_at").defaultNow().notNull(),
});

export const documentSignaturesFlutter = pgTable(
	"document_signatures_flutter",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		documentFlutterId: uuid("document_flutter_id")
			.references(() => documentsFlutter.id, { onDelete: "cascade" })
			.notNull(),
		signerId: uuid("signer_id")
			.references(() => profile.id)
			.notNull(),
		cms: text("cms").notNull(),
		signedAt: timestamp("signed_at").defaultNow().notNull(),
	},
);

// If you'd like relations:
export const documentSignaturesFlutterRelations = relations(
	documentSignaturesFlutter,
	({ one }) => ({
		documentFlutter: one(documentsFlutter, {
			fields: [documentSignaturesFlutter.documentFlutterId],
			references: [documentsFlutter.id],
		}),
		signer: one(profile, {
			fields: [documentSignaturesFlutter.signerId],
			references: [profile.id],
		}),
	}),
);

export type DocumentSignature = typeof documentSignatures.$inferSelect;
export type DocumentSignatureWithSigner =
	typeof documentSignatures.$inferSelect & {
		signer: typeof profile.$inferSelect;
	};

export const documentSignaturesRelations = relations(
	documentSignatures,
	({ one }) => ({
		document: one(documents, {
			fields: [documentSignatures.documentId],
			references: [documents.id],
		}),
		signer: one(profile, {
			fields: [documentSignatures.signerId],
			references: [profile.id],
		}),
	}),
);

export const documentPermissions = pgTable("document_permissions", {
	id: uuid("id").primaryKey().defaultRandom(),
	documentId: uuid("document_id")
		.references(() => documents.id, { onDelete: "cascade" })
		.notNull(),
	profileId: uuid("profile_id")
		.references(() => profile.id, { onDelete: "cascade" })
		.notNull(),
	permission: varchar("permission", { length: 20 }).notNull(), // 'read', 'write', 'admin'
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

export type DocumentPermission = typeof documentPermissions.$inferSelect;

export const documentsRelations = relations(documents, ({ one, many }) => ({
	parent: one(documents, {
		fields: [documents.parentId],
		references: [documents.id],
	}),
	children: many(documents),
	legalEntity: one(legalEntities, {
		fields: [documents.legalEntityId],
		references: [legalEntities.id],
	}),
	createdBy: one(profile, {
		fields: [documents.ownerId],
		references: [profile.id],
	}),
	permissions: many(documentPermissions),
	signatures: many(documentSignatures),
}));

export const documentPermissionsRelations = relations(
	documentPermissions,
	({ one }) => ({
		document: one(documents, {
			fields: [documentPermissions.documentId],
			references: [documents.id],
		}),
		profile: one(profile, {
			fields: [documentPermissions.profileId],
			references: [profile.id],
		}),
	}),
);

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

// Document templates for generating forms and PDFs
export const documentTemplates = pgTable("document_templates", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: varchar("name", { length: 255 }).notNull(),
	description: text("description"),
	jsonSchema: jsonb("json_schema").notNull(), // JSON Schema for form generation
	zodSchema: text("zod_schema").notNull(), // Zod schema as serialized string
	pdfTemplate: jsonb("pdf_template"), // PDF layout configuration
	legalEntityId: uuid("legal_entity_id")
		.references(() => legalEntities.id)
		.notNull(),
	createdById: uuid("created_by_id")
		.references(() => profile.id)
		.notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type DocumentTemplate = typeof documentTemplates.$inferSelect;

export const documentTemplateRelations = relations(
	documentTemplates,
	({ one }) => ({
		legalEntity: one(legalEntities, {
			fields: [documentTemplates.legalEntityId],
			references: [legalEntities.id],
		}),
		createdBy: one(profile, {
			fields: [documentTemplates.createdById],
			references: [profile.id],
		}),
	}),
);

// Document instances generated from templates
export const generatedDocuments = pgTable("generated_documents", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: varchar("name", { length: 255 }).notNull(),
	templateId: uuid("template_id")
		.references(() => documentTemplates.id)
		.notNull(),
	documentData: jsonb("document_data").notNull(), // Form data used to generate the document
	pdfPath: text("pdf_path"), // Path to the generated PDF file
	documentId: uuid("document_id").references(() => documents.id), // Link to the documents table if saved as a file
	legalEntityId: uuid("legal_entity_id")
		.references(() => legalEntities.id)
		.notNull(),
	createdById: uuid("created_by_id")
		.references(() => profile.id)
		.notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type GeneratedDocument = typeof generatedDocuments.$inferSelect;

export const generatedDocumentRelations = relations(
	generatedDocuments,
	({ one }) => ({
		template: one(documentTemplates, {
			fields: [generatedDocuments.templateId],
			references: [documentTemplates.id],
		}),
		document: one(documents, {
			fields: [generatedDocuments.documentId],
			references: [documents.id],
		}),
		legalEntity: one(legalEntities, {
			fields: [generatedDocuments.legalEntityId],
			references: [legalEntities.id],
		}),
		createdBy: one(profile, {
			fields: [generatedDocuments.createdById],
			references: [profile.id],
		}),
	}),
);

export const partners = pgTable("partners", {
	id: uuid("id").primaryKey().defaultRandom(),
	legalEntityId: uuid("legal_entity_id")
		.references(() => legalEntities.id, { onDelete: "cascade" })
		.notNull(),
	bin: varchar("bin", { length: 12 }).notNull(),
	name: varchar("name", { length: 256 }).notNull(),
	address: text("address").notNull(),
	executerName: varchar("executer_name", { length: 256 }).notNull(),
	executerRole: varchar("executer_role", { length: 100 }).notNull(),
});

export const partnersRelations = relations(partners, ({ one }) => ({
	legalEntity: one(legalEntities, {
		fields: [partners.legalEntityId],
		references: [legalEntities.id],
	}),
}));

export const partnerZodSchema = createSelectSchema(partners);
export const partnerInsertSchema = createInsertSchema(partners);

export const contracts = pgTable("contracts", {
	id: uuid("id").primaryKey().defaultRandom(),
	legalEntityId: uuid("legal_entity_id")
		.references(() => legalEntities.id, { onDelete: "cascade" })
		.notNull(),
	number: integer("number").notNull(),
	date: date("date").notNull(),
	currency: varchar("currency", { length: 3 }).notNull(),
	partnerId: uuid("partner_id")
		.references(() => partners.id, { onDelete: "cascade" })
		.notNull(),
	filePath: text("file_path").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contractsRelations = relations(contracts, ({ one }) => ({
	legalEntity: one(legalEntities, {
		fields: [contracts.legalEntityId],
		references: [legalEntities.id],
	}),
	partner: one(partners, {
		fields: [contracts.partnerId],
		references: [partners.id],
	}),
}));

export const contractZodSchema = createSelectSchema(contracts);
export const contractInsertSchema = createInsertSchema(contracts);

export const products = pgTable("products", {
	id: uuid("id").primaryKey().defaultRandom(),
	legalEntityId: uuid("legal_entity_id")
		.references(() => legalEntities.id, { onDelete: "cascade" })
		.notNull(),
	type: varchar("type", { length: 50 }).notNull(),
	name: varchar("name", { length: 256 }).notNull(),
	measurement: varchar("measurement", { length: 50 }).notNull(),
	price: integer("price").notNull(),
	vat: integer("vat").notNull(),
});

export const productZodSchema = createSelectSchema(products);
export const productInsertSchema = createInsertSchema(products);

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
