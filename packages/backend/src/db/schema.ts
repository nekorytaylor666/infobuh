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
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
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
      if (typeof arg === 'string' || arg instanceof Date) {
        return new Date(arg);
      }
    }, z.date()),
  });
export const legalEntityUpdateSchema = legalEntityZodSchema.partial().extend({
	registrationDate: z.preprocess(
	  (arg) =>
		typeof arg === "string" || arg instanceof Date ? new Date(arg) : arg,
	  z.date()
	).optional(),
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

export const documents = pgTable("documents", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: varchar("name", { length: 255 }).notNull(),
	type: varchar("type", { length: 50 }).notNull(), // "file" or "folder"
	size: varchar("size", { length: 50 }), // Optional for folders
	path: text("path"), // Storage path for files
	parentId: uuid("parent_id").references((): any => documents.id), // For folder structure
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

export const documentSignaturesFlutter = pgTable("document_signatures_flutter", {
	id: uuid("id").defaultRandom().primaryKey(),
	documentFlutterId: uuid("document_flutter_id")
	  .references(() => documentsFlutter.id, { onDelete: "cascade" })
	  .notNull(),
	signerId: uuid("signer_id")
	  .references(() => profile.id)
	  .notNull(),
	cms: text("cms").notNull(),
	signedAt: timestamp("signed_at").defaultNow().notNull(),
  });
  
  // If you’d like relations:
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
	})
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
	name: varchar("name", { length: 256 }).notNull(),
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
  
