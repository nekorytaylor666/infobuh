import { Hono } from "hono";
import { eq, fcmTokenInsertSchema, fcmTokens } from "@accounting-kz/db";
import { HTTPException } from "hono/http-exception";
import type { HonoEnv } from "../env";
import { zValidator } from "@hono/zod-validator";

const fcmTokenRouter = new Hono<HonoEnv>();

// POST /fcm-token - Add a new FCM token
fcmTokenRouter.post(
	"/",
	zValidator(
		"json",
		fcmTokenInsertSchema.omit({ id: true, createdAt: true, updatedAt: true }),
	),
	async (c) => {
		const { userId, token, deviceType } = c.req.valid("json");
		const db = c.env.db;

		try {
			// Check if token already exists for this user (optional, depends on logic)
			// You might want to upsert instead of just insert
			const [newToken] = await db
				.insert(fcmTokens)
				.values({ userId, token, deviceType })
				.returning();

			if (!newToken) {
				throw new HTTPException(500, { message: "Failed to save FCM token" });
			}

			return c.json(newToken, 201);
		} catch (error) {
			console.error("Error saving FCM token:", error);
			// Handle potential unique constraint violation if token already exists
			if (
				error instanceof Error &&
				error.message.includes("unique constraint")
			) {
				throw new HTTPException(409, { message: "FCM token already exists" });
			}
			throw new HTTPException(500, { message: "Internal server error" });
		}
	},
);

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
