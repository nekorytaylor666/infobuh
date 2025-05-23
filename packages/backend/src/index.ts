import { config } from "dotenv";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { openAPISpecs } from "hono-openapi";
import authRouter from "./routes/auth";
import legalEntityRouter from "./routes/legal-entity";
import employeesRouter from "./routes/employees";
import banksRouter from "./routes/banks";
import partnersRouter from "./routes/partners";
import productsRouter from "./routes/products";
import fcmTokenRouter from "./routes/fcm-token";
import { apiReference } from "@scalar/hono-api-reference";
import { authMiddleware } from "./middleware/auth";
import { documentsRouter } from "./routes/documents";
import { documentsFlutterRouter } from "./routes/documents_flutter";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import { documentTemplatesRouter } from "./routes/document-templates";
import { initializeBinData, findEntity } from "@accounting-kz/bin-verifier";
import { prettyJSON } from "hono/pretty-json";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "hono/adapter";
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

const app = new Hono<HonoEnv>();

app.use("*", logger());
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
	c.env.db = dbClient;
	c.env.supabase = supabase;
	c.env.firebaseAdmin = firebaseAdminApp;
	await next();
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
