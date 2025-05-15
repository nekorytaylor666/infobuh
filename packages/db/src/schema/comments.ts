import {
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid,
	varchar,
	integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { profile } from "./auth";
import { deals } from "./deal";
import { documentsFlutter } from "./documents-flutter";

export const comments = pgTable("comments", {
	id: uuid("id").defaultRandom().primaryKey(),
	content: text("content").notNull(),
	authorId: uuid("author_id")
		.references(() => profile.id, { onDelete: "set null" }) // Or "cascade" if a comment must be deleted if author is deleted
		.notNull(),
	dealId: uuid("deal_id").references(() => deals.id, {
		onDelete: "cascade",
	}),
	documentFlutterId: uuid("document_flutter_id").references(
		() => documentsFlutter.id,
		{ onDelete: "cascade" },
	),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const commentsRelations = relations(comments, ({ one, many }) => ({
	author: one(profile, {
		fields: [comments.authorId],
		references: [profile.id],
	}),
	deal: one(deals, {
		fields: [comments.dealId],
		references: [deals.id],
	}),
	documentFlutter: one(documentsFlutter, {
		fields: [comments.documentFlutterId],
		references: [documentsFlutter.id],
	}),
	attachments: many(commentAttachments),
}));

export const commentAttachments = pgTable("comment_attachments", {
	id: uuid("id").defaultRandom().primaryKey(),
	commentId: uuid("comment_id")
		.references(() => comments.id, { onDelete: "cascade" })
		.notNull(),
	filePath: text("file_path").notNull(),
	fileName: varchar("file_name", { length: 255 }).notNull(),
	fileSize: integer("file_size"), // Optional: good to store file size
	mimeType: varchar("mime_type", { length: 100 }), // Optional: good to store MIME type
	uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const commentAttachmentsRelations = relations(
	commentAttachments,
	({ one }) => ({
		comment: one(comments, {
			fields: [commentAttachments.commentId],
			references: [comments.id],
		}),
	}),
);
