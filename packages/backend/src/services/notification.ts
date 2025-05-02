import type { Database } from "@accounting-kz/db";
import { eq, legalEntities } from "@accounting-kz/db";
import {
	getMessaging,
	type Messaging,
	type MulticastMessage,
} from "firebase-admin/messaging";
import type { HonoEnv } from "../env";
import type { Context } from "hono";
import {
	initializeApp,
	cert,
	getApps,
	type App as FirebaseApp,
} from "firebase-admin/app";
import { credential } from "firebase-admin";
import { config } from "dotenv";
import * as path from "node:path";
import * as fs from "node:fs";

// Load environment variables for service account path
config({ path: ".env" });

// --- Firebase Admin SDK Initialization ---
// Construct an absolute path to the service account file in the backend root
const defaultServiceAccountPath = path.join(
	__dirname,
	"..",
	"..",
	".service-account.infobuh.json",
);
const serviceAccountPath =
	process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH || defaultServiceAccountPath;

let firebaseAdminApp: FirebaseApp;
if (!getApps().length) {
	try {
		// Use the resolved absolute path directly
		// Read the file content and parse as JSON
		const serviceAccountContent = fs.readFileSync(serviceAccountPath, "utf-8");
		const serviceAccount = JSON.parse(serviceAccountContent);
		firebaseAdminApp = initializeApp({
			credential: cert(serviceAccount),
		});
		console.log(
			"Firebase Admin SDK initialized successfully from notification service.",
		);
	} catch (error: unknown) {
		console.error(
			"Error initializing Firebase Admin SDK in notification service:",
			error,
		);
		console.error(
			"Ensure the service account key file exists relative to backend root at:",
			serviceAccountPath,
		);
		process.exit(1);
	}
} else {
	firebaseAdminApp = getApps()[0] as FirebaseApp;
}
// Export the initialized app instance
export { firebaseAdminApp };
// --- End Firebase Admin SDK Initialization ---

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
