import { Hono } from "hono";
import {
	legalEntities,
	profile,
	legalEntityZodSchema,
	legalEntityInsertSchema,
	legalEntityUpdateSchema,
	eq,
	and,
} from "@accounting-kz/db";
import type { HonoEnv } from "../env";
import { z } from "zod";
import "zod-openapi/extend";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { findEntity } from "@accounting-kz/bin-verifier";
const router = new Hono<HonoEnv>();

router.get(
	"/all",
	describeRoute({
		description: "Get user's legal entities",
		tags: ["Legal Entity"],
		responses: {
			200: {
				description: "Legal entity found",
				content: {
					"application/json": {
						schema: resolver(legalEntityZodSchema),
					},
				},
			},
			401: {
				description: "Unauthorized",
			},
			404: {
				description: "Legal entities not found",
			},
		},
	}),
	async (c) => {
		const userId = c.get("userId") as unknown as string;

		if (!userId) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const userLegalEntities = await c.env.db.query.legalEntities.findMany({
			where: eq(legalEntities.profileId, userId),
		});

		return c.json(userLegalEntities);
	},
);

// Get current user's legal entity
router.get(
	"/current",
	describeRoute({
		description: "Get current user's legal entity",
		tags: ["Legal Entity"],
		responses: {
			200: {
				description: "Legal entity found",
				content: {
					"application/json": {
						schema: resolver(legalEntityZodSchema),
					},
				},
			},
			401: {
				description: "Unauthorized",
			},
			404: {
				description: "Legal entity not found",
			},
		},
	}),
	async (c) => {
		const userId = c.get("userId") as unknown as string;
		if (!userId) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const userLegalEntity = await c.env.db.query.legalEntities.findFirst({
			where: eq(legalEntities.profileId, userId),
		});

		if (!userLegalEntity) {
			return c.json({ error: "Legal entity not found" }, 404);
		}

		return c.json(userLegalEntity);
	},
);

// Create legal entity
router.post(
	"/create",
	describeRoute({
		description: "Create a new legal entity",
		tags: ["Legal Entity"],
		responses: {
			201: {
				description: "Legal entity created",
				content: {
					"application/json": {
						schema: resolver(legalEntityInsertSchema),
					},
				},
			},
			400: { description: "Invalid input" },
			500: { description: "Internal server error" },
		},
	}),
	// Use the insert schema for legal entity creation
	zValidator("json", legalEntityInsertSchema),
	async (c) => {
		try {
			// Get the profile ID from context (e.g. set by middleware during auth)
			const userId = c.get("userId") as unknown as string;
			if (!userId) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const data = await c.req.json();
			const validatedData = legalEntityInsertSchema.parse(data);

			const [newLegalEntity] = await c.env.db
				.insert(legalEntities)
				.values({
					...validatedData,
					profileId: userId,
					registrationDate: new Date(validatedData.registrationDate),
				})
				.returning();

			return c.json(newLegalEntity, 201);
		} catch (error) {
			console.error("Error creating legal entity:", error);
			if (error instanceof z.ZodError) {
				return c.json({ error: error.errors }, 400);
			}
			return c.json({ error: "Failed to create legal entity" }, 500);
		}
	},
);

// Update legal entity
router.put(
	"/:id",
	describeRoute({
		description: "Update a legal entity",
		tags: ["Legal Entity"],
		responses: {
			200: {
				description: "Legal entity updated",
				content: {
					"application/json": {
						schema: resolver(legalEntityUpdateSchema),
					},
				},
			},
			404: {
				description: "Legal entity not found",
			},
			500: {
				description: "Internal server error",
			},
		},
	}),
	zValidator("json", legalEntityUpdateSchema.partial()),
	async (c) => {
		try {
			const id = c.req.param("id");
			const data = await c.req.json();
			const validatedData = legalEntityUpdateSchema.partial().parse(data);

			if (validatedData.registrationDate) {
				validatedData.registrationDate = new Date(
					validatedData.registrationDate,
				);
			}

			const [updatedLegalEntity] = await c.env.db
				.update(legalEntities)
				.set(validatedData)
				.where(eq(legalEntities.id, id))
				.returning();

			if (!updatedLegalEntity) {
				return c.json({ error: "Legal entity not found" }, 404);
			}

			return c.json(updatedLegalEntity);
		} catch (error) {
			console.error("Error updating legal entity:", error);
			if (error instanceof z.ZodError) {
				return c.json({ error: error.errors }, 400);
			}
			return c.json({ error: "Failed to update legal entity" }, 500);
		}
	},
);

// Delete legal entity
router.delete(
	"/:id",
	describeRoute({
		description: "Delete a legal entity",
		tags: ["Legal Entity"],
		responses: {
			200: {
				description: "Legal entity deleted",
			},
			404: {
				description: "Legal entity not found",
			},
			500: {
				description: "Internal server error",
			},
		},
	}),
	async (c) => {
		try {
			const id = c.req.param("id");

			const deletedEntities = await c.env.db
				.delete(legalEntities)
				.where(eq(legalEntities.id, id))
				.returning();

			if (deletedEntities.length === 0) {
				return c.json({ error: "Legal entity not found" }, 404);
			}

			return c.json({ message: "Legal entity deleted" });
		} catch (error) {
			console.error("Error deleting legal entity:", error);
			return c.json({ error: "Failed to delete legal entity" }, 500);
		}
	},
);

// Search legal entity by BIN for the current user
const binParamSchema = z.object({
	bin: z
		.string()
		.length(12)
		.openapi({
			param: {
				name: "bin",
				in: "path",
			},
			example: "123456789012",
			description: "The BIN of the legal entity to search for",
		}),
});

router.get(
	"/search/bin/:bin",
	zValidator("param", binParamSchema),
	describeRoute({
		description: "Search for a legal entity by BIN for the current user",
		tags: ["Legal Entity"],
		parameters: [
			{
				name: "bin",
				in: "path",
				required: true,
				description: "The BIN of the legal entity",
				schema: { type: "string", example: "123456789012" },
			},
		],
		responses: {
			200: {
				description: "Legal entity found",
				content: {
					"application/json": {
						schema: resolver(legalEntityZodSchema),
					},
				},
			},
			400: { description: "Invalid BIN format" },
			401: { description: "Unauthorized" },
			404: { description: "Legal entity not found" },
			500: { description: "Internal server error" },
		},
	}),
	async (c) => {
		const userId = c.get("userId") as unknown as string;
		if (!userId) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const { bin } = c.req.valid("param");

		try {
			const foundEntity = await c.env.db.query.legalEntities.findFirst({
				where: eq(legalEntities.bin, bin),
			});

			if (!foundEntity) {
				return c.json({ error: "Legal entity not found" }, 404);
			}

			return c.json(foundEntity);
		} catch (error) {
			console.error("Error searching legal entity by BIN:", error);
			if (error instanceof z.ZodError) {
				// This case might not be reached due to zValidator, but good practice
				return c.json({ error: error.errors }, 400);
			}
			return c.json({ error: "Failed to search legal entity" }, 500);
		}
	},
);

// Bin verifier route (ensure it uses the imported findEntity)
router.get("/verify-bin", async (c) => {
	const query = c.req.query("q");
	if (!query) {
		return c.json({ error: "Query parameter 'q' is required" }, 400);
	}
	// findEntity now handles the initialization check internally
	const entity = await findEntity(query);
	if (!entity) {
		// Consider differentiating between "not found" and "not initialized", though findEntity logs a warning if not initialized.
		return c.json({ error: "Entity not found or verifier not ready" }, 404);
	}
	return c.json(entity);
});

export default router;
