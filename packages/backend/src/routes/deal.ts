import { Hono } from "hono";
import type { HonoEnv } from "../env";
import {
	deals,
	dealZodSchema,
	dealInsertSchema,
	dealUpdateSchema,
	eq,
	desc,
	and,
	legalEntities,
} from "@accounting-kz/db";
import { describeRoute } from "hono-openapi";
import { z } from "zod";
import "zod-openapi/extend";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { HTTPException } from "hono/http-exception";

const dealRouter = new Hono<HonoEnv>();

// Create a new deal
dealRouter.post(
	"/",
	describeRoute({
		description: "Create a new deal",
		tags: ["Deals"],
		request: {
			body: {
				content: {
					"application/json": {
						schema: dealInsertSchema,
					},
				},
			},
		},
		responses: {
			201: {
				description: "Deal created successfully",
				content: {
					"application/json": {
						schema: dealZodSchema,
					},
				},
			},
			400: { description: "Invalid input" },
			401: { description: "Unauthorized" },
			500: { description: "Internal server error" },
		},
	}),
	zValidator("json", dealInsertSchema),
	async (c) => {
		try {
			const userId = c.get("userId"); // Assuming userId is available from auth middleware
			if (!userId) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const newDealData = c.req.valid("json");

			// Ensure legalEntityId is present and valid if needed for authorization,
			// or associate the deal with the user in another way if applicable.
			// For now, we assume legalEntityId is part of newDealData and is authorized.

			const [createdDeal] = await c.env.db
				.insert(deals)
				.values({
					...newDealData,
					// If legalEntityId needs to be tied to the user creating it,
					// ensure this link is validated or set here.
					// Example: profileId: userId, (if deals table has a profileId)
					// For now, assuming legalEntityId in newDealData is sufficient.
				})
				.returning();

			if (!createdDeal) {
				throw new HTTPException(500, { message: "Failed to create deal" });
			}

			return c.json(createdDeal, 201);
		} catch (error) {
			console.error("Error creating deal:", error);
			if (error instanceof z.ZodError) {
				return c.json({ error: error.errors }, 400);
			}
			if (error instanceof HTTPException) {
				throw error;
			}
			return c.json({ error: "Failed to create deal" }, 500);
		}
	},
);

// Define a schema for the request body when receiverBin is in the path
const dealInsertSchemaForReceiverBinInPath = dealInsertSchema.omit({
	receiverBin: true,
	legalEntityId: true,
});

// Create a new deal by receiverBin (receiverBin in path)
dealRouter.post(
	"/receiverBin/:receiverBin",
	describeRoute({
		description: "Create a new deal with receiverBin specified in the path",
		tags: ["Deals"],
		parameters: [
			{
				name: "receiverBin",
				in: "path",
				required: true,
				schema: { type: "string", minLength: 12, maxLength: 12 }, // Consistent with schema
				description: "BIN of the receiver (12 characters)",
			},
		],
		request: {
			body: {
				content: {
					"application/json": {
						schema: dealInsertSchemaForReceiverBinInPath,
					},
				},
			},
		},
		responses: {
			201: {
				description: "Deal created successfully",
				content: {
					"application/json": {
						schema: dealZodSchema,
					},
				},
			},
			400: {
				description:
					"Invalid input (e.g., invalid body, or receiverBin format mismatch)",
			},
			401: { description: "Unauthorized" },
			500: { description: "Internal server error" },
		},
	}),
	zValidator("json", dealInsertSchemaForReceiverBinInPath),
	async (c) => {
		try {
			const userId = c.get("userId");
			if (!userId) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const pathReceiverBin = c.req.param("receiverBin");
			// Basic validation for receiverBin length, though schema implies it.
			if (pathReceiverBin.length !== 12) {
				return c.json(
					{ error: "Receiver BIN in path must be 12 characters" },
					400,
				);
			}

			const legalEntity = await c.env.db.query.legalEntities.findFirst({
				where: eq(legalEntities.bin, pathReceiverBin),
			});
			if (!legalEntity) {
				return c.json({ error: "Legal entity not found" }, 404);
			}

			const newDealDataFromBody = c.req.valid("json");

			const [createdDeal] = await c.env.db
				.insert(deals)
				.values({
					...newDealDataFromBody,
					receiverBin: pathReceiverBin,
					legalEntityId: legalEntity.id,
				})
				.returning();

			if (!createdDeal) {
				throw new HTTPException(500, { message: "Failed to create deal" });
			}

			return c.json(createdDeal, 201);
		} catch (error) {
			console.error("Error creating deal by receiverBin:", error);
			if (error instanceof z.ZodError) {
				return c.json({ error: error.errors }, 400);
			}
			if (error instanceof HTTPException) {
				throw error;
			}
			return c.json({ error: "Failed to create deal" }, 500);
		}
	},
);

