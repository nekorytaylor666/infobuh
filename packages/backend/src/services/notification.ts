import type { Database } from "@accounting-kz/db";
import { eq, legalEntities } from "@accounting-kz/db";
import {
	getMessaging,
	type Messaging,
	type MulticastMessage,
} from "firebase-admin/messaging";
import type { HonoEnv } from "../env";
import type { Context } from "hono";

interface SendNotificationArgs {
	receiverBin: string;
	message: Omit<MulticastMessage, "tokens">;
}

/**
 * Finds a legal entity by BIN, retrieves its associated FCM tokens,
 * and sends a multicast notification.
 */
export async function sendNotificationToLegalEntityByBin(
	c: Context<HonoEnv>,
	{ receiverBin, message }: SendNotificationArgs,
): Promise<void> {
	console.log(`Attempting to send notification to BIN: ${receiverBin}`);

	try {
		// 1. Find the legal entity and associated profile/tokens
		const entity = await c.env.db.query.legalEntities.findFirst({
			where: eq(legalEntities.bin, receiverBin),
			columns: {
				id: true,
				name: true, // For logging/context
			},
			with: {
				profile: {
					columns: {
						id: true,
					},
					with: {
						fcmTokens: {
							columns: {
								token: true,
							},
						},
					},
				},
			},
		});

		if (!entity) {
			console.warn(`Legal entity not found for BIN: ${receiverBin}`);
			return;
		}

		if (!entity.profile) {
			console.warn(
				`Profile not found for legal entity: ${entity.name} (BIN: ${receiverBin})`,
			);
			return;
		}

		const tokens = entity.profile.fcmTokens.map((t) => t.token).filter(Boolean);

		if (tokens.length === 0) {
			console.log(
				`No active FCM tokens found for legal entity: ${entity.name} (BIN: ${receiverBin})`,
			);
			return;
		}

		console.log(
			`Found ${tokens.length} tokens for BIN ${receiverBin}. Preparing notification.`,
		);

		// 2. Construct the multicast message
		const multicastMessage: MulticastMessage = {
			...message,
			tokens,
		};

		// 3. Send the message
		const response = await getMessaging(
			c.env.firebaseAdmin,
		).sendEachForMulticast(multicastMessage);

		console.log(
			`Notification sent to ${response.successCount} devices for BIN ${receiverBin}. Failures: ${response.failureCount}`,
		);

		// Optional: Handle failures (e.g., remove invalid tokens)
		if (response.failureCount > 0) {
			response.responses.forEach((resp, idx) => {
				if (!resp.success) {
					console.error(
						`Failed to send to token ${tokens[idx]}: ${resp.error?.message}`,
					);
					// Consider logic here to remove invalid tokens from the database
					// based on error codes (e.g., 'messaging/registration-token-not-registered')
					// const errorCode = (resp.error as FirebaseError)?.code;
				}
			});
		}
	} catch (error) {
		console.error(
			`Error sending notification for BIN ${receiverBin}:`,
			error instanceof Error ? error.message : error,
		);
	}
}
