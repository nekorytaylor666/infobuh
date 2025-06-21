import { Hono } from "hono";
import type { HonoEnv } from "../env";
import {
	documentsFlutter,
	documentSignatures,
	documentSignaturesFlutter,
	documentFlutterReadStatus,
	documentFlutterPins,
	eq,
	and,
	desc,
	isNull,
	inArray,
	legalEntities,
	getTableColumns,
} from "@accounting-kz/db";
import { HTTPException } from "hono/http-exception";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { z } from "zod";
import "zod-openapi/extend";
import { sendNotificationToLegalEntityByBin } from "../services/notification";
import { DocumentGenerationService, type DocumentType } from "../lib/accounting-service/document-generation-service";
import {
	kazakhActInputSchema,
	kazakhDoverennostInputSchema,
	kazakhInvoiceInputSchema,
	kazakhWaybillInputSchema,
} from "@accounting-kz/document-templates";

export const documentsFlutterRouter = new Hono<HonoEnv>();

const NCALAYER_URL = "https://signer.infobuh.com";

// Utility function to extract storage path from public URL or return as-is if it's already a path
function extractStoragePath(filePathOrUrl: string): string {
	if (!filePathOrUrl) return filePathOrUrl;

	// If it's a full URL, extract the storage path
	if (filePathOrUrl.startsWith('http')) {
		try {
			const url = new URL(filePathOrUrl);
			// Extract path after '/storage/v1/object/public/documents/'
			const pathSegments = url.pathname.split('/');
			const documentsIndex = pathSegments.indexOf('documents');
			if (documentsIndex !== -1 && documentsIndex < pathSegments.length - 1) {
				return pathSegments.slice(documentsIndex + 1).join('/');
			}
		} catch (error) {
			console.warn('Failed to parse URL for storage path extraction:', error);
		}
	}

	// If it's already a storage path, return as-is
	return filePathOrUrl;
}

// Document types supported by the system
const documentTypes: [DocumentType, ...DocumentType[]] = ["АВР", "Доверенность", "Накладная", "Инвойс", "КП", "Счет на оплату"];

