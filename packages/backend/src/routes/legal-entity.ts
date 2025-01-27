import { Hono } from "hono";
import { legalEntities, profile, legalEntityZodSchema } from "../db/schema";
import type { HonoEnv } from "../db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import "zod-openapi/extend";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

const router = new Hono<HonoEnv>();

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

export default router;