// Get all deals for a legal entity
dealRouter.get(
	"/legalEntity/:legalEntityId",
	describeRoute({
		description: "Get all deals for a legal entity",
		tags: ["Deals"],
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
				description: "List of deals",
				content: {
					"application/json": {
						schema: z.array(dealZodSchema),
					},
				},
			},
			401: { description: "Unauthorized" },
			404: { description: "Legal entity not found or no deals" },
			500: { description: "Internal server error" },
		},
	}),
	async (c) => {
		try {
			const userId = c.get("userId");
			if (!userId) {
				return c.json({ error: "Unauthorized" }, 401);
			}
			const legalEntityId = c.req.param("legalEntityId");

			// Optional: Add a check to ensure the user has access to this legalEntityId's deals.
			// For example, check if the legalEntityId belongs to the user's profile.

			const dealsList = await c.env.db.query.deals.findMany({
				where: eq(deals.legalEntityId, legalEntityId),
				orderBy: [desc(deals.createdAt)],
				// You might want to include relations like comments or documents here in the future
				// with: { comments: true, dealDocumentsFlutter: true }
			});

			if (!dealsList) {
				// Or dealsList.length === 0 depending on desired 404 behavior
				return c.json({ error: "No deals found for this legal entity" }, 404);
			}

			return c.json(dealsList);
		} catch (error) {
			console.error("Error fetching deals for legal entity:", error);
			return c.json({ error: "Failed to fetch deals" }, 500);
		}
	},
);

// Get all deals by receiver BIN
dealRouter.get(
	"/receiverBin/:receiverBin",
	describeRoute({
		description: "Get all deals for a receiver BIN",
		tags: ["Deals"],
		parameters: [
			{
				name: "receiverBin",
				in: "path",
				required: true,
				schema: { type: "string", length: 12 }, // Assuming BIN is a 12-char string
				description: "BIN of the receiver",
			},
		],
		responses: {
			200: {
				description: "List of deals for the receiver BIN",
				content: {
					"application/json": {
						schema: z.array(dealZodSchema),
					},
				},
			},
			401: { description: "Unauthorized" },
			404: { description: "No deals found for this receiver BIN" },
			500: { description: "Internal server error" },
		},
	}),
	async (c) => {
		try {
			const userId = c.get("userId");
			if (!userId) {
				return c.json({ error: "Unauthorized" }, 401);
			}
			const receiverBin = c.req.param("receiverBin");

			// Optional: Add a check to ensure the user has access to this receiverBin's deals.
			// This might involve checking against legal entities associated with the user.

			const dealsList = await c.env.db.query.deals.findMany({
				where: eq(deals.receiverBin, receiverBin),
				orderBy: [desc(deals.createdAt)],
				with: {
					comments: true,
					dealDocumentsFlutter: {
						with: {
							documentFlutter: true,
						},
					},
				},
			});

			if (!dealsList || dealsList.length === 0) {
				return c.json({ error: "No deals found for this receiver BIN" }, 404);
			}

			const dealsWithDocuments = dealsList.map((deal) => ({
				...deal,
				documentsFlutter: deal.dealDocumentsFlutter.map(
					(dealDocument) => dealDocument.documentFlutter,
				),
			}));
			return c.json(dealsWithDocuments);
		} catch (error) {
			console.error("Error fetching deals for receiver BIN:", error);
			return c.json({ error: "Failed to fetch deals" }, 500);
		}
	},
);

// Get a specific deal by ID
dealRouter.get(
	"/:id",
	describeRoute({
		description: "Get a specific deal by ID",
		tags: ["Deals"],
		parameters: [
			{
				name: "id",
				in: "path",
				required: true,
				schema: { type: "string", format: "uuid" },
				description: "UUID of the deal",
			},
		],
		responses: {
			200: {
				description: "Deal details",
				content: {
					"application/json": {
						schema: dealZodSchema, // Consider a more detailed schema like DealWithRelations if needed
					},
				},
			},
			401: { description: "Unauthorized" },
			404: { description: "Deal not found" },
			500: { description: "Internal server error" },
		},
	}),
	async (c) => {
		try {
			const id = c.req.param("id");

			const deal = await c.env.db.query.deals.findFirst({
				where: eq(deals.id, id),
				with: {
					dealDocumentsFlutter: {
						with: {
							documentFlutter: true,
						},
					},
					comments: true,
				},
			});
			if (!deal) {
				return c.json({ error: "Deal not found" }, 404);
			}

			const dealWithDocuments = {
				...deal,
				documentsFlutter: deal?.dealDocumentsFlutter.map(
					(dealDocument) => dealDocument.documentFlutter,
				),
			};

			return c.json(dealWithDocuments);
		} catch (error) {
			console.error("Error fetching deal:", error);
			return c.json({ error: "Failed to fetch deal" }, 500);
		}
	},
);

