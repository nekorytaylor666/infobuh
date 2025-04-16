import { Hono } from "hono";
import type { HonoEnv } from "../env";
import {
	documentsFlutter,
	documentSignatures,
	documentSignaturesFlutter,
	eq,
	and,
	desc,
} from "@accounting-kz/db";
import { HTTPException } from "hono/http-exception";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
export const documentsFlutterRouter = new Hono<HonoEnv>();

const NCALAYER_URL = "http://91.147.92.61:14579";

documentsFlutterRouter.get(
	"/receiver/:receiverBin",
	describeRoute({
	  description: "Get all documents where the receiverBin matches",
	  tags: ["Documents"],
	  parameters: [
		{
		  name: "receiverBin",
		  in: "path",
		  required: true,
		  schema: { type: "string" },
		  description: "BIN of the receiver to filter documents by",
		},
	  ],
	  responses: {
		200: {
		  description: "List of documents for that BIN",
		  content: { "application/json": {} },
		},
		500: { description: "Internal server error" },
	  },
	}),
	async (c) => {
	  const receiverBin = c.req.param("receiverBin");
  
	  const docs = await c.env.db.query.documentsFlutter.findMany({
		where: eq(documentsFlutter.receiverBin, receiverBin),
		orderBy: [desc(documentsFlutter.createdAt)],
	  });
  
	  return c.json(docs);
	},
  );

// GET all documents for a legal entity
documentsFlutterRouter.get(
	"/:legalEntityId",
	describeRoute({
		description: "Get all documents for a legal entity",
		tags: ["Documents"],
		responses: {
			200: {
				description: "List of documents",
				content: {
					"application/json": {},
				},
			},
			500: {
				description: "Internal server error",
			},
		},
	}),
	async (c) => {
		const legalEntityId = c.req.param("legalEntityId");

		const docs = await c.env.db.query.documentsFlutter.findMany({
			where: eq(documentsFlutter.legalEntityId, legalEntityId),
			orderBy: [desc(documentsFlutter.createdAt)],
		});

		return c.json(docs);
	},
);

// GET a specific document for a legal entity
documentsFlutterRouter.get(
	"/:legalEntityId/:id",
	describeRoute({
		description: "Get a specific document for a legal entity",
		tags: ["Documents"],
		responses: {
			200: {
				description: "Document retrieved successfully",
				content: {
					"application/json": {},
				},
			},
			404: {
				description: "Document not found",
			},
			500: {
				description: "Internal server error",
			},
		},
	}),
	async (c) => {
		const id = c.req.param("id");
		const legalEntityId = c.req.param("legalEntityId");

		const doc = await c.env.db.query.documentsFlutter.findFirst({
			where: and(
				eq(documentsFlutter.id, id),
				eq(documentsFlutter.legalEntityId, legalEntityId),
			),
		});

		if (!doc) {
			throw new HTTPException(404, { message: "Document not found" });
		}

		return c.json(doc);
	},
);

// POST: Create a new document for a legal entity
documentsFlutterRouter.post(
	"/:legalEntityId",
	describeRoute({
		description: "Create a new document for a legal entity",
		tags: ["Documents"],
		responses: {
			200: {
				description: "Document created successfully",
				content: {
					"application/json": {},
				},
			},
			400: {
				description: "Missing required fields",
			},
			500: {
				description: "Internal server error",
			},
		},
	}),
	async (c) => {
		const legalEntityId = c.req.param("legalEntityId");
		const body = await c.req.json();
		const { type, receiverBin, receiverName, fields, file, cms } = body;

		// Basic validation for required fields
		if (
			!type ||
			!receiverBin ||
			!receiverName ||
			!fields ||
			!file ||
			!file.data ||
			!file.name
		) {
			throw new HTTPException(400, {
				message: "Missing required fields or file data",
			});
		}

		// Create a unique file path (e.g., legalEntityId/timestamp-filename)
		const fileName = file.name;
		const newFilePath = `${legalEntityId}/${Date.now()}-${fileName}`;

		// Convert the base64 encoded file data to a buffer
		const fileBuffer = Buffer.from(file.data, "base64");

		// Upload file to Supabase Storage (bucket "documents")
		const { error: uploadError } = await c.env.supabase.storage
			.from("documents")
			.upload(newFilePath, fileBuffer, {
				contentType: file.contentType || "application/octet-stream",
			});
		if (uploadError) {
			throw new HTTPException(500, {
				message: "Failed to upload file to storage",
			});
		}

		// Insert the document record with the uploaded file path
		const newDoc = await c.env.db
			.insert(documentsFlutter)
			.values({
				legalEntityId,
				type,
				receiverBin,
				receiverName,
				fields,
				filePath: newFilePath,
			})
			.returning();

		return c.json(newDoc[0]);
	},
);