// Discriminated union schema for different document types with their specific data schemas
const documentPayloadSchema = z.discriminatedUnion("documentType", [
	z.object({
		documentType: z.literal("АВР"),
		data: kazakhActInputSchema
	}).openapi({
		description: "Act document (АВР) with Kazakh act-specific data",
		example: {
			documentType: "АВР",
			data: {
				orgName: "ТОО Example Company",
				orgAddress: "г. Алматы, ул. Абая 150",
				orgBin: "123456789012",
				buyerName: "ТОО Buyer Company",
				buyerBin: "987654321098",
				contractNumber: "CNT-001",
				orgPersonRole: "Директор",
				buyerPersonRole: "Генеральный директор",
				items: [
					{
						name: "Консультационные услуги",
						quantity: 1,
						unit: "шт",
						price: 150000,
					},
				],
				actNumber: "ACT-001",
				actDate: "2024-01-15"
			}
		}
	}),
	z.object({
		documentType: z.literal("Накладная"),
		data: kazakhWaybillInputSchema
	}).openapi({
		description: "Waybill document (Накладная) with Kazakh waybill-specific data",
		example: {
			documentType: "Накладная",
			data: {
				orgName: "ТОО Example Company",
				orgBin: "123456789012",
				buyerName: "ТОО Buyer Company",
				buyerBin: "987654321098",
				items: [
					{
						name: "Канцелярские товары",
						quantity: 10,
						unit: "шт",
						price: 25000,
					},
				],
				waybillNumber: "WB-001",
				waybillDate: "2024-01-15"
			}
		}
	}),
	z.object({
		documentType: z.literal("Счет на оплату"),
		data: kazakhInvoiceInputSchema
	}).openapi({
		description: "Invoice document (Счет на оплату) with Kazakh invoice-specific data",
		example: {
			documentType: "Счет на оплату",
			data: {
				orgName: "ТОО Example Company",
				orgBin: "123456789012",
				buyerName: "ТОО Buyer Company",
				buyerBin: "987654321098",
				contract: "Договор CNT-001 от 10.01.2024",
				items: [
					{
						name: "Товары",
						quantity: 1,
						unit: "шт",
						price: 300000,
					},
				],
				invoiceNumber: "INV-001",
				invoiceDate: "2024-01-15"
			}
		}
	}),
	z.object({
		documentType: z.literal("Инвойс"),
		data: kazakhInvoiceInputSchema
	}).openapi({
		description: "Invoice document (Инвойс) with Kazakh invoice-specific data",
		example: {
			documentType: "Инвойс",
			data: {
				orgName: "ТОО Example Company",
				orgBin: "123456789012",
				buyerName: "ТОО Buyer Company",
				buyerBin: "987654321098",
				contract: "Договор CNT-002 от 10.01.2024",
				items: [
					{
						name: "Услуги",
						quantity: 1,
						unit: "шт",
						price: 400000,
					},
				],
				invoiceNumber: "INV-002",
				invoiceDate: "2024-01-15"
			}
		}
	}),
	z.object({
		documentType: z.literal("Доверенность"),
		data: kazakhDoverennostInputSchema
	}).openapi({
		description: "Power of attorney document (Доверенность) with Kazakh doverennost-specific data",
		example: {
			documentType: "Доверенность",
			data: {
				orgName: "ТОО Example Company",
				orgBin: "123456789012",
				buyerName: "ТОО Buyer Company",
				buyerBin: "987654321098",
				schetNaOplatu: "Счет № INV-001 от 15.01.2024",
				employeeName: "Иванов Иван Иванович",
				employeeRole: "Менеджер",
				employeeDocNumber: "123456789",
				employeeDocNumberDate: "2024-01-01",
				employeeWhoGives: "МВД РК",
				dateUntil: "2024-12-31",
				items: [
					{
						name: "Товары по доверенности",
						quantity: 1,
						unit: "шт",
						price: 100000,
					},
				],
				idx: "DOV-001",
				issueDate: "2024-01-15"
			}
		}
	}),
]);

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
		const profileId = c.get("userId");

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
				readStatuses: {
					where: eq(documentFlutterReadStatus.profileId, profileId),
					limit: 1,
				},
				pins: {
					where: eq(documentFlutterPins.profileId, profileId),
					limit: 1,
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
		const profileId = c.get("userId");

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
				readStatuses: {
					where: eq(documentFlutterReadStatus.profileId, profileId),
					limit: 1,
				},
				pins: {
					where: eq(documentFlutterPins.profileId, profileId),
					limit: 1,
				},
			},
		});

		// Infer the type based on the query structure
		type DocumentListWithSignatures = (typeof documentsList)[number];

		const documentsListWithStatusAndReadStatusAndPins = documentsList.map(
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
					isRead: doc.readStatuses.length > 0,
					isPinned: doc.pins.length > 0,
				};
			},
		);

		return c.json(documentsListWithStatusAndReadStatusAndPins);
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
			{
				name: "includeCms",
				in: "query",
				required: false,
				schema: { type: "boolean" },
				description: "Include CMS in the response",
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
		const profileId = c.get("userId");
		const includeCms = c.req.query("includeCms");

		const includeCmsBoolean = includeCms === "true";
		if (!legalEntityId) {
			throw new HTTPException(400, {
				message: "Missing legalEntityId query parameter",
			});
		}
		const columns = Object.fromEntries(
			Object.entries(getTableColumns(documentSignaturesFlutter)).map(
				([key, value]) => [key, true],
			),
		);

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
					columns: {
						...columns,
						cms: includeCmsBoolean,
					},
				},
				readStatuses: {
					where: eq(documentFlutterReadStatus.profileId, profileId),
					limit: 1,
				},
				pins: {
					where: eq(documentFlutterPins.profileId, profileId),
					limit: 1,
				},
			},
		});
		console.log(doc);

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
		return c.json({
			...doc,
			status,
			isRead: doc.readStatuses.length > 0,
			isPinned: doc.pins.length > 0,
		});
	},
);

