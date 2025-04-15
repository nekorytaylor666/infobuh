import { Hono } from "hono";
import type { HonoEnv } from "../env";
import { contracts, eq, and, desc } from "@accounting-kz/db";
import { HTTPException } from "hono/http-exception";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
export const contractsRouter = new Hono<HonoEnv>();

contractsRouter.get(
	"/:legalEntityId",
	describeRoute({
		description: "Get all contracts for a legal entity",
		tags: ["Contracts"],
		responses: {
			200: {
				description: "List of contracts",
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
		});

		return c.json(contractList);
	},
);

contractsRouter.get(
	"/:legalEntityId/:id",
	describeRoute({
		description: "Get a specific contract for a legal entity",
		tags: ["Contracts"],
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
		});

		if (!contract) {
			throw new HTTPException(404, { message: "Contract not found" });
		}

		return c.json(contract);
	},
);

contractsRouter.post(
	"/:legalEntityId",
	describeRoute({
		description: "Create a new contract for a legal entity",
		tags: ["Contracts"],
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
		// Now we expect number and date in place of name
		const { number, date, partnerId, file, currency } = body;

		if (
			(number === undefined || number === null) ||
			!date ||
			!partnerId ||
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

		const newContract = await c.env.db
			.insert(contracts)
			.values({
				legalEntityId,
				number,
				date,
				partnerId,
				currency,
				filePath: newFilePath,
			})
			.returning();

		return c.json(newContract[0]);
	},
);

contractsRouter.put(
	"/:legalEntityId/:id",
	describeRoute({
		description: "Update an existing contract for a legal entity",
		tags: ["Contracts"],
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
				eq(contracts.legalEntityId, legalEntityId)
			),
		});

		if (!contract) {
			throw new HTTPException(404, { message: "Contract not found" });
		}

		let updatedFilePath = contract.filePath;
		if (body.file?.data && body.file.name) {
			if (contract.filePath) {
				const { error: removeError } = await c.env.supabase.storage
					.from("documents")
					.remove([contract.filePath]);
				if (removeError) {
					throw new HTTPException(500, {
						message: "Failed to delete old file from storage",
					});
				}
			}

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

		const updatedContract = await c.env.db
			.update(contracts)
			.set({
				number: body.number ?? contract.number,
				date: body.date ?? contract.date,
				partnerId: body.partnerId ?? contract.partnerId,
				filePath: updatedFilePath,
			})
			.where(
				and(
					eq(contracts.id, id),
					eq(contracts.legalEntityId, legalEntityId)
				)
			)
			.returning();

		if (!updatedContract.length) {
			throw new HTTPException(404, {
				message: "Contract not found or update failed",
			});
		}

		return c.json(updatedContract[0]);
	},
);


