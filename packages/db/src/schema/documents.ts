import {
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
	type PgTableWithColumns,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { legalEntities } from "./legal-entities";
import { profile } from "./auth";
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
