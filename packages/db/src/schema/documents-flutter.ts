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
import { relations, sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { legalEntities } from "./legal-entities";
import { profile } from "./auth";
import { comments } from "./comments";

export const documentsFlutter = pgTable(
	"documents_flutter",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		legalEntityId: uuid("legal_entity_id")
			.references(() => legalEntities.id)
			.notNull(),
		type: varchar("type", { length: 50 }).notNull(),
		receiverBin: varchar("receiver_bin", { length: 20 }).notNull(),
		receiverName: varchar("receiver_name", { length: 255 }).notNull(),
		fields: jsonb("fields").notNull(),
		documentPayload: jsonb("document_payload"), // Stores typed document metadata
		filePath: text("file_path").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => [
		index("documents_flutter_legal_entity_id_idx").on(table.legalEntityId),
		index("documents_flutter_receiver_bin_idx").on(table.receiverBin),
		index("documents_flutter_legal_entity_type_idx").on(
			table.legalEntityId,
			table.type,
		),
		index("documents_flutter_legal_entity_created_at_idx").on(
			table.legalEntityId,
			table.createdAt,
		),
	],
);

// Add relations for documentsFlutter
export const documentsFlutterRelations = relations(
	documentsFlutter,
	({ one, many }) => ({
		legalEntity: one(legalEntities, {
			fields: [documentsFlutter.legalEntityId],
			references: [legalEntities.id],
		}),
		signatures: many(documentSignaturesFlutter),
		readStatuses: many(documentFlutterReadStatus),
		pins: many(documentFlutterPins),
		comments: many(comments),
	}),
);

export const documentFlutterZodSchema = createSelectSchema(documentsFlutter);

// New table for document read status
export const documentFlutterReadStatus = pgTable(
	"document_flutter_read_status",
	{
		profileId: uuid("profile_id")
			.references(() => profile.id, { onDelete: "cascade" })
			.notNull(),
		documentFlutterId: uuid("document_flutter_id")
			.references(() => documentsFlutter.id, { onDelete: "cascade" })
			.notNull(),
		readAt: timestamp("read_at").defaultNow().notNull(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.profileId, table.documentFlutterId] }),
	}),
);

export const documentFlutterReadStatusRelations = relations(
	documentFlutterReadStatus,
	({ one }) => ({
		profile: one(profile, {
			fields: [documentFlutterReadStatus.profileId],
			references: [profile.id],
		}),
		documentFlutter: one(documentsFlutter, {
			fields: [documentFlutterReadStatus.documentFlutterId],
			references: [documentsFlutter.id],
		}),
	}),
);

// New table for document pinning
export const documentFlutterPins = pgTable(
	"document_flutter_pins",
	{
		profileId: uuid("profile_id")
			.references(() => profile.id, { onDelete: "cascade" })
			.notNull(),
		documentFlutterId: uuid("document_flutter_id")
			.references(() => documentsFlutter.id, { onDelete: "cascade" })
			.notNull(),
		pinnedAt: timestamp("pinned_at").defaultNow().notNull(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.profileId, table.documentFlutterId] }),
	}),
);

