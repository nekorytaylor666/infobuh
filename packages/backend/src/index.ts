import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { db } from "./db";
import { openAPISpecs } from "hono-openapi";
import authRouter from "./routes/auth";
import { apiReference } from "@scalar/hono-api-reference";

const app = new Hono();

app.use("*", logger());
app.use("*", cors());
app.route("/auth", authRouter);

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
