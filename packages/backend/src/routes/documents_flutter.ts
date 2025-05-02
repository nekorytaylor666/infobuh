import { Hono } from "hono";
import type { HonoEnv } from "../env";
import {
	documentsFlutter,
	documentSignatures,
	documentSignaturesFlutter,
	eq,
	and,
	desc,
	isNull,
	inArray,
	legalEntities,
} from "@accounting-kz/db";
import { HTTPException } from "hono/http-exception";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { sendNotificationToLegalEntityByBin } from "../services/notification";

export const documentsFlutterRouter = new Hono<HonoEnv>();

const NCALAYER_URL = "https://signer.infobuh.com/";

// GET documents by receiver BIN
documentsFlutterRouter.get(
	"/listByReceiver",
	describeRoute({
		description: "Get all documents where the receiverBin matches",
		tags: ["Documents Flutter"],
		parameters: [
			{
				name: "receiverBin",
				in: "query",
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
		const receiverBin = c.req.query("receiverBin");

		if (!receiverBin) {
			throw new HTTPException(400, {
				message: "Missing receiverBin query parameter",
			});
		}

		const docs = await c.env.db.query.documentsFlutter.findMany({
			where: eq(documentsFlutter.receiverBin, receiverBin),
			orderBy: [desc(documentsFlutter.createdAt)],
			with: {
				signatures: {
					columns: {
						cms: false,
					},
					with: {
						signer: true,
					},
				},
			},
		});

		// Infer the type based on the query structure
		type DocumentWithSignatures = (typeof docs)[number];

		const documentsWithStatus = docs.map((doc: DocumentWithSignatures) => {
			let status = "unsigned";
			if (doc.signatures.length === 1) {
				status = "signedOne";
			}
			if (doc.signatures.length >= 2) {
				status = "signedBoth";
			}
			return {
				...doc,
				status,
			};
		});

		return c.json(documentsWithStatus);
	},
);

// GET all documents for a legal entity
documentsFlutterRouter.get(
	"/list",
	describeRoute({
		description: "Get all documents for a legal entity",
		tags: ["Documents Flutter"],
		parameters: [
			{
				name: "legalEntityId",
				in: "query",
				required: true,
				schema: { type: "string", format: "uuid" },
				description: "UUID of the legal entity",
			},
			{
				name: "type",
				in: "query",
				required: false,
				schema: { type: "string" },
				description: "Filter documents by type (e.g., 'invoice', 'contract')",
			},
		],
		responses: {
			200: {
				description: "List of documents",
				content: {
					"application/json": {},
				},
			},
			400: { description: "Missing or invalid legalEntityId query parameter" },
			500: {
				description: "Internal server error",
			},
		},
	}),
	async (c) => {
		const legalEntityId = c.req.query("legalEntityId");
		const type = c.req.query("type");
		if (!legalEntityId) {
			throw new HTTPException(400, {
				message: "Missing legalEntityId query parameter",
			});
		}

		const documentsList = await c.env.db.query.documentsFlutter.findMany({
			where: and(
				eq(documentsFlutter.legalEntityId, legalEntityId),
				type ? eq(documentsFlutter.type, type) : undefined,
			),

			orderBy: [desc(documentsFlutter.createdAt)],
			with: {
				signatures: {
					columns: {
						cms: false,
					},
					with: {
						signer: true,
					},
				},
			},
		});

		// Infer the type based on the query structure
		type DocumentListWithSignatures = (typeof documentsList)[number];

		const documentsListWithStatus = documentsList.map(
			(doc: DocumentListWithSignatures) => {
				let status = "unsigned";
				if (doc.signatures.length === 1) {
					status = "signedOne";
				}
				if (doc.signatures.length >= 2) {
					status = "signedBoth";
				}
				return {
					...doc,
					status,
				};
			},
		);

		return c.json(documentsListWithStatus);
	},
);

// GET a specific document for a legal entity
documentsFlutterRouter.get(
	"/get/:id",
	describeRoute({
		description: "Get a specific document for a legal entity",
		tags: ["Documents Flutter"],
		parameters: [
			{
				name: "id",
				in: "path",
				required: true,
				schema: { type: "string", format: "uuid" },
				description: "UUID of the document",
			},
			{
				name: "legalEntityId",
				in: "query",
				required: true,
				schema: { type: "string", format: "uuid" },
				description: "UUID of the legal entity",
			},
		],
		responses: {
			200: {
				description: "Document retrieved successfully",
				content: {
					"application/json": {},
				},
			},
			400: { description: "Missing or invalid legalEntityId query parameter" },
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
		const legalEntityId = c.req.query("legalEntityId");

		if (!legalEntityId) {
			throw new HTTPException(400, {
				message: "Missing legalEntityId query parameter",
			});
		}

		const doc = await c.env.db.query.documentsFlutter.findFirst({
			where: and(
				eq(documentsFlutter.id, id),
				eq(documentsFlutter.legalEntityId, legalEntityId),
			),
			with: {
				signatures: {
					with: {
						signer: true,
					},
				},
			},
		});

		if (!doc) {
			throw new HTTPException(404, { message: "Document not found" });
		}
		let status = "unsigned";
		if (doc.signatures.length === 1) {
			status = "signedOne";
		}
		if (doc.signatures.length >= 2) {
			status = "signedBoth";
		}
		return c.json({ ...doc, status });
	},
);

// POST: Create a new document for a legal entity
documentsFlutterRouter.post(
	"/create",
	describeRoute({
		description: "Create a new document for a legal entity",
		tags: ["Documents Flutter"],
		parameters: [
			{
				name: "legalEntityId",
				in: "query",
				required: true,
				schema: { type: "string", format: "uuid" },
				description: "UUID of the legal entity",
			},
		],
		responses: {
			200: {
				description: "Document created successfully",
				content: {
					"application/json": {},
				},
			},
			400: {
				description:
					"Missing required fields or missing/invalid legalEntityId query parameter",
			},
			500: {
				description: "Internal server error",
			},
		},
	}),
	async (c) => {
		const legalEntityId = c.req.query("legalEntityId");
		const body = await c.req.json();
		const { type, receiverBin, receiverName, fields, file } = body;

		if (!legalEntityId) {
			throw new HTTPException(400, {
				message: "Missing legalEntityId query parameter",
			});
		}
		const legalEntity = await c.env.db.query.legalEntities.findFirst({
			where: eq(legalEntities.id, legalEntityId),
			columns: {
				name: true,
				id: true,
			},
		});
		if (!legalEntity) {
			throw new HTTPException(404, {
				message: "Legal entity not found",
			});
		}
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
				message: "Missing required fields or file data in request body",
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
			console.error("Supabase upload error:", uploadError);
			throw new HTTPException(500, {
				message: "Failed to upload file to storage",
			});
		}

		// Insert the document record with the uploaded file path
		try {
			const [newDoc] = await c.env.db
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

			// Send notification to the receiver BIN
			sendNotificationToLegalEntityByBin(c, {
				receiverBin: newDoc.receiverBin,
				message: {
					notification: {
						title: "Получен новый документ",
						body: `${newDoc.type} от ${legalEntity.name}.`,
					},
					data: { documentId: newDoc.id, type: "new_document" },
				},
			}).catch((err) =>
				console.error("Failed to send creation notification:", err),
			);

			return c.json(newDoc, 201);
		} catch (dbError) {
			console.error("Database insert error:", dbError);
			// Attempt to delete the uploaded file if db insert fails
			await c.env.supabase.storage.from("documents").remove([newFilePath]);
			throw new HTTPException(500, {
				message: "Failed to save document record after file upload",
			});
		}
	},
);

// PUT: Update an existing document for a legal entity
documentsFlutterRouter.put(
	"/update/:id",
	describeRoute({
		description: "Update an existing document for a legal entity",
		tags: ["Documents Flutter"],
		parameters: [
			{
				name: "id",
				in: "path",
				required: true,
				schema: { type: "string", format: "uuid" },
				description: "UUID of the document to update",
			},
			{
				name: "legalEntityId",
				in: "query",
				required: true,
				schema: { type: "string", format: "uuid" },
				description: "UUID of the legal entity",
			},
		],
		responses: {
			200: {
				description: "Document updated successfully",
				content: {
					"application/json": {},
				},
			},
			400: {
				description:
					"Invalid update data or missing/invalid legalEntityId query parameter",
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
		const legalEntityId = c.req.query("legalEntityId");
		const body = await c.req.json();

		if (!legalEntityId) {
			throw new HTTPException(400, {
				message: "Missing legalEntityId query parameter",
			});
		}

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
		let oldFilePathToDelete: string | null = null;

		// Handle file update
		if (body.file?.data && body.file.name) {
			if (doc.filePath) {
				oldFilePathToDelete = doc.filePath;
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
				console.error("Supabase update upload error:", uploadError);
				throw new HTTPException(500, {
					message: "Failed to upload new file to storage",
				});
			}
			updatedFilePath = newFilePath;
		}

		// Update the document record
		try {
			const updatedDocResult = await c.env.db
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

			if (!updatedDocResult.length) {
				throw new HTTPException(404, {
					message: "Document not found during update",
				});
			}

			// If update and file upload were successful, delete the old file
			if (oldFilePathToDelete) {
				const { error: removeError } = await c.env.supabase.storage
					.from("documents")
					.remove([oldFilePathToDelete]);
				if (removeError) {
					console.error("Failed to delete old file from storage:", removeError);
				}
			}

			return c.json(updatedDocResult[0]);
		} catch (dbError) {
			console.error("Database update error:", dbError);
			// If DB update fails after a new file was uploaded, try to delete the new file
			if (updatedFilePath !== doc.filePath) {
				await c.env.supabase.storage
					.from("documents")
					.remove([updatedFilePath]);
			}
			if (dbError instanceof HTTPException) {
				throw dbError;
			}
			throw new HTTPException(500, {
				message: "Failed to update document record",
			});
		}
	},
);

// DELETE: Delete a specific document for a legal entity
documentsFlutterRouter.delete(
	"/delete/:id",
	describeRoute({
		description: "Delete a specific document for a legal entity",
		tags: ["Documents Flutter"],
		parameters: [
			{
				name: "id",
				in: "path",
				required: true,
				schema: { type: "string", format: "uuid" },
				description: "UUID of the document to delete",
			},
			{
				name: "legalEntityId",
				in: "query",
				required: true,
				schema: { type: "string", format: "uuid" },
				description: "UUID of the legal entity",
			},
		],
		responses: {
			204: { description: "Document deleted successfully" },
			400: { description: "Missing or invalid legalEntityId query parameter" },
			404: { description: "Document not found" },
			500: { description: "Internal server error" },
		},
	}),
	async (c) => {
		const id = c.req.param("id");
		const legalEntityId = c.req.query("legalEntityId");

		if (!legalEntityId) {
			throw new HTTPException(400, {
				message: "Missing legalEntityId query parameter",
			});
		}

		// 1. Find the document to get the file path
		const doc = await c.env.db.query.documentsFlutter.findFirst({
			where: and(
				eq(documentsFlutter.id, id),
				eq(documentsFlutter.legalEntityId, legalEntityId),
			),
			columns: {
				filePath: true,
			},
		});

		if (!doc) {
			throw new HTTPException(404, { message: "Document not found" });
		}

		// 2. Delete associated signatures (cascade might handle this, but explicit is safer)
		try {
			await c.env.db
				.delete(documentSignaturesFlutter)
				.where(eq(documentSignaturesFlutter.documentFlutterId, id));
		} catch (sigDeleteError) {
			console.error("Error deleting document signatures:", sigDeleteError);
			throw new HTTPException(500, {
				message: "Failed to delete associated signatures",
			});
		}

		// 3. Delete the document record from the database
		const deleteResult = await c.env.db
			.delete(documentsFlutter)
			.where(
				and(
					eq(documentsFlutter.id, id),
					eq(documentsFlutter.legalEntityId, legalEntityId),
				),
			);

		// Check if the document was actually deleted (rowCount might be available depending on driver)
		// Assuming delete doesn't throw error if row not found, but returns 0 affected rows

		// 4. Delete the file from storage *after* successful DB deletion
		if (doc.filePath) {
			const { error: storageError } = await c.env.supabase.storage
				.from("documents")
				.remove([doc.filePath]);
			if (storageError) {
				console.error(
					"Failed to delete file from storage after DB delete:",
					storageError,
				);
			}
		}

		return c.body(null, 204);
	},
);

// POST: Sign a document
documentsFlutterRouter.post(
	"/sign/:id",
	describeRoute({
		description:
			"Signs a document via NCALayer using the provided key, password, and signerId. The signature is then stored and returned.",
		tags: ["Documents Flutter", "Sign"],
		parameters: [
			{
				name: "id",
				in: "path",
				required: true,
				schema: { type: "string", format: "uuid" },
				description: "UUID of the document to sign",
			},
			{
				name: "legalEntityId",
				in: "query",
				required: true,
				schema: { type: "string", format: "uuid" },
				description: "UUID of the legal entity (owner of the document)",
			},
		],
		responses: {
			200: {
				description:
					"Document signed successfully. Returns the signature record.",
				content: { "application/json": {} },
			},
			400: {
				description:
					"Missing or invalid legalEntityId query parameter / Missing body parameters",
			},
			404: {
				description: "Document not found",
			},
			500: {
				description: "Internal server error or NCALayer error",
			},
		},
	}),
	async (c) => {
		const id = c.req.param("id");
		const legalEntityId = c.req.query("legalEntityId") as string | undefined;
		const body = await c.req.json();
		const { key, password, signerId } = body;

		if (!key || !password || !signerId || !legalEntityId) {
			throw new HTTPException(400, {
				message: "Missing key, password, or signerId in request body",
			});
		}

		// 1) Get Document Info (Including receiverBin)
		const docInfo = await c.env.db.query.documentsFlutter.findFirst({
			where: eq(documentsFlutter.id, id),
			columns: {
				filePath: true,
				receiverBin: true,
				legalEntityId: true,
				type: true,
			},
			with: {
				legalEntity: true,
			},
		});

		if (!docInfo || !docInfo.filePath || !docInfo.receiverBin) {
			throw new HTTPException(404, {
				message:
					"Document not found, file path missing, or receiver BIN missing",
			});
		}

		// 1.5) Check if this signer (by legalEntityId associated with signerId) has already signed
		// We'll use the legalEntityId passed in the body for the signature record itself
		const existingSignature =
			await c.env.db.query.documentSignaturesFlutter.findFirst({
				where: and(
					eq(documentSignaturesFlutter.documentFlutterId, id),
					eq(documentSignaturesFlutter.signerId, signerId),
				),
				columns: {
					id: true,
				},
			});

		if (existingSignature) {
			throw new HTTPException(409, {
				message: "This signer has already signed this document.",
			});
		}

		// 2) Download from the correct bucket & file path
		const { data: fileData, error: storageError } = await c.env.supabase.storage
			.from("documents")
			.download(docInfo.filePath);

		if (storageError || !fileData) {
			console.error("Supabase download error:", storageError);
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
					keyAlias: null,
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
				let errorData: { message?: string } = {};
				try {
					errorData = await response.json();
				} catch (parseError) {
					console.error("Failed to parse NCALayer error response:", parseError);
				}
				console.error("NCALayer signing error:", response.status, errorData);
				throw new Error(
					errorData?.message ||
						`NCALayer responded with status: ${response.status}`,
				);
			}

			const result = await response.json();

			if (!result.cms) {
				console.error("NCALayer response missing CMS data:", result);
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
					legalEntityId,
				})
				.returning();

			// Send notification to the receiver BIN that the document was signed
			sendNotificationToLegalEntityByBin(c, {
				receiverBin: docInfo.receiverBin,
				message: {
					notification: {
						title: "Документ подписан",
						body: `Документ ${docInfo.type || ""} подписан ${
							docInfo.legalEntity.name
						}`,
					},
					data: { documentId: id, type: "document_signed" },
				},
			}).catch((err) =>
				console.error("Failed to send signature notification:", err),
			);

			// 7) Return the new signature
			return c.json(signature);
		} catch (error) {
			console.error("Signing process error:", error);
			throw new HTTPException(500, {
				message:
					error instanceof Error ? error.message : "Failed to sign document",
			});
		}
	},
);

// GET: Document's signatures
documentsFlutterRouter.get(
	"/getSignatures/:id",
	describeRoute({
		description:
			"Retrieves all signatures for a given document (Flutter version) along with signer details.",
		tags: ["Documents Flutter", "Sign"],
		parameters: [
			{
				name: "id",
				in: "path",
				required: true,
				schema: { type: "string", format: "uuid" },
				description: "UUID of the document",
			},
			{
				name: "legalEntityId",
				in: "query",
				required: true,
				schema: { type: "string", format: "uuid" },
				description: "UUID of the legal entity (for verification)",
			},
			{
				name: "includeCms",
				in: "query",
				required: false,
				schema: { type: "boolean" },
				description: "Set to true to include the full CMS signature data.",
			},
		],
		responses: {
			200: {
				description: "List of document signatures",
				content: { "application/json": {} },
			},
			400: { description: "Missing or invalid legalEntityId query parameter" },
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
		const legalEntityId = c.req.query("legalEntityId");
		const includeCms = c.req.query("includeCms") === "true"; // Check for the query parameter

		if (!legalEntityId) {
			throw new HTTPException(400, {
				message: "Missing legalEntityId query parameter",
			});
		}

		// 1) Verify doc exists and belongs to the legal entity
		const doc = await c.env.db.query.documentsFlutter.findFirst({
			where: and(
				eq(documentsFlutter.id, id),
				eq(documentsFlutter.legalEntityId, legalEntityId),
			),
			columns: { id: true },
		});

		if (!doc) {
			throw new HTTPException(404, {
				message: "Document not found for the specified legal entity",
			});
		}

		// 2) Fetch all the flutter signatures referencing this doc
		const signatures = await c.env.db.query.documentSignaturesFlutter.findMany({
			where: eq(documentSignaturesFlutter.documentFlutterId, id),
			columns: {
				cms: includeCms,
			},
			with: {
				signer: true,
				legalEntity: true,
			},
			orderBy: [desc(documentSignaturesFlutter.signedAt)],
		});

		return c.json(signatures);
	},
);