export const documentFlutterPinsRelations = relations(
	documentFlutterPins,
	({ one }) => ({
		profile: one(profile, {
			fields: [documentFlutterPins.profileId],
			references: [profile.id],
		}),
		documentFlutter: one(documentsFlutter, {
			fields: [documentFlutterPins.documentFlutterId],
			references: [documentsFlutter.id],
		}),
	}),
);

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
		legalEntityId: uuid("legal_entity_id")
			.references(() => legalEntities.id)
			.notNull(),

		// Fields from verifier service
		isValid: boolean("is_valid"),
		notBefore: timestamp("not_before"),
		notAfter: timestamp("not_after"),
		keyUsage: varchar("key_usage", { length: 255 }),
		serialNumber: varchar("serial_number", { length: 255 }),
		signAlg: varchar("sign_alg", { length: 255 }),
		signature: text("signature"),
		subjectCommonName: varchar("subject_common_name", { length: 255 }),
		subjectLastName: varchar("subject_last_name", { length: 255 }),
		subjectSurName: varchar("subject_sur_name", { length: 255 }),
		subjectEmail: varchar("subject_email", { length: 255 }),
		subjectOrganization: text("subject_organization"),
		subjectIin: varchar("subject_iin", { length: 12 }),
		subjectBin: varchar("subject_bin", { length: 12 }),
		subjectCountry: varchar("subject_country", { length: 2 }),
		subjectLocality: varchar("subject_locality", { length: 255 }),
		subjectState: varchar("subject_state", { length: 255 }),
		issuerCommonName: varchar("issuer_common_name", { length: 255 }),
		issuerOrganization: text("issuer_organization"),
		issuerIin: varchar("issuer_iin", { length: 12 }),
		issuerBin: varchar("issuer_bin", { length: 12 }),
		tspSerialNumber: varchar("tsp_serial_number", { length: 255 }),
		tspGenTime: timestamp("tsp_gen_time"),
		tspPolicy: varchar("tsp_policy", { length: 255 }),
		tspHashAlgorithm: varchar("tsp_hash_algorithm", { length: 255 }),
		tspHash: varchar("tsp_hash", { length: 255 }),
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
		legalEntity: one(legalEntities, {
			fields: [documentSignaturesFlutter.legalEntityId],
			references: [legalEntities.id],
		}),
	}),
);

// Document Payload Schema Types
// Base document payload schema
const baseDocumentPayloadSchema = z.object({
	generatedAt: z.string().datetime().optional(),
	generatedBy: z.string().uuid().optional(),
});

// Item schemas reused across document types
const documentItemSchema = z.object({
	name: z.string(),
	quantity: z.number(),
	unit: z.string(),
	price: z.number(),
	description: z.string().optional(),
});

const bankSchema = z.object({
	name: z.string().optional(),
	account: z.string().optional(),
	bik: z.string().optional(),
});

