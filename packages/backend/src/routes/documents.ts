import { Hono } from "hono";
import { eq, and, desc } from "drizzle-orm";
import type { HonoEnv } from "../db";
import { documents } from "../db/schema";
import { HTTPException } from "hono/http-exception";

export const documentsRouter = new Hono<HonoEnv>();

// Get all documents for a legal entity
documentsRouter.get("/:legalEntityId", async (c) => {
	const legalEntityId = c.req.param("legalEntityId");

	const docs = await c.env.db.query.documents.findMany({
		where: eq(documents.legalEntityId, legalEntityId),
		orderBy: [desc(documents.createdAt)],
		with: {
			createdBy: true,
		},
	});

	return c.json(docs);
});

// Get a single document
documentsRouter.get("/:legalEntityId/:id", async (c) => {
	const id = c.req.param("id");
	const legalEntityId = c.req.param("legalEntityId");

	const doc = await c.env.db
		.select()
		.from(documents)
		.where(
			and(eq(documents.id, id), eq(documents.legalEntityId, legalEntityId)),
		);

	if (!doc.length) {
		throw new HTTPException(404, { message: "Document not found" });
	}

	return c.json(doc[0]);
});

// Create a new folder
documentsRouter.post("/:legalEntityId/folders", async (c) => {
	const legalEntityId = c.req.param("legalEntityId");
	const body = await c.req.json();
	const { name, parentId, ownerId } = body;

	if (!name) {
		throw new HTTPException(400, { message: "Folder name is required" });
	}

	// Create folder record in database
	const folder = await c.env.db
		.insert(documents)
		.values({
			name,
			type: "folder",
			size: "0",
			legalEntityId,
			ownerId,
			parentId: parentId || null,
		})
		.returning();

	return c.json(folder[0]);
});

// Create a new document
documentsRouter.post("/:legalEntityId", async (c) => {
	const legalEntityId = c.req.param("legalEntityId");
	const body = await c.req.json();

	const { file, ownerId, parentId } = body;

	// Create document record in database
	const doc = await c.env.db
		.insert(documents)
		.values({
			name: file.name,
			type: "file",
			size: `${file.size}`,
			path: file.path,
			legalEntityId,
			ownerId,
			parentId: parentId || null,
		})
		.returning();

	return c.json(doc[0]);
});

// Update a document
documentsRouter.put("/:legalEntityId/:id", async (c) => {
	const id = c.req.param("id");
	const legalEntityId = c.req.param("legalEntityId");
	const body = await c.req.json();

	const doc = await c.env.db
		.update(documents)
		.set({
			name: body.name,
			parentId: body.parentId,
			updatedAt: new Date(),
		})
		.where(
			and(eq(documents.id, id), eq(documents.legalEntityId, legalEntityId)),
		)
		.returning();

	if (!doc.length) {
		throw new HTTPException(404, { message: "Document not found" });
	}

	return c.json(doc[0]);
});

// Delete a document
documentsRouter.delete("/:legalEntityId/:id", async (c) => {
	const id = c.req.param("id");
	const legalEntityId = c.req.param("legalEntityId");

	// First get the document to get the storage path
	const doc = await c.env.db
		.select()
		.from(documents)
		.where(
			and(eq(documents.id, id), eq(documents.legalEntityId, legalEntityId)),
		);

	if (!doc.length) {
		throw new HTTPException(404, { message: "Document not found" });
	}

	// Delete from Supabase Storage if it's a file
	if (doc[0].path) {
		const { error: storageError } = await c.env.supabase.storage
			.from("documents")
			.remove([doc[0].path]);

		if (storageError) {
			throw new HTTPException(500, {
				message: "Failed to delete file from storage",
			});
		}
	}

	// Delete from database
	await c.env.db
		.delete(documents)
		.where(
			and(eq(documents.id, id), eq(documents.legalEntityId, legalEntityId)),
		);

	return c.json({ success: true });
});
