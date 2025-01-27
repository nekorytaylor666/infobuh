import { Hono } from "hono";
import { legalEntities, profile, legalEntityZodSchema } from "../db/schema";
import type { HonoEnv } from "../db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import "zod-openapi/extend";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

const router = new Hono<HonoEnv>();

// Get current user's legal entity
router.get(
	"/current",
	describeRoute({
		description: "Get current user's legal entity",
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
		const userId = c.get("userId") as string;
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
	"/",
	describeRoute({
		description: "Create a new legal entity",
		responses: {
			201: {
				description: "Legal entity created",
				content: {
					"application/json": {
						schema: resolver(legalEntityZodSchema),
					},
				},
			},
			400: {
				description: "Invalid input",
			},
			500: {
				description: "Internal server error",
			},
		},
	}),
	zValidator("json", legalEntityZodSchema),
	async (c) => {
		try {
			const data = await c.req.json();
			const validatedData = legalEntityZodSchema.parse(data);

			const [newLegalEntity] = await c.env.db
				.insert(legalEntities)
				.values(validatedData)
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
		responses: {
			200: {
				description: "Legal entity updated",
				content: {
					"application/json": {
						schema: resolver(legalEntityZodSchema),
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
	zValidator("json", legalEntityZodSchema.partial()),
	async (c) => {
		try {
			const id = c.req.param("id");
			const data = await c.req.json();
			const validatedData = legalEntityZodSchema.partial().parse(data);

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

			const deletedCount = await c.env.db
				.delete(legalEntities)
				.where(eq(legalEntities.id, id))
				.returning();

			if (deletedCount === 0) {
				return c.json({ error: "Legal entity not found" }, 404);
			}

			return c.json({ message: "Legal entity deleted" });
		} catch (error) {
			console.error("Error deleting legal entity:", error);
			return c.json({ error: "Failed to delete legal entity" }, 500);
		}
	},
);

export default router;