// Discriminated union for all document types
export const documentPayloadSchema = z.discriminatedUnion("documentType", [
	z.object({ 
		documentType: z.literal("АВР"),
		...baseDocumentPayloadSchema.shape,
		data: z.object({
			orgName: z.string(),
			orgAddress: z.string(),
			orgBin: z.string(),
			buyerName: z.string(),
			buyerBin: z.string(),
			buyerAddress: z.string().optional(),
			contractNumber: z.string(),
			contractDate: z.string().optional(),
			orgPersonName: z.string().optional().nullable(),
			orgPersonRole: z.string(),
			buyerPersonName: z.string().optional().nullable(),
			buyerPersonRole: z.string(),
			phone: z.string().optional(),
			selectedBank: bankSchema.optional(),
			items: z.array(documentItemSchema),
			actNumber: z.string(),
			actDate: z.string(),
			sellerImage: z.string().optional(),
			kbe: z.string().optional(),
			executorName: z.string().optional().nullable(),
			executorPosition: z.string().optional(),
			customerName: z.string().optional().nullable(),
			customerPosition: z.string().optional(),
		}),
	}),
	z.object({ 
		documentType: z.literal("Накладная"),
		...baseDocumentPayloadSchema.shape,
		data: z.object({
			orgName: z.string(),
			orgAddress: z.string().optional(),
			orgBin: z.string(),
			buyerName: z.string(),
			buyerBin: z.string(),
			orgPersonName: z.string().optional().nullable(),
			orgPersonRole: z.string().optional(),
			buyerPersonName: z.string().optional().nullable(),
			buyerPersonRole: z.string().optional(),
			phone: z.string().optional(),
			selectedBank: bankSchema.optional(),
			items: z.array(z.object({
				...documentItemSchema.shape,
				nomenclatureCode: z.string().optional(),
			})),
			waybillNumber: z.string(),
			waybillDate: z.string(),
			contractNumber: z.string().optional(),
			contractDate: z.string().optional(),
			senderEmployeeId: z.string().uuid().optional().nullable(),
			receiverEmployeeId: z.string().uuid().optional().nullable(),
			releaserEmployeeId: z.string().uuid().optional().nullable(),
			transportOrgName: z.string().optional(),
			transportResponsiblePerson: z.string().optional(),
		}),
	}),
	z.object({ 
		documentType: z.literal("Счет на оплату"),
		...baseDocumentPayloadSchema.shape,
		data: z.object({
			orgName: z.string(),
			orgAddress: z.string().optional(),
			orgBin: z.string(),
			orgIik: z.string().optional(),
			orgBik: z.string().optional(),
			buyerName: z.string(),
			buyerBin: z.string(),
			codeKnp: z.string().optional(),
			contract: z.string(),
			orgPersonName: z.string().optional().nullable(),
			phone: z.string().optional(),
			selectedBank: bankSchema.optional(),
			items: z.array(documentItemSchema),
			invoiceNumber: z.string(),
			invoiceDate: z.string(),
			contractDate: z.string().optional(),
			executorEmployeeId: z.string().uuid().optional().nullable(),
		}),
	}),
	z.object({ 
		documentType: z.literal("Инвойс"),
		...baseDocumentPayloadSchema.shape,
		data: z.object({
			orgName: z.string(),
			orgAddress: z.string().optional(),
			orgBin: z.string(),
			orgIik: z.string().optional(),
			orgBik: z.string().optional(),
			buyerName: z.string(),
			buyerBin: z.string(),
			codeKnp: z.string().optional(),
			contract: z.string(),
			orgPersonName: z.string().optional().nullable(),
			phone: z.string().optional(),
			selectedBank: bankSchema.optional(),
			items: z.array(documentItemSchema),
			invoiceNumber: z.string(),
			invoiceDate: z.string(),
			contractDate: z.string().optional(),
			executorEmployeeId: z.string().uuid().optional().nullable(),
		}),
	}),
	z.object({ 
		documentType: z.literal("Доверенность"),
		...baseDocumentPayloadSchema.shape,
		data: z.object({
			orgName: z.string(),
			orgAddress: z.string().optional(),
			orgBin: z.string(),
			buyerName: z.string(),
			buyerBin: z.string(),
			schetNaOplatu: z.string(),
			orgPersonName: z.string().optional().nullable(),
			orgPersonRole: z.string().optional(),
			bookkeeperName: z.string().optional().nullable(),
			phone: z.string().optional(),
			selectedBank: bankSchema.optional(),
			employeeName: z.string(),
			employeeRole: z.string(),
			employeeIin: z.string().optional().nullable(),
			employeeDocNumber: z.string(),
			employeeDocNumberDate: z.string(),
			employeeWhoGives: z.string(),
			dateUntil: z.string(),
			items: z.array(documentItemSchema),
			idx: z.string(),
			issueDate: z.string(),
		}),
	}),
	z.object({ 
		documentType: z.literal("КП"), // Commercial Proposal
		...baseDocumentPayloadSchema.shape,
		data: z.object({
			orgName: z.string(),
			orgBin: z.string(),
			buyerName: z.string(),
			buyerBin: z.string(),
			proposalNumber: z.string(),
			proposalDate: z.string(),
			validUntil: z.string().optional(),
			items: z.array(documentItemSchema),
			terms: z.string().optional(),
			notes: z.string().optional(),
		}),
	}),
	z.object({ 
		documentType: z.literal("Other"), // For uploaded files without specific schema
		...baseDocumentPayloadSchema.shape,
		data: z.object({
			fileName: z.string(),
			fileType: z.string(),
			fileSize: z.number().optional(),
			description: z.string().optional(),
			metadata: z.record(z.any()).optional(),
		}),
	}),
]);

// Export types
export type DocumentPayload = z.infer<typeof documentPayloadSchema>;
export type DocumentPayloadType = DocumentPayload["documentType"];