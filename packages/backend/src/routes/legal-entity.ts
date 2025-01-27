import { Hono } from "hono";
import { legalEntities, profile } from "../db/schema";
import type { HonoEnv } from "../db";
import { eq } from "drizzle-orm";

const legalEntityRouter = new Hono<HonoEnv>();

legalEntityRouter.get("/current", async (c) => {
	const userId = c.get("userId");
	if (!userId) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const userLegalEntity = await c.env.db.query.legalEntities.findFirst({
		where: eq(legalEntities.profileId, userId),
		with: {
			banks: true,
		},
	});

	if (!userLegalEntity) {
		return c.json({ error: "Legal entity not found" }, 404);
	}

	return c.json(userLegalEntity);
});

export default legalEntityRouter;
