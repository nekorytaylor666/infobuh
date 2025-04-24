import { Hono } from "hono";
import type { HonoEnv } from "../env";
import {
	contracts,
	eq,
	and,
	desc,
	profile,
	contractSignatures,
} from "@accounting-kz/db";
import { HTTPException } from "hono/http-exception";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

// Assuming NCALayer runs on the same URL as for documents_flutter
const NCALAYER_URL = "https://signer.infobuh.com/";

export const contractsRouter = new Hono<HonoEnv>();

// Function to calculate signature status (can be reused)
const calculateStatus = (signatures: unknown[]) => {
	let status = "unsigned";
	if (signatures.length === 1) {
		status = "signedOne";
	}
	if (signatures.length >= 2) {
		status = "signedBoth";
	}
	return status;
};

// --- NEW: GET /listByReceiver ---
contractsRouter.get(
	"/listByReceiver",
	describeRoute({
		description: "Get all contracts where the receiverBin matches",
		tags: ["Contracts"],
		parameters: [
			{
				name: "receiverBin",
				in: "query",
				required: true,
				schema: { type: "string" },
				description: "BIN of the receiver to filter contracts by",
			},
		],
		responses: {
			200: {
				description: "List of contracts for that BIN",
				content: { "application/json": {} },
			},
			400: { description: "Missing receiverBin query parameter" },
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

		const contractList = await c.env.db.query.contracts.findMany({
			where: eq(contracts.receiverBin, receiverBin),
			orderBy: [desc(contracts.createdAt)],
			with: {
				signatures: {
					columns: {
						cms: false, // Don't need full CMS data for list view
					},
					with: {
						signer: true,
					},
				},
			},
		});

		const contractsWithStatus = contractList.map((contract) => ({
			...contract,
			status: calculateStatus(contract.signatures),
		}));

		return c.json(contractsWithStatus);
	},
);

// --- MODIFIED: GET /:legalEntityId ---
contractsRouter.get(
	"/:legalEntityId",
	describeRoute({
		description:
			"Get all contracts for a legal entity, including signature status",
		tags: ["Contracts"],
		parameters: [
			{
				name: "legalEntityId",
				in: "path",
				required: true,
				schema: { type: "string", format: "uuid" },
				description: "UUID of the legal entity",
			},
		],
		responses: {
			200: {
				description: "List of contracts with status",
				content: { "application/json": {} },
			},
			500: { description: "Internal server error" },
		},
	}),
	async (c) => {
		const legalEntityId = c.req.param("legalEntityId");

		const contractList = await c.env.db.query.contracts.findMany({
			where: eq(contracts.legalEntityId, legalEntityId),
			orderBy: [desc(contracts.createdAt)],
			// Include signatures to calculate status
			with: {
				signatures: {
					columns: {
						id: true, // Need at least one column to count
					},
				},
			},
		});

		// Calculate status for each contract
		const contractsWithStatus = contractList.map((contract) => ({
			...contract,
			status: calculateStatus(contract.signatures),
		}));

		return c.json(contractsWithStatus);
	},
);

// --- MODIFIED: GET /:legalEntityId/:id ---
contractsRouter.get(
	"/:legalEntityId/:id",
	describeRoute({
		description:
			"Get a specific contract for a legal entity, including signature status",
		tags: ["Contracts"],
		parameters: [
			{
				name: "legalEntityId",
				in: "path",
				required: true,
				schema: { type: "string", format: "uuid" },
			},
			{
				name: "id",
				in: "path",
				required: true,
				schema: { type: "string", format: "uuid" },
			},
		],
		responses: {
			200: {
				description: "Contract retrieved successfully",
				content: { "application/json": {} },
			},
			404: { description: "Contract not found" },
			500: { description: "Internal server error" },
		},
	}),
	async (c) => {
		const legalEntityId = c.req.param("legalEntityId");
		const id = c.req.param("id");

		const contract = await c.env.db.query.contracts.findFirst({
			where: and(
				eq(contracts.id, id),
				eq(contracts.legalEntityId, legalEntityId),
			),
			// Include signatures to calculate status
			with: {
				signatures: {
					columns: {
						id: true, // Need at least one column to count
					},
				},
			},
		});

		if (!contract) {
			throw new HTTPException(404, { message: "Contract not found" });
		}

		// Calculate status
		const status = calculateStatus(contract.signatures);

		return c.json({ ...contract, status });
	},
);

// --- MODIFIED: POST /:legalEntityId ---
contractsRouter.post(
	"/:legalEntityId",
	describeRoute({
		description: "Create a new contract for a legal entity",
		tags: ["Contracts"],
		parameters: [
			{
				name: "legalEntityId",
				in: "path",
				required: true,
				schema: { type: "string", format: "uuid" },
			},
		],
		// TODO: Update requestBody schema in OpenAPI spec
		responses: {
			200: {
				description: "Contract created successfully",
				content: { "application/json": {} },
			},
			400: { description: "Missing required fields" },
			500: { description: "Internal server error" },
		},
	}),
	async (c) => {
		const legalEntityId = c.req.param("legalEntityId");
		const body = await c.req.json();
		// Add receiverBin and receiverName
		const {
			number,
			date,
			partnerId,
			file,
			currency,
			receiverBin,
			receiverName,
		} = body;

		if (
			number === undefined ||
			number === null ||
			!date ||
			!partnerId ||
			!currency || // Added currency check
			!receiverBin || // Added receiverBin check
			!receiverName || // Added receiverName check
			!file ||
			!file.data ||
			!file.name
		) {
			throw new HTTPException(400, {
				message: "Missing required fields or file data",
			});
		}

		const fileName = file.name;
		const newFilePath = `${legalEntityId}/${Date.now()}-${fileName}`;
		const fileBuffer = Buffer.from(file.data, "base64");

		// Assume storage bucket is 'documents' for contracts too?
		// If it's a different bucket, change "documents" below.
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

		try {
			const newContract = await c.env.db
				.insert(contracts)
				.values({
					legalEntityId,
					number,
					date,
					partnerId,
					currency,
					receiverBin, // Save receiverBin
					receiverName, // Save receiverName
					filePath: newFilePath,
				})
				.returning();

			return c.json(newContract[0]);
		} catch (dbError) {
			console.error("Database insert error:", dbError);
			// Attempt to delete the uploaded file if db insert fails
			await c.env.supabase.storage.from("documents").remove([newFilePath]);
			throw new HTTPException(500, {
				message: "Failed to save contract record after file upload",
			});
		}
	},
);

// --- MODIFIED: PUT /:legalEntityId/:id ---
contractsRouter.put(
	"/:legalEntityId/:id",
	describeRoute({
		description: "Update an existing contract for a legal entity",
		tags: ["Contracts"],
		parameters: [
			{
				name: "legalEntityId",
				in: "path",
				required: true,
				schema: { type: "string", format: "uuid" },
			},
			{
				name: "id",
				in: "path",
				required: true,
				schema: { type: "string", format: "uuid" },
			},
		],
		// TODO: Update requestBody schema in OpenAPI spec
		responses: {
			200: {
				description: "Contract updated successfully",
				content: { "application/json": {} },
			},
			400: { description: "Invalid update request" },
			404: { description: "Contract not found" },
			500: { description: "Internal server error" },
		},
	}),
	async (c) => {
		const legalEntityId = c.req.param("legalEntityId");
		const id = c.req.param("id");
		const body = await c.req.json();

		const contract = await c.env.db.query.contracts.findFirst({
			where: and(
				eq(contracts.id, id),
				eq(contracts.legalEntityId, legalEntityId),
			),
		});

		if (!contract) {
			throw new HTTPException(404, { message: "Contract not found" });
		}

		let updatedFilePath = contract.filePath;
		let oldFilePathToDelete: string | null = null;

		if (body.file?.data && body.file.name) {
			if (contract.filePath) {
				oldFilePathToDelete = contract.filePath;
			}

			const fileName = body.file.name;
			const newFilePath = `${legalEntityId}/${Date.now()}-${fileName}`;
			const fileBuffer = Buffer.from(body.file.data, "base64");

			const { error: uploadError } = await c.env.supabase.storage
				.from("documents") // Assuming same bucket 'documents'
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

		try {
			const updatedContractResult = await c.env.db
				.update(contracts)
				.set({
					number: body.number ?? contract.number,
					date: body.date ?? contract.date,
					currency: body.currency ?? contract.currency,
					partnerId: body.partnerId ?? contract.partnerId,
					receiverBin: body.receiverBin ?? contract.receiverBin, // Update receiverBin
					receiverName: body.receiverName ?? contract.receiverName, // Update receiverName
					filePath: updatedFilePath,
					updatedAt: new Date(), // Update the timestamp
				})
				.where(
					and(eq(contracts.id, id), eq(contracts.legalEntityId, legalEntityId)),
				)
				.returning();

			if (!updatedContractResult.length) {
				// This case might happen if the WHERE clause didn't match, should be caught by findFirst above
				throw new HTTPException(404, {
					message: "Contract not found during update",
				});
			}

			// If update and file upload were successful, delete the old file
			if (oldFilePathToDelete) {
				const { error: removeError } = await c.env.supabase.storage
					.from("documents")
					.remove([oldFilePathToDelete]);
				if (removeError) {
					console.error("Failed to delete old file from storage:", removeError);
					// Log error but don't fail the request, update was successful
				}
			}

			return c.json(updatedContractResult[0]);
		} catch (dbError) {
			console.error("Database update error:", dbError);
			// If DB update fails after a new file was uploaded, try to delete the new file
			if (updatedFilePath !== contract.filePath && oldFilePathToDelete) {
				await c.env.supabase.storage
					.from("documents")
					.remove([updatedFilePath]);
			}
			if (dbError instanceof HTTPException) {
				throw dbError;
			}
			throw new HTTPException(500, {
				message: "Failed to update contract record",
			});
		}
	},
);

// --- NEW: POST /sign/:id ---
contractsRouter.post(
	"/sign/:id",
	describeRoute({
		description:
			"Signs a contract via NCALayer using the provided key, password, and signerId. The signature is then stored and returned.",
		tags: ["Contracts", "Sign"],
		parameters: [
			{
				name: "id",
				in: "path",
				required: true,
				schema: { type: "string", format: "uuid" },
				description: "UUID of the contract to sign",
			},
			// Note: legalEntityId is not strictly needed for signing itself,
			// but could be added for authorization checks if required.
		],
		requestBody: {
			content: {
				"application/json": {
					schema: {
						// Define expected body structure
						type: "object",
						properties: {
							key: { type: "string" },
							password: { type: "string" },
							signerId: { type: "string", format: "uuid" },
						},
						required: ["key", "password", "signerId"],
					},
				},
			},
		},
		responses: {
			201: {
				// Use 201 Created for new signature resource
				description:
					"Contract signed successfully. Returns the signature record.",
				content: { "application/json": {} },
			},
			400: { description: "Missing body parameters (key, password, signerId)" },
			404: { description: "Contract not found or file path missing" },
			409: { description: "This user has already signed this contract" },
			500: { description: "Internal server error or NCALayer error" },
		},
	}),
	async (c) => {
		const id = c.req.param("id");
		const body = await c.req.json();
		const { key, password, signerId } = body;

		if (!key || !password || !signerId) {
			throw new HTTPException(400, {
				message: "Missing key, password, or signerId in request body",
			});
		}

		// 1) Verify the contract exists and has a file path
		const contract = await c.env.db.query.contracts.findFirst({
			where: eq(contracts.id, id),
			columns: {
				filePath: true,
			},
		});

		if (!contract || !contract.filePath) {
			throw new HTTPException(404, {
				message: "Contract not found or file path missing",
			});
		}

		// 1.5) Check if this signer has already signed this contract
		const existingSignature = await c.env.db.query.contractSignatures.findFirst(
			{
				where: and(
					eq(contractSignatures.contractId, id),
					eq(contractSignatures.signerId, signerId),
				),
				columns: {
					id: true, // Only need to check for existence
				},
			},
		);

		if (existingSignature) {
			throw new HTTPException(409, {
				// 409 Conflict
				message: "This user has already signed this contract.",
			});
		}

		// 2) Download the contract file from storage
		const { data: fileData, error: storageError } = await c.env.supabase.storage
			.from("documents") // Assuming same bucket 'documents'
			.download(contract.filePath);

		if (storageError || !fileData) {
			console.error("Supabase download error:", storageError);
			throw new HTTPException(500, {
				message: "Failed to get contract file from storage",
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

			// 6) Insert signature record into the new table:
			const [signature] = await c.env.db
				.insert(contractSignatures)
				.values({
					contractId: id,
					signerId,
					cms: result.cms,
					signedAt: new Date(),
				})
				.returning();

			// 7) Return the new signature
			return c.json(signature, 201);
		} catch (error) {
			console.error("Signing process error:", error);
			throw new HTTPException(500, {
				message:
					error instanceof Error ? error.message : "Failed to sign contract",
			});
		}
	},
);

// --- NEW: GET /getSignatures/:id ---
contractsRouter.get(
	"/getSignatures/:id",
	describeRoute({
		description:
			"Retrieves all signatures for a given contract along with signer details.",
		tags: ["Contracts", "Sign"],
		parameters: [
			{
				name: "id",
				in: "path",
				required: true,
				schema: { type: "string", format: "uuid" },
				description: "UUID of the contract",
			},
			// Note: legalEntityId could be added as a query param for verification
			// if needed, similar to documents_flutter getSignatures
		],
		responses: {
			200: {
				description: "List of contract signatures",
				content: { "application/json": {} },
			},
			404: { description: "Contract not found" }, // If verification is added
			500: { description: "Internal server error" },
		},
	}),
	async (c) => {
		const id = c.req.param("id");

		// Optional: Verify contract exists before fetching signatures
		// const contractExists = await c.env.db.query.contracts.findFirst({...
		// if (!contractExists) { throw new HTTPException(404, ...); }

		// Fetch all signatures for this contract, joining with signer profile
		const signatures = await c.env.db.query.contractSignatures.findMany({
			where: eq(contractSignatures.contractId, id),
			with: {
				signer: true, // Include details from the profile table
			},
			orderBy: [desc(contractSignatures.signedAt)],
		});

		return c.json(signatures);
	},
);

// Delete endpoint might need updating if cascade delete isn't guaranteed
// for contractSignatures when a contract is deleted.
// The current schema has onDelete: 'cascade' for contractId reference,
// so explicit deletion of signatures might not be needed here.

// Placeholder for DELETE endpoint - Review if changes are needed
contractsRouter.delete(
	"/:legalEntityId/:id",
	describeRoute({
		description: "Delete a specific contract for a legal entity",
		tags: ["Contracts"],
		parameters: [
			{
				name: "legalEntityId",
				in: "path",
				required: true,
				schema: { type: "string", format: "uuid" },
			},
			{
				name: "id",
				in: "path",
				required: true,
				schema: { type: "string", format: "uuid" },
			},
		],
		responses: {
			204: { description: "Contract deleted successfully" },
			404: { description: "Contract not found" },
			500: { description: "Internal server error" },
		},
	}),
	async (c) => {
		const legalEntityId = c.req.param("legalEntityId");
		const id = c.req.param("id");

		// 1. Find the contract to get the file path
		const contract = await c.env.db.query.contracts.findFirst({
			where: and(
				eq(contracts.id, id),
				eq(contracts.legalEntityId, legalEntityId),
			),
			columns: {
				filePath: true,
			},
		});

		if (!contract) {
			throw new HTTPException(404, { message: "Contract not found" });
		}

		// 2. Delete the contract record from the database
		// associated signatures should be deleted by cascade
		const deleteResult = await c.env.db
			.delete(contracts)
			.where(
				and(eq(contracts.id, id), eq(contracts.legalEntityId, legalEntityId)),
			);

		// 3. Delete the file from storage *after* successful DB deletion
		if (contract.filePath) {
			const { error: storageError } = await c.env.supabase.storage
				.from("documents") // Assuming same bucket
				.remove([contract.filePath]);
			if (storageError) {
				console.error(
					"Failed to delete file from storage after DB delete:",
					storageError,
				);
				// Log the error but don't fail the request
			}
		}

		return c.body(null, 204);
	},
);
