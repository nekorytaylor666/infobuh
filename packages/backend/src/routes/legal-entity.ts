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
import { findUgdByAddressComponents } from "../services/ugdService";
import { AccountingSeedService } from "../lib/accounting-service/seed-service";
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
			401: { description: "Unauthorized" },
			500: { description: "Internal server error" },
		},
	}),
	// Use the insert schema for legal entity creation
	zValidator("json", legalEntityInsertSchema),
	async (c) => {
		try {
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

			// Automatically seed accounting accounts for the new legal entity
			try {
				console.log(`🌱 Seeding accounting accounts for new legal entity: ${newLegalEntity.id}`);
				const seedService = new AccountingSeedService(c.env.db);
				await seedService.seedDatabase(newLegalEntity.id, userId);
				console.log(`✅ Successfully seeded accounts for legal entity: ${newLegalEntity.id}`);
			} catch (seedError) {
				console.error(`❌ Error seeding accounts for legal entity ${newLegalEntity.id}:`, seedError);
				// Note: We don't fail the legal entity creation if seeding fails
				// This allows the user to continue and seed manually later if needed
			}

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
			400: { description: "Invalid input" },
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

			if (
				validatedData.registrationDate &&
				typeof validatedData.registrationDate === "string"
			) {
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
				content: {
					"application/json": {
						schema: z.object({ message: z.string() }),
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
	const queryBin = c.req.query("q");
	if (!queryBin) {
		return c.json({ error: "Query parameter 'q' (BIN) is required" }, 400);
	}

	const entityFromRegistry = await c.env.db.query.binRegistry.findFirst({
		where: (binRegistry, { eq }) => eq(binRegistry.bin, queryBin),
	});

	if (!entityFromRegistry) {
		return c.json({ error: "Entity not found in BIN registry" }, 404);
	}

	// Attempt to find UGD using the locality name from the BIN registry
	const ugdInfo = await findUgdByAddressComponents({
		localityName:
			entityFromRegistry.localityNameRu || entityFromRegistry.localityNameKz,
	});

	// Combine BIN registry data with UGD code
	const responseData = {
		...entityFromRegistry,
		ugdCode: ugdInfo ? ugdInfo.code : null,
		ugdName: ugdInfo ? ugdInfo.originalName : null,
	};

	return c.json(responseData);
});

export default router;