// Legacy file-based document creation schema (for backwards compatibility)
const legacyFileSchema = z.object({
	name: z.string().min(1, "File name is required"),
	data: z.string().min(1, "File data (base64) is required"),
	contentType: z.string().optional().default("application/octet-stream"),
}).openapi({
	description: "Legacy file information for manual upload",
	example: {
		name: "invoice.pdf",
		data: "JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PA==",
		contentType: "application/pdf"
	}
});

// Create document schema with discriminated union for document generation or legacy file upload
const createDocumentSchema = z.object({
	receiverBin: z.string().length(12, "Receiver BIN must be 12 characters"),
	receiverName: z.string().min(1, "Receiver name is required"),
	// Either use document generation with typed data, or upload a file manually
	documentPayload: documentPayloadSchema.optional(),
	// Legacy file upload (will be deprecated in favor of document generation)
	legacyFile: legacyFileSchema.optional(),
}).refine(
	(data) => data.documentPayload || data.legacyFile,
	{
		message: "Either documentPayload (for auto-generation) or legacyFile (for manual upload) must be provided",
		path: ["documentPayload"]
	}
).openapi({
	description: "Schema for creating a new document with automatic generation or manual file upload",
	example: {
		receiverBin: "987654321098",
		receiverName: "ТОО Buyer Company",
		documentPayload: {
			documentType: "АВР",
			data: {
				orgName: "ТОО Example Company",
				orgAddress: "г. Алматы, ул. Абая 150",
				orgBin: "123456789012",
				buyerName: "ТОО Buyer Company",
				buyerBin: "987654321098",
				contractNumber: "CNT-001",
				orgPersonRole: "Директор",
				buyerPersonRole: "Генеральный директор",
				items: [
					{
						name: "Консультационные услуги",
						quantity: 1,
						unit: "шт",
						price: 150000,
					},
				],
				actNumber: "ACT-001",
				actDate: "2024-01-15"
			}
		}
	}
});

// Response schema for created document
const createdDocumentResponseSchema = z.object({
	id: z.string().uuid(),
	legalEntityId: z.string().uuid(),
	type: z.string(),
	receiverBin: z.string(),
	receiverName: z.string(),
	fields: z.record(z.any()),
	filePath: z.string(),
	fileName: z.string().optional(),
	createdAt: z.string(),
	updatedAt: z.string(),
	documentGenerated: z.boolean().describe("Whether the document was auto-generated or manually uploaded"),
	publicUrl: z.string().optional().describe("Public URL for accessing the document"),
	storagePath: z.string().optional().describe("Storage path in Supabase"),
}).openapi({
	description: "Response schema for created document",
	example: {
		id: "550e8400-e29b-41d4-a716-446655440000",
		legalEntityId: "550e8400-e29b-41d4-a716-446655440001",
		type: "АВР",
		receiverBin: "987654321098",
		receiverName: "ТОО Buyer Company",
		fields: {
			orgName: "ТОО Example Company",
			orgAddress: "г. Алматы, ул. Абая 150",
			orgBin: "123456789012",
			buyerName: "ТОО Buyer Company",
			buyerBin: "987654321098",
			contractNumber: "CNT-001",
			orgPersonRole: "Директор",
			buyerPersonRole: "Генеральный директор",
			items: [
				{
					name: "Консультационные услуги",
					quantity: 1,
					unit: "шт",
					price: 150000,
				},
			],
			actNumber: "ACT-001",
			actDate: "2024-01-15"
		},
		filePath: "https://supabase.co/storage/documents/550e8400-e29b-41d4-a716-446655440001/avr/1642234567890-act.pdf",
		fileName: "1642234567890-act.pdf",
		createdAt: "2024-01-15T10:30:00Z",
		updatedAt: "2024-01-15T10:30:00Z",
		documentGenerated: true,
		publicUrl: "https://supabase.co/storage/documents/550e8400-e29b-41d4-a716-446655440001/avr/1642234567890-act.pdf",
		storagePath: "550e8400-e29b-41d4-a716-446655440001/avr/1642234567890-act.pdf"
	}
});

