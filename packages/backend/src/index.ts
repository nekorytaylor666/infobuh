import { config } from "dotenv";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { openAPISpecs } from "hono-openapi";
import { env } from "hono/adapter";
import { PostHog } from "posthog-node";
import authRouter from "./routes/auth";
import legalEntityRouter from "./routes/legal-entity";
import employeesRouter from "./routes/employees";
import banksRouter from "./routes/banks";
import partnersRouter from "./routes/partners";
import productsRouter from "./routes/products";
import fcmTokenRouter from "./routes/fcm-token";
import accountingRouter from "./routes/accounting";
import { apiReference } from "@scalar/hono-api-reference";
import { authMiddleware } from "./middleware/auth";
import { documentsRouter } from "./routes/documents";
import { documentsFlutterRouter } from "./routes/documents_flutter";
import { supabase } from "./lib/supabase";
import { documentTemplatesRouter } from "./routes/document-templates";
import { prettyJSON } from "hono/pretty-json";
import { createMiddleware } from "hono/factory";
import { createDbClient } from "@accounting-kz/db";
import type { HonoEnv } from "./env";
import { firebaseAdminApp } from "./services/notification"; // Import initialized app
import { dealRouter } from "./routes/deal";
import { appVersionsRouter } from "./routes/app-versions";
// Load environment variables
config({ path: ".env" });

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL is not set");
}

// Create database client
const dbClient = createDbClient(process.env.DATABASE_URL);

// Custom logger middleware
const customRequestLogger = createMiddleware(async (c, next) => {
	const start = Date.now();
	const { method } = c.req;
	const path = c.req.path;

	let reqLog = `--> ${method} ${path}`;

	if (c.req.raw.body && c.req.header("content-length") && Number(c.req.header("content-length")) > 0) {
		const reqClone = c.req.raw.clone();
		try {
			const contentType = c.req.header("content-type");
			if (contentType?.includes("application/json")) {
				const requestBody = await reqClone.json();
				reqLog += `
Request Body (JSON):
${JSON.stringify(requestBody, null, 2)}`;
			} else if (contentType?.includes("text")) {
				const requestBody = await reqClone.text();
				reqLog += `
Request Body (Text):
${requestBody}`;
			} else if (contentType?.includes("form")) {
				reqLog += `
Request Body: Form data (type: ${contentType})`;
			} else {
				reqLog += `
Request Body: Opaque data (type: ${contentType})`;
			}
		} catch (e: any) {
			reqLog += `
Error reading request body for logging: ${e.message}`;
		}
	}
	console.log(reqLog);

	await next();

	const ms = Date.now() - start;
	let resLog = `<-- ${method} ${path} ${c.res.status} ${ms}ms`;

	if (c.res && c.res.body) {
		const resClone = c.res.clone();
		try {
			const responseContentType = resClone.headers.get("content-type");
			if (responseContentType?.includes("application/json")) {
				const responseBody = await resClone.json();
				resLog += `
Response Body (JSON):
${JSON.stringify(responseBody, null, 2)}`;
			} else if (responseContentType?.includes("text")) {
				const responseBody = await resClone.text();
				const MAX_TEXT_LENGTH = 1000;
				if (responseBody.length > MAX_TEXT_LENGTH) {
					resLog += `
Response Body (Text):
${responseBody.substring(0, MAX_TEXT_LENGTH)}... (truncated)`;
				} else {
					resLog += `
Response Body (Text):
${responseBody}`;
				}
			} else if (resClone.body) {
				resLog += `
Response Body: Opaque data (type: ${responseContentType}, size: ${resClone.headers.get('content-length') || 'unknown'})`;
			}
		} catch (e: any) {
			try {
				const resClone2 = c.res.clone();
				const textBody = await resClone2.text();
				const MAX_TEXT_LENGTH = 1000;
				if (textBody.length > MAX_TEXT_LENGTH) {
					resLog += `
Response Body (Fallback to Text):
${textBody.substring(0, MAX_TEXT_LENGTH)}... (truncated)`;
				} else {
					resLog += `
Response Body (Fallback to Text):
${textBody}`;
				}
			} catch (e2: any) {
				resLog += `
Error reading response body for logging: ${e.message} (Primary) / ${e2.message} (Fallback)`;
			}
		}
	}
	console.log(resLog);
});

const app = new Hono<HonoEnv>();

