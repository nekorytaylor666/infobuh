import { config } from "dotenv";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { openAPISpecs } from "hono-openapi";
import authRouter from "./routes/auth";
import legalEntityRouter from "./routes/legal-entity";
import { apiReference } from "@scalar/hono-api-reference";
import { createDbClient, type HonoEnv } from "./db";
import { authMiddleware } from "./middleware/auth";

// Load environment variables
config({ path: ".env" });

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL is not set");
}

// Create database client
const dbClient = createDbClient(process.env.DATABASE_URL);

const app = new Hono<HonoEnv>();

// app.use("*", logger());
app.use("*", cors());

app.use("*", authMiddleware);
// Add environment variables to context
app.use("*", async (c, next) => {
	c.env.DATABASE_URL = process.env.DATABASE_URL as string;
	c.env.db = dbClient;
	await next();
});

app.route("/auth", authRouter);
app.route("/legal-entity", legalEntityRouter);

app.get("/", (c) => {
	return c.json({ message: "Hello from Hono!" });
});

const port = Number(process.env.PORT) || 3000;
console.log(`Server is running on port ${port}`);

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
serve({
	fetch: app.fetch,
	port,
});
