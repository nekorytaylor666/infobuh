import { Hono } from "hono";
import type { HonoEnv } from "../env";
import { HTTPException } from "hono/http-exception";
import {
	and,
	documents,
	eq,
	desc,
	documentSignatures,
} from "@accounting-kz/db";

const NCALAYER_URL = "http://91.147.92.61:14579";

export const documentsRouter = new Hono<HonoEnv>();

// Get all documents for a legal entity
documentsRouter.get("/:legalEntityId?", async (c) => {
	const legalEntityId = c.req.param("legalEntityId");
	const includeChildren = c.req.query("includeChildren") === "true";
	const docs = await c.env.db.query.documents.findMany({
		where: and(eq(documents.legalEntityId, legalEntityId as string)),
		orderBy: [desc(documents.createdAt)],
		with: {
			createdBy: true,
			signatures: {
				with: {
					signer: true,
				},
			},
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

// Sign a document
documentsRouter.post("/:legalEntityId/:id/sign", async (c) => {
	const id = c.req.param("id");
	const legalEntityId = c.req.param("legalEntityId");
	const body = await c.req.json();
	const { key, password, signerId } = body;

	// First check if document exists
	const doc = await c.env.db
		.select()
		.from(documents)
		.where(
			and(eq(documents.id, id), eq(documents.legalEntityId, legalEntityId)),
		);

	if (!doc.length) {
		throw new HTTPException(404, { message: "Document not found" });
	}

	// Get the file from storage
	const { data: fileData, error: storageError } = await c.env.supabase.storage
		.from("documents")
		.download(doc[0].name);

	if (storageError || !fileData) {
		throw new HTTPException(500, {
			message: "Failed to get file from storage",
		});
	}

	// Convert file to base64
	const fileBuffer = await fileData.arrayBuffer();
	const base64Data = Buffer.from(fileBuffer).toString("base64");

	// Make request to NCALayer
	const signRequest = {
		data: base64Data,
		signers: [
			{
				key,
				password,
				keyAlias: null,
			},
		],
		withTsp: true,
		tsaPolicy: "TSA_GOST_POLICY",
		detached: false,
	};

	try {
		const response = await fetch(`${NCALAYER_URL}/cms/sign`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(signRequest),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.message ||
					`NCALayer responded with status: ${response.status}`,
			);
		}

		const result = await response.json();

		if (!result.cms) {
			throw new Error("No CMS data received from NCALayer");
		}

		// Create signature record
		const signature = await c.env.db
			.insert(documentSignatures)
			.values({
				documentId: id,
				signerId,
				cms: result.cms,
				signedAt: new Date(),
			})
			.returning();

		return c.json(signature[0]);
	} catch (error) {
		throw new HTTPException(500, {
			message:
				error instanceof Error ? error.message : "Failed to sign document",
		});
	}
});

// Get document signatures
documentsRouter.get("/:legalEntityId/:id/signatures", async (c) => {
	const id = c.req.param("id");
	const legalEntityId = c.req.param("legalEntityId");

	// First check if document exists
	const doc = await c.env.db
		.select()
		.from(documents)
		.where(
			and(eq(documents.id, id), eq(documents.legalEntityId, legalEntityId)),
		);

	if (!doc.length) {
		throw new HTTPException(404, { message: "Document not found" });
	}

	// Get signatures with signer info
	const signatures = await c.env.db.query.documentSignatures.findMany({
		where: eq(documentSignatures.documentId, id),
		with: {
			signer: true,
		},
		orderBy: [desc(documentSignatures.signedAt)],
	});

	return c.json(signatures);
});