// PUT: Update an existing document for a legal entity (only if not signed and doesn't have CMS)
documentsFlutterRouter.put(
	"/:legalEntityId/:id",
	describeRoute({
		description: "Update an existing document for a legal entity",
		tags: ["Documents"],
		responses: {
			200: {
				description: "Document updated successfully",
				content: {
					"application/json": {},
				},
			},
			400: {
				description:
					"Cannot update document that is signed or has CMS / Invalid update",
			},
			404: {
				description: "Document not found",
			},
			500: {
				description: "Internal server error",
			},
		},
	}),
	async (c) => {
		const id = c.req.param("id");
		const legalEntityId = c.req.param("legalEntityId");
		const body = await c.req.json();

		// Retrieve the document to check update eligibility
		const doc = await c.env.db.query.documentsFlutter.findFirst({
			where: and(
				eq(documentsFlutter.id, id),
				eq(documentsFlutter.legalEntityId, legalEntityId),
			),
		});

		if (!doc) {
			throw new HTTPException(404, { message: "Document not found" });
		}

		let updatedFilePath = doc.filePath;
		if (body.file?.data && body.file.name) {
			// Remove the old file from Supabase Storage if exists
			if (doc.filePath) {
				const { error: removeError } = await c.env.supabase.storage
					.from("documents")
					.remove([doc.filePath]);
				if (removeError) {
					throw new HTTPException(500, {
						message: "Failed to delete old file from storage",
					});
				}
			}

			// Generate a new unique file path and upload the new file
			const fileName = body.file.name;
			const newFilePath = `${legalEntityId}/${Date.now()}-${fileName}`;
			const fileBuffer = Buffer.from(body.file.data, "base64");
			const { error: uploadError } = await c.env.supabase.storage
				.from("documents")
				.upload(newFilePath, fileBuffer, {
					contentType: body.file.contentType || "application/octet-stream",
				});
			if (uploadError) {
				throw new HTTPException(500, {
					message: "Failed to upload new file to storage",
				});
			}
			updatedFilePath = newFilePath;
		}

		// Update the document record with the new file path if applicable
		const updatedDoc = await c.env.db
			.update(documentsFlutter)
			.set({
				type: body.type ?? doc.type,
				receiverBin: body.receiverBin ?? doc.receiverBin,
				receiverName: body.receiverName ?? doc.receiverName,
				fields: body.fields ?? doc.fields,
				filePath: updatedFilePath,
			})
			.where(
				and(
					eq(documentsFlutter.id, id),
					eq(documentsFlutter.legalEntityId, legalEntityId),
				),
			)
			.returning();

		if (!updatedDoc.length) {
			throw new HTTPException(404, {
				message: "Document not found or update failed",
			});
		}

		return c.json(updatedDoc[0]);
	},
);

documentsFlutterRouter.post(
	"/:legalEntityId/:id/sign",
	describeRoute({
		description:
			"Signs a document via NCALayer using the provided key, password, and signerId. The signature is then stored and returned.",
		tags: ["Documents", "Sign"],
		responses: {
			200: {
				description:
					"Document signed successfully. Returns the signature record.",
				content: { "application/json": {} },
			},
			404: {
				description: "Document not found",
			},
			500: {
				description: "Internal server error",
			},
		},
	}),
	async (c) => {
		const id = c.req.param("id");
		const legalEntityId = c.req.param("legalEntityId");
		const body = await c.req.json();
		const { key, password, signerId } = body; // Make sure to pass signerId from frontend!

		// 1) Verify the document exists
		const doc = await c.env.db
			.select()
			.from(documentsFlutter)
			.where(
				and(
					eq(documentsFlutter.id, id),
					eq(documentsFlutter.legalEntityId, legalEntityId),
				),
			);

		if (!doc.length) {
			throw new HTTPException(404, { message: "Document not found" });
		}

		// 2) Download from the correct bucket & file path
		const { data: fileData, error: storageError } = await c.env.supabase.storage
			.from("documents") // Make sure this matches your upload bucket
			.download(doc[0].filePath); // filePath is the actual column name

		if (storageError || !fileData) {
			throw new HTTPException(500, {
				message: "Failed to get file from storage",
			});
		}

		// 3) Convert file to base64
		const fileBuffer = await fileData.arrayBuffer();
		const base64Data = Buffer.from(fileBuffer).toString("base64");

		// 4) Build request for NCALayer
		const signRequest = {
			data: base64Data,
			signers: [
				{
					key,
					password,
					keyAlias: null, // if needed
				},
			],
			withTsp: true,
			tsaPolicy: "TSA_GOST_POLICY",
			detached: false,
		};

		try {
			// 5) Send to NCALayer
			const response = await fetch(`${NCALAYER_URL}/cms/sign`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
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

			// 6) Insert signature record into your new table:
			const [signature] = await c.env.db
				.insert(documentSignaturesFlutter)
				.values({
					documentFlutterId: id,
					signerId,
					cms: result.cms,
					signedAt: new Date(),
				})
				.returning();

			// 7) Return the new signature
			return c.json(signature);
		} catch (error) {
			console.error("Signing error:", error);
			throw new HTTPException(500, {
				message:
					error instanceof Error ? error.message : "Failed to sign document",
			});
		}
	},
);

// GET: Document’s signatures (via documentSignaturesFlutter)
documentsFlutterRouter.get(
	"/:legalEntityId/:id/signatures",
	describeRoute({
		description:
			"Retrieves all signatures for a given document (Flutter version) along with signer details.",
		tags: ["Documents", "Sign"],
		responses: {
			200: {
				description: "List of document signatures",
				content: { "application/json": {} },
			},
			404: {
				description: "Document not found",
			},
			500: {
				description: "Internal server error",
			},
		},
	}),
	async (c) => {
		const id = c.req.param("id");
		const legalEntityId = c.req.param("legalEntityId");

		// 1) Verify doc exists
		const doc = await c.env.db
			.select()
			.from(documentsFlutter)
			.where(
				and(
					eq(documentsFlutter.id, id),
					eq(documentsFlutter.legalEntityId, legalEntityId),
				),
			);

		if (!doc.length) {
			throw new HTTPException(404, { message: "Document not found" });
		}

		// 2) Fetch all the flutter signatures referencing this doc
		const signatures = await c.env.db.query.documentSignaturesFlutter.findMany({
			where: eq(documentSignaturesFlutter.documentFlutterId, id),
			with: {
				signer: true, // see .signer relation in your schema
			},
			orderBy: [desc(documentSignaturesFlutter.signedAt)],
		});

		return c.json(signatures);
	},
);

