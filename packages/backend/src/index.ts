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
import { apiReference } from "@scalar/hono-api-reference";
import { createDbClient, type HonoEnv } from "./db";
import { authMiddleware } from "./middleware/auth";
import { documentsRouter } from "./routes/documents";
import { documentsFlutterRouter } from "./routes/documents_flutter";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";

import { prettyJSON } from "hono/pretty-json";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "hono/adapter";

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
		origin: ["http://localhost:3000", "http://localhost:3002"],
		credentials: true,
	}),
);

// Create database connection
const client = postgres(env.DATABASE_URL);
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
	c.env.DATABASE_URL = process.env.DATABASE_URL as string;
	c.env.db = dbClient;
	c.env.supabase = supabase;

	await next();
});
app.route("/documents", documentsRouter);

app.use("*", authMiddleware);
// Add environment variables to context

app.route("/auth", authRouter);
app.route("/legal-entity", legalEntityRouter);
app.route("/employees", employeesRouter);
app.route("/banks", banksRouter);
app.route("/docs-flutter", documentsFlutterRouter);
app.get("/", (c) => {
	return c.json({ message: "Hello from Hono!" });
});

const port = Number(process.env.PORT) || 3000;
console.log(`Server is running on port ${port}`);

serve({
	fetch: app.fetch,
	port,
});