// Update a deal
dealRouter.put(
	"/:id",
	describeRoute({
		description: "Update an existing deal",
		tags: ["Deals"],
		parameters: [
			{
				name: "id",
				in: "path",
				required: true,
				schema: { type: "string", format: "uuid" },
				description: "UUID of the deal to update",
			},
		],
		request: {
			body: {
				content: {
					"application/json": {
						schema: dealUpdateSchema,
					},
				},
			},
		},
		responses: {
			200: {
				description: "Deal updated successfully",
				content: {
					"application/json": {
						schema: dealZodSchema,
					},
				},
			},
			400: { description: "Invalid input" },
			401: { description: "Unauthorized" },
			403: { description: "Forbidden - User cannot update this deal" },
			404: { description: "Deal not found" },
			500: { description: "Internal server error" },
		},
	}),
	zValidator("json", dealUpdateSchema),
	async (c) => {
		try {
			const userId = c.get("userId");
			if (!userId) {
				return c.json({ error: "Unauthorized" }, 401);
			}
			const id = c.req.param("id");
			const dealUpdateData = c.req.valid("json");

			// Optional: Authorization check - ensure user can update this deal
			const existingDeal = await c.env.db.query.deals.findFirst({
				where: eq(deals.id, id),
				// columns: { legalEntityId: true } // or whatever field links to user/profile
			});

			if (!existingDeal) {
				return c.json({ error: "Deal not found" }, 404);
			}
			// Example authorization: if (existingDeal.someUserIdField !== userId) {
			//  return c.json({ error: "Forbidden" }, 403);
			// }

			const [updatedDeal] = await c.env.db
				.update(deals)
				.set({
					...dealUpdateData,
					updatedAt: new Date(), // Explicitly set updatedAt
				})
				.where(eq(deals.id, id)) // Ensure only the correct deal is updated
				.returning();

			if (!updatedDeal) {
				// This case should ideally be caught by the findFirst above,
				// but as a safeguard:
				return c.json({ error: "Deal not found or update failed" }, 404);
			}

			return c.json(updatedDeal);
		} catch (error) {
			console.error("Error updating deal:", error);
			if (error instanceof z.ZodError) {
				return c.json({ error: error.errors }, 400);
			}
			if (error instanceof HTTPException) {
				throw error;
			}
			return c.json({ error: "Failed to update deal" }, 500);
		}
	},
);

// Delete a deal
dealRouter.delete(
	"/:id",
	describeRoute({
		description: "Delete a deal by ID",
		tags: ["Deals"],
		parameters: [
			{
				name: "id",
				in: "path",
				required: true,
				schema: { type: "string", format: "uuid" },
				description: "UUID of the deal to delete",
			},
		],
		responses: {
			200: {
				description: "Deal deleted successfully",
				content: {
					"application/json": { schema: z.object({ message: z.string() }) },
				},
			},
			204: { description: "Deal deleted successfully (No content)" },
			401: { description: "Unauthorized" },
			403: { description: "Forbidden - User cannot delete this deal" },
			404: { description: "Deal not found" },
			500: { description: "Internal server error" },
		},
	}),
	async (c) => {
		try {
			const userId = c.get("userId");
			if (!userId) {
				return c.json({ error: "Unauthorized" }, 401);
			}
			const id = c.req.param("id");

			// Optional: Authorization check (similar to update)
			const existingDeal = await c.env.db.query.deals.findFirst({
				where: eq(deals.id, id),
				// columns: { legalEntityId: true } // or other relevant field for auth
			});

			if (!existingDeal) {
				return c.json({ error: "Deal not found" }, 404);
			}
			// Example authorization: if (existingDeal.someUserIdField !== userId) {
			//  return c.json({ error: "Forbidden" }, 403);
			// }

			const deletedDeals = await c.env.db
				.delete(deals)
				.where(eq(deals.id, id))
				.returning({ id: deals.id }); // return something to confirm deletion

			if (deletedDeals.length === 0) {
				// Should be caught by findFirst, but as a safeguard
				return c.json({ error: "Deal not found or delete failed" }, 404);
			}
			// Prefer 200 with a message or 204 No Content.
			// Hono openapi plugin might have issues with 204 if not handled carefully in schema.
			// Let's use 200 with a message for clarity for now.
			return c.json({ message: "Deal deleted successfully" });
		} catch (error) {
			console.error("Error deleting deal:", error);
			if (error instanceof HTTPException) {
				throw error;
			}
			return c.json({ error: "Failed to delete deal" }, 500);
		}
	},
);

export { dealRouter };