// POST: Create a new document for a legal entity
documentsFlutterRouter.post(
	"/create",
	describeRoute({
		description: "Create a new document for a legal entity with automatic document generation or manual file upload",
		tags: ["Documents Flutter"],
		parameters: [
			{
				name: "legalEntityId",
				in: "query",
				required: true,
				schema: { type: "string", format: "uuid" },
				description: "UUID of the legal entity that owns the document",
			},
		],
		request: {
			body: {
				content: {
					"application/json": {
						schema: createDocumentSchema,
					},
				},
			},
		},
		responses: {
			201: {
				description: "Document created successfully",
				content: {
					"application/json": {
						schema: createdDocumentResponseSchema,
					},
				},
			},
			400: {
				description: "Validation error or missing required parameters",
				content: {
					"application/json": {
						schema: z.object({
							message: z.string(),
							errors: z.array(z.object({
								path: z.array(z.string()),
								message: z.string(),
							})).optional(),
							error: z.string().optional(),
						}).openapi({
							example: {
								message: "Validation failed",
								errors: [
									{
										path: ["documentPayload", "data", "orgBin"],
										message: "Organization BIN must be 12 characters"
									}
								]
							}
						}),
					},
				},
			},
			404: {
				description: "Legal entity not found",
			},
			500: {
				description: "Internal server error - file upload or database error",
			},
		},
	}),
	zValidator("json", createDocumentSchema),
	async (c) => {
		try {
			const legalEntityId = c.req.query("legalEntityId");
			const { receiverBin, receiverName, documentPayload, legacyFile } = c.req.valid("json");

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

			let filePath: string;
			let fileName: string;
			let documentType: string;
			let fields: any;
			let documentGenerated = false;
			let publicUrl: string | undefined;
			let storagePath: string | undefined;

			// Handle document generation or legacy file upload
			if (documentPayload) {
				// Auto-generate document using DocumentGenerationService
				const documentGenerationService = new DocumentGenerationService();
				const generationResult = await documentGenerationService.generateDocument(
					documentPayload.documentType,
					documentPayload.data,
					legalEntityId
				);

				if (!generationResult.success) {
					console.error("Document generation failed:", generationResult.error);
					throw new HTTPException(500, {
						message: `Failed to generate document: ${generationResult.error.message}`,
					});
				}

				filePath = generationResult.publicUrl; // Use public URL for database
				fileName = generationResult.fileName;
				documentType = documentPayload.documentType;
				fields = documentPayload.data;
				documentGenerated = true;
				publicUrl = generationResult.publicUrl;
				storagePath = generationResult.storagePath;
			} else if (legacyFile) {
				// Legacy file upload approach
				fileName = legacyFile.name;
				const newFilePath = `${legalEntityId}/${Date.now()}-${fileName}`;

				// Convert the base64 encoded file data to a buffer
				const fileBuffer = Buffer.from(legacyFile.data, "base64");

				// Upload file to Supabase Storage (bucket "documents")
				const { error: uploadError } = await c.env.supabase.storage
					.from("documents")
					.upload(newFilePath, fileBuffer, {
						contentType: legacyFile.contentType || "application/octet-stream",
					});
				if (uploadError) {
					console.error("Supabase upload error:", uploadError);
					throw new HTTPException(500, {
						message: "Failed to upload file to storage",
					});
				}

				// Get public URL for legacy file
				const { data: publicUrlData } = c.env.supabase.storage
					.from("documents")
					.getPublicUrl(newFilePath);
				publicUrl = publicUrlData?.publicUrl;
				storagePath = newFilePath;

				filePath = publicUrl || newFilePath; // Use public URL for database, fallback to storage path
				documentType = "manual"; // Generic type for manual uploads
				fields = { fileName: legacyFile.name }; // Basic fields for manual upload
				documentGenerated = false;
			} else {
				throw new HTTPException(400, {
					message: "Either documentPayload or legacyFile must be provided",
				});
			}

			// Insert the document record with the uploaded file path
			try {
				const [newDoc] = await c.env.db
					.insert(documentsFlutter)
					.values({
						legalEntityId,
						type: documentType,
						receiverBin,
						receiverName,
						fields,
						filePath,
					})
					.returning();

				// Send notification to the receiver BIN
				sendNotificationToLegalEntityByBin(c, {
					receiverBin: newDoc.receiverBin,
					message: {
						notification: {
							title: "Получен новый документ",
							body: `${newDoc.type} от ${legalEntity.name}`,
						},
						data: { documentId: newDoc.id, type: "new_document" },
					},
				}).catch((err) =>
					console.error("Failed to send creation notification:", err),
				);

				// Return enhanced response with generation info
				const response = {
					...newDoc,
					fileName, // Include fileName even though not stored in DB
					documentGenerated,
					publicUrl,
					storagePath,
				};

				return c.json(response, 201);
			} catch (dbError) {
				console.error("Database insert error:", dbError);
				// Attempt to delete the uploaded file if db insert fails
				if (storagePath) {
					await c.env.supabase.storage.from("documents").remove([storagePath]);
				}

				if (dbError instanceof z.ZodError) {
					throw new HTTPException(400, {
						message: `Validation failed: ${dbError.errors.map(e => e.message).join(', ')}`,
					});
				}

				throw new HTTPException(500, {
					message: "Failed to save document record after file upload",
				});
			}
		} catch (error) {
			console.error("Error creating document:", error);

			if (error instanceof z.ZodError) {
				return c.json(
					{
						message: "Validation failed",
						errors: error.errors
					},
					400
				);
			}

			if (error instanceof HTTPException) {
				throw error;
			}

			throw new HTTPException(500, {
				message: "Failed to create document",
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

			// Get public URL for the new file
			const { data: publicUrlData } = c.env.supabase.storage
				.from("documents")
				.getPublicUrl(newFilePath);
			updatedFilePath = publicUrlData?.publicUrl || newFilePath; // Use public URL, fallback to storage path
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
				const oldStoragePath = extractStoragePath(oldFilePathToDelete);
				const { error: removeError } = await c.env.supabase.storage
					.from("documents")
					.remove([oldStoragePath]);
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
			const storagePath = extractStoragePath(doc.filePath);
			const { error: storageError } = await c.env.supabase.storage
				.from("documents")
				.remove([storagePath]);
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
		// Extract storage path from full URL if needed
		const storagePath = extractStoragePath(docInfo.filePath);
		const { data: fileData, error: storageError } = await c.env.supabase.storage
			.from("documents")
			.download(storagePath);

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

			const ncaLayerResult = await response.json();

			if (!ncaLayerResult.cms) {
				console.error("NCALayer response missing CMS data:", ncaLayerResult);
				throw new Error("No CMS data received from NCALayer");
			}

			// 5.5) Send CMS to Verifier Service
			const verifierResponse = await fetch(`${NCALAYER_URL}/cms/verify`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ cms: ncaLayerResult.cms }),
			});
			console.log("verifierResponse", verifierResponse);

			if (!verifierResponse.ok) {
				let verifierErrorData: { message?: string } = {};
				try {
					verifierErrorData = await verifierResponse.json();
				} catch (parseError) {
					console.error("Failed to parse verifier error response:", parseError);
				}
				console.error(
					"Verifier service error:",
					verifierResponse.status,
					verifierErrorData,
				);
				throw new Error(
					verifierErrorData?.message ||
					`Verifier service responded with status: ${verifierResponse.status}`,
				);
			}

			const verifierResult = await verifierResponse.json();
			const signerInfo = verifierResult.signers?.[0]?.certificates?.[0];
			const tspInfo = verifierResult.signers?.[0]?.tsp;

			// 6) Insert signature record into your new table:
			const [signature] = await c.env.db
				.insert(documentSignaturesFlutter)
				.values({
					documentFlutterId: id,
					signerId,
					cms: ncaLayerResult.cms,
					signedAt: new Date(),
					legalEntityId,
					// Populate from verifierResult
					isValid: verifierResult.valid,
					notBefore: signerInfo?.notBefore
						? new Date(signerInfo.notBefore)
						: null,
					notAfter: signerInfo?.notAfter ? new Date(signerInfo.notAfter) : null,
					keyUsage: signerInfo?.keyUsage,
					serialNumber: signerInfo?.serialNumber,
					signAlg: signerInfo?.signAlg,
					signature: signerInfo?.signature,
					subjectCommonName: signerInfo?.subject?.commonName,
					subjectLastName: signerInfo?.subject?.lastName,
					subjectSurName: signerInfo?.subject?.surName,
					subjectEmail: signerInfo?.subject?.email,
					subjectOrganization: signerInfo?.subject?.organization,
					subjectIin: signerInfo?.subject?.iin,
					subjectBin: signerInfo?.subject?.bin,
					subjectCountry: signerInfo?.subject?.country,
					subjectLocality: signerInfo?.subject?.locality,
					subjectState: signerInfo?.subject?.state,
					issuerCommonName: signerInfo?.issuer?.commonName,
					issuerOrganization: signerInfo?.issuer?.organization,
					issuerIin: signerInfo?.issuer?.iin,
					issuerBin: signerInfo?.issuer?.bin,
					tspSerialNumber: tspInfo?.serialNumber,
					tspGenTime: tspInfo?.genTime ? new Date(tspInfo.genTime) : null,
					tspPolicy: tspInfo?.policy,
					tspHashAlgorithm: tspInfo?.tspHashAlgorithm,
					tspHash: tspInfo?.hash,
				})
				.returning();

			// Send notification to the receiver BIN that the document was signed
			sendNotificationToLegalEntityByBin(c, {
				receiverBin: docInfo.receiverBin,
				message: {
					notification: {
						title: "Документ подписан",
						body: `Документ ${docInfo.type || ""} подписан ${docInfo.legalEntity.name
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

// POST: Mark a document as read
documentsFlutterRouter.post(
	"/markAsRead/:id",
	describeRoute({
		description: "Marks a document as read for the current user.",
		tags: ["Documents Flutter"],
		parameters: [
			{
				name: "id",
				in: "path",
				required: true,
				schema: { type: "string", format: "uuid" },
				description: "UUID of the document to mark as read",
			},
		],
		responses: {
			201: {
				description: "Read status created successfully.",
				content: { "application/json": {} },
			},
			401: { description: "Unauthorized (User not logged in)" },
			404: { description: "Document not found" },
			409: { description: "Document already marked as read by this user" },
			500: { description: "Internal server error" },
		},
	}),
	async (c) => {
		const documentFlutterId = c.req.param("id");
		const profileId = c.get("userId"); // Assume profileId is available from auth middleware

		if (!profileId) {
			throw new HTTPException(401, { message: "User must be logged in" });
		}

		// Optional: Check if the document exists and the user has access (depends on your access rules)
		const docExists = await c.env.db.query.documentsFlutter.findFirst({
			where: eq(documentsFlutter.id, documentFlutterId),
			columns: { id: true },
		});
		if (!docExists) {
			throw new HTTPException(404, { message: "Document not found" });
		}

		try {
			const [readStatus] = await c.env.db
				.insert(documentFlutterReadStatus)
				.values({
					profileId,
					documentFlutterId,
				})
				.onConflictDoNothing() // Prevent error if already marked as read
				.returning();

			// If onConflictDoNothing resulted in no insert, it means it was already read
			if (!readStatus) {
				// Fetch the existing status to return it, or just return 200 OK
				const existing =
					await c.env.db.query.documentFlutterReadStatus.findFirst({
						where: and(
							eq(documentFlutterReadStatus.profileId, profileId),
							eq(
								documentFlutterReadStatus.documentFlutterId,
								documentFlutterId,
							),
						),
					});
				return c.json(existing, 200);
				// Or throw 409: throw new HTTPException(409, { message: 'Already marked as read' });
			}

			return c.json(readStatus, 201);
		} catch (error) {
			console.error("Error marking document as read:", error);
			throw new HTTPException(500, {
				message: "Failed to mark document as read",
			});
		}
	},
);

// POST: Pin a document
documentsFlutterRouter.post(
	"/pin/:id",
	describeRoute({
		description: "Pins a document for the current user.",
		tags: ["Documents Flutter"],
		parameters: [
			{
				name: "id",
				in: "path",
				required: true,
				schema: { type: "string", format: "uuid" },
				description: "UUID of the document to pin",
			},
		],
		responses: {
			201: {
				description: "Document pinned successfully.",
				content: { "application/json": {} },
			},
			401: { description: "Unauthorized (User not logged in)" },
			404: { description: "Document not found" },
			409: { description: "Document already pinned by this user" },
			500: { description: "Internal server error" },
		},
	}),
	async (c) => {
		const documentFlutterId = c.req.param("id");
		const profileId = c.get("userId"); // Assume profileId is available from auth middleware

		if (!profileId) {
			throw new HTTPException(401, { message: "User must be logged in" });
		}

		// Optional: Check if the document exists
		const docExists = await c.env.db.query.documentsFlutter.findFirst({
			where: eq(documentsFlutter.id, documentFlutterId),
			columns: { id: true },
		});
		if (!docExists) {
			throw new HTTPException(404, { message: "Document not found" });
		}

		try {
			const [pin] = await c.env.db
				.insert(documentFlutterPins)
				.values({ profileId, documentFlutterId })
				.onConflictDoNothing()
				.returning();

			if (!pin) {
				const existing = await c.env.db.query.documentFlutterPins.findFirst({
					where: and(
						eq(documentFlutterPins.profileId, profileId),
						eq(documentFlutterPins.documentFlutterId, documentFlutterId),
					),
				});
				return c.json(existing, 200);
				// Or throw 409: throw new HTTPException(409, { message: 'Already pinned' });
			}

			return c.json(pin, 201);
		} catch (error) {
			console.error("Error pinning document:", error);
			throw new HTTPException(500, { message: "Failed to pin document" });
		}
	},
);

// DELETE: Unpin a document
documentsFlutterRouter.delete(
	"/unpin/:id",
	describeRoute({
		description: "Unpins a document for the current user.",
		tags: ["Documents Flutter"],
		parameters: [
			{
				name: "id",
				in: "path",
				required: true,
				schema: { type: "string", format: "uuid" },
				description: "UUID of the document to unpin",
			},
		],
		responses: {
			204: { description: "Document unpinned successfully" },
			401: { description: "Unauthorized (User not logged in)" },
			404: { description: "Pin record not found" },
			500: { description: "Internal server error" },
		},
	}),
	async (c) => {
		const documentFlutterId = c.req.param("id");
		const profileId = c.get("userId"); // Assume profileId is available from auth middleware

		if (!profileId) {
			throw new HTTPException(401, { message: "User must be logged in" });
		}

		try {
			const deleteResult = await c.env.db
				.delete(documentFlutterPins)
				.where(
					and(
						eq(documentFlutterPins.profileId, profileId),
						eq(documentFlutterPins.documentFlutterId, documentFlutterId),
					),
				);

			// Check if a row was actually deleted (this might depend on the DB driver)
			// if (deleteResult.rowCount === 0) { // Example check
			// 	throw new HTTPException(404, { message: "Pin record not found" });
			// }

			return c.body(null, 204);
		} catch (error) {
			console.error("Error unpinning document:", error);
			if (error instanceof HTTPException) {
				throw error;
			}
			throw new HTTPException(500, { message: "Failed to unpin document" });
		}
	},
);
