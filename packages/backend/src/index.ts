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
import { apiReference } from "@scalar/hono-api-reference";
import { authMiddleware } from "./middleware/auth";
import { documentsRouter } from "./routes/documents";
import { contractsRouter } from "./routes/contracts";
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
		origin: ["http://localhost:3000", "http://localhost:3001"],
		credentials: true,
	}),
);

// Create database connection
if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL environment variable is not set.");
}
const client = postgres(process.env.DATABASE_URL);
app.use("*", async (c, next) => {
	c.set("db", drizzle(client));
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
app.use("*", async (c, next) => {
	await next();
});
app.route("/documents", documentsRouter);
app.route("/document-templates", documentTemplatesRouter);

// Check for required environment variables
const binDataCsvUrl = process.env.BIN_DATA_CSV_URL;
if (!binDataCsvUrl) {
	throw new Error("BIN_DATA_CSV_URL environment variable is not set.");
}

// Bin verifier route (ensure it uses the imported findEntity)
app.get("/verify-bin", (c) => {
	const query = c.req.query("q");
	if (!query) {
		return c.json({ error: "Query parameter 'q' is required" }, 400);
	}
	// findEntity now handles the initialization check internally
	const entity = findEntity(query);
	if (!entity) {
		// Consider differentiating between "not found" and "not initialized", though findEntity logs a warning if not initialized.
		return c.json({ error: "Entity not found or verifier not ready" }, 404);
	}
	return c.json(entity);
});

app.use("*", authMiddleware);
// Add environment variables to context

app.route("/auth", authRouter);
app.route("/legal-entity", legalEntityRouter);
app.route("/employees", employeesRouter);
app.route("/banks", banksRouter);
app.route("/partners", partnersRouter);
app.route("/products", productsRouter);
app.route("/contracts", contractsRouter);
app.route("/docs-flutter", documentsFlutterRouter);
app.get("/", (c) => {
	return c.json({ message: "Hello from Hono!" });
});
app.get("/health-check", (c) => {
	return c.json({ message: "All good", status: 200 });
});

const port = Number(process.env.PORT) || 3000;

// --- Server Bootstrap and Start ---

// Pass the validated URL to bootstrap
async function bootstrap(csvUrl: string) {
	try {
		console.log("Starting application bootstrap...");
		// Initialize Bin Verifier
		await initializeBinData(csvUrl); // Use the argument
		console.log("Application bootstrap completed successfully.");
	} catch (error) {
		console.error("Application bootstrap failed:", error);
		process.exit(1); // Exit if critical initialization fails
	}
}

(async () => {
	// Pass the validated URL here
	await bootstrap(binDataCsvUrl);

	console.log(`Server is running on port ${port}`);
	serve({
		fetch: app.fetch,
		port,
	});
})();
