import { Hono } from "hono";
import { eq, fcmTokenInsertSchema, fcmTokens } from "@accounting-kz/db";
import { HTTPException } from "hono/http-exception";
import type { HonoEnv } from "../env";
import { zValidator } from "@hono/zod-validator";
import { legalEntities } from "@accounting-kz/db";
import { sendNotificationToLegalEntityByBin } from "../services/notification";
import type { MulticastMessage } from "firebase-admin/messaging";

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

// GET /fcm-token/legal-entity/:legalEntityId - Find FCM tokens by legal entity ID
fcmTokenRouter.get("/legal-entity/:legalEntityId", async (c) => {
	const legalEntityId = c.req.param("legalEntityId");
	const db = c.env.db;

	if (!legalEntityId) {
		throw new HTTPException(400, { message: "Legal Entity ID is required" });
	}

	try {
		const tokens = await db.query.legalEntities.findMany({
			where: eq(legalEntities.id, legalEntityId),
			columns: {
				id: true,
				bin: true,
			},
			with: {
				profile: {
					with: {
						fcmTokens: true,
					},
				},
			},
		});

		if (!tokens || tokens.length === 0) {
			return c.json(
				{ message: "No FCM tokens found for this legal entity" },
				404,
			);
		}

		return c.json(tokens);
	} catch (error) {
		console.error("Error fetching FCM tokens by legal entity:", error);
		throw new HTTPException(500, { message: "Internal server error" });
	}
});

fcmTokenRouter.get("/legal-entity/bin/:bin", async (c) => {
	const bin = c.req.param("bin");
	const db = c.env.db;

	if (!bin) {
		throw new HTTPException(400, { message: "BIN is required" });
	}

	try {
		const legalEntity = await db.query.legalEntities.findFirst({
			where: eq(legalEntities.bin, bin),
			columns: {
				id: true,
				bin: true,
				name: true,
				address: true,
				phone: true,
			},
			with: {
				profile: {
					columns: {
						id: true,
						name: true,
						email: true,
					},
					with: {
						fcmTokens: true,
					},
				},
			},
		});

		if (!legalEntity) {
			throw new HTTPException(404, { message: "Legal entity not found" });
		}

		return c.json(legalEntity);
	} catch (error) {
		console.error("Error fetching legal entity by BIN:", error);
		throw new HTTPException(500, { message: "Internal server error" });
	}
});

fcmTokenRouter.get("/test-push", async (c) => {
	const message = {
		notification: {
			title: "Multicast Test",
			body: "This is a test message for the multicast test!",
		},
	} satisfies Omit<MulticastMessage, "tokens">;

	try {
		const response = sendNotificationToLegalEntityByBin(c, {
			receiverBin: "001123550090",
			message,
		});
		console.log("Successfully sent message:", response);
		return c.json({
			message: "Successfully sent notification to topic:",
			responseId: response,
		});
	} catch (error) {
		console.error("Error sending message:", error);
		throw new HTTPException(500, {
			message: "Failed to send notification to topic:",
		});
	}
});

export default fcmTokenRouter;
