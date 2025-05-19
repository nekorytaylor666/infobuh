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
