import { Hono } from "hono";
import type { HonoEnv } from "../env";
import {
	banks,
	createInsertSchema,
	createSelectSchema,
	eq,
} from "@accounting-kz/db";
import { z } from "zod";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
// Create Zod schemas for banks based on the Drizzle definitions.
const bankZodSchema = createSelectSchema(banks);
const bankInsertSchema = createInsertSchema(banks);

const router = new Hono<HonoEnv>();

// Get all banks for a legal entity
router.get(
	"/:legalEntityId",
	describeRoute({
		description: "Get all banks for a legal entity",
		tags: ["Banks"],
		responses: {
			200: {
				description: "List of banks",
				content: {
					"application/json": {
						schema: resolver(z.array(bankZodSchema)),
					},
				},
			},
			500: {
				description: "Internal server error",
			},
		},
	}),
	async (c) => {
		try {
			const legalEntityId = c.req.param("legalEntityId");
			const banksList = await c.env.db.query.banks.findMany({
				where: eq(banks.legalEntityId, legalEntityId as string),
			});
			return c.json(banksList);
		} catch (error) {
			console.error("Error fetching banks:", error);
			return c.json({ error: "Failed to fetch banks" }, 500);
		}
	},
);

// Create a new bank
router.post(
	"/:legalEntityId",
	describeRoute({
		description: "Create a new bank",
		tags: ["Banks"],
		responses: {
			201: {
				description: "Bank created",
				content: {
					"application/json": {
						schema: resolver(bankZodSchema),
					},
				},
			},
			400: { description: "Invalid input" },
			500: { description: "Internal server error" },
		},
	}),
	zValidator("json", bankInsertSchema),
	async (c) => {
		try {
			const legalEntityId = c.req.param("legalEntityId") as string;
			const data = await c.req.json();
			const validatedData = bankInsertSchema.parse(data);

			const [newBank] = await c.env.db
				.insert(banks)
				.values({
					...validatedData,
					legalEntityId: legalEntityId,
				})
				.returning();

			return c.json(newBank, 201);
		} catch (error) {
			console.error("Error creating bank:", error);
			if (error instanceof z.ZodError) {
				return c.json({ error: error.errors }, 400);
			}
			return c.json({ error: "Failed to create bank" }, 500);
		}
	},
);

// Update an existing bank
router.put(
	"/:legalEntityId/:id",
	describeRoute({
		description: "Update a bank",
		tags: ["Banks"],
		responses: {
			200: {
				description: "Bank updated",
				content: {
					"application/json": {
						schema: resolver(bankZodSchema),
					},
				},
			},
			404: { description: "Bank not found" },
			500: { description: "Internal server error" },
		},
	}),
	zValidator("json", bankZodSchema.partial()),
	async (c) => {
		try {
			const id = c.req.param("id");
			const data = await c.req.json();
			const validatedData = bankZodSchema.partial().parse(data);

			const [updatedBank] = await c.env.db
				.update(banks)
				.set({
					...validatedData,
					updatedAt: new Date(),
				})
				.where(eq(banks.id, id))
				.returning();

			if (!updatedBank) {
				return c.json({ error: "Bank not found" }, 404);
			}

			return c.json(updatedBank);
		} catch (error) {
			console.error("Error updating bank:", error);
			if (error instanceof z.ZodError) {
				return c.json({ error: error.errors }, 400);
			}
			return c.json({ error: "Failed to update bank" }, 500);
		}
	},
);

export default router;
