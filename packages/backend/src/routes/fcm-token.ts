import { Hono } from "hono";
import { eq, fcmTokens } from "@accounting-kz/db";
import { HTTPException } from "hono/http-exception";
import type { HonoEnv } from "../env";

const fcmTokenRouter = new Hono<HonoEnv>();

// GET /fcm-token/find/:userId - Find FCM tokens by user ID
fcmTokenRouter.get("/find/:userId", async (c) => {
	const userId = c.req.param("userId");
	const db = c.env.db;

	if (!userId) {
		throw new HTTPException(400, { message: "User ID is required" });
	}

	try {
		const tokens = await db
			.select()
			.from(fcmTokens)
			.where(eq(fcmTokens.userId, userId));

		if (!tokens || tokens.length === 0) {
			return c.json({ message: "No FCM tokens found for this user" }, 404);
		}

		return c.json(tokens);
	} catch (error) {
		console.error("Error fetching FCM tokens:", error);
		throw new HTTPException(500, { message: "Internal server error" });
	}
});

export default fcmTokenRouter;