app.use("*", customRequestLogger);
app.use("*", prettyJSON());
app.use(
	"*",
	cors({
		origin: [
			"http://localhost:3000",
			"http://localhost:3001",
			"https://infobuh.pages.dev",
		],
		credentials: true,
	}),
);

// Create database connection
if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL environment variable is not set.");
}
app.use("*", async (c, next) => {
	c.env.DATABASE_URL = process.env.DATABASE_URL as string;
	c.env.POSTHOG_PUBLIC_KEY = process.env.POSTHOG_PUBLIC_KEY as string;
	c.env.db = dbClient;
	c.env.supabase = supabase;
	c.env.firebaseAdmin = firebaseAdminApp;
	await next();
});

const posthogServerMiddleware = createMiddleware(async (c, next) => {
	const { POSTHOG_PUBLIC_KEY } = env<{ POSTHOG_PUBLIC_KEY: string }>(c);
	// Ensure POSTHOG_PUBLIC_KEY is available
	if (!POSTHOG_PUBLIC_KEY) {
		console.error(
			"POSTHOG_PUBLIC_KEY is not set. PostHog middleware will not run.",
		);
		await next();
		return;
	}
	const posthog = new PostHog(POSTHOG_PUBLIC_KEY, {
		host: "https://eu.i.posthog.com",
	});

	// TODO: Replace 'distinct_id_of_user' with actual user identification logic
	// For example, you might get it from c.get('userId') if you have auth middleware setting it
	const distinctId = c.get("userId") || "anonymous_user"; // Fallback to anonymous if no user ID

	posthog.capture({
		distinctId: distinctId,
		event: "api_request",
		properties: {
			path: c.req.path,
			method: c.req.method,
			// Add any other relevant properties
		},
	});
	await posthog.shutdown();
	await next();
});

// Apply PostHog middleware - place it after CORS and logger, but before authMiddleware if you need userId
// app.use("*", posthogServerMiddleware);

app.onError((err, c) => {
	const { POSTHOG_PUBLIC_KEY } = env<{ POSTHOG_PUBLIC_KEY: string }>(c);
	// Ensure POSTHOG_PUBLIC_KEY is available
	if (POSTHOG_PUBLIC_KEY) {
		const posthog = new PostHog(POSTHOG_PUBLIC_KEY, {
			host: "https://eu.i.posthog.com",
		});
		// TODO: Replace 'user_distinct_id_with_err_rethrow' with actual user identification logic
		const distinctId = c.get("userId") || "anonymous_user_error"; // Fallback for error reporting

		posthog.captureException(
			new Error(err.message, { cause: err }),
			distinctId,
			{
				path: c.req.path,
				method: c.req.method,
				url: c.req.url,
				headers: c.req.header(),
				// ... other properties
			},
		);
		posthog.shutdown();
	} else {
		console.error(
			"POSTHOG_PUBLIC_KEY is not set. Error will not be reported to PostHog.",
		);
	}
	// Default Hono error handling
	console.error(`Error: ${err.message}`, err);
	return c.json(
		{
			error: "Internal Server Error",
			message: err.message,
		},
		500,
	);
});

app.get(
	"/openapi",
	openAPISpecs(app, {
		documentation: {
			info: {
				title: "Hono",
				version: "1.0.0",
				description: "API for greeting users",
			},
			servers: [
				{
					url: "http://localhost:3000",
					description: "Local server",
				},
			],
		},
	}),
);
app.get(
	"/docs",
	apiReference({
		theme: "saturn",
		spec: {
			url: "/openapi",
		},
	}),
);
app.get("/health-check", (c) => {
	return c.json({ message: "All good", status: 200 });
});
app.route("/app-versions", appVersionsRouter);
app.use("*", authMiddleware);
app.route("/documents", documentsRouter);
app.route("/document-templates", documentTemplatesRouter);

// Add environment variables to context

app.route("/auth", authRouter);
app.route("/legal-entity", legalEntityRouter);
app.route("/employees", employeesRouter);
app.route("/banks", banksRouter);
app.route("/partners", partnersRouter);
app.route("/products", productsRouter);
app.route("/docs-flutter", documentsFlutterRouter);
app.route("/fcm-token", fcmTokenRouter);
app.route("/deals", dealRouter);
app.route("/accounting", accountingRouter);

app.get("/", (c) => {
	return c.json({ message: "Hello from Hono!" });
});

const port = Number(process.env.PORT) || 3000;

// --- Server Bootstrap and Start ---
(async () => {
	console.log(`Server is running on port ${port}`);
	serve({
		fetch: app.fetch,
		port,
	});
})();
