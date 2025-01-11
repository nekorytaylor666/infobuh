import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { db } from "./db";

const app = new Hono();

app.use("*", logger());
app.use("*", cors());

app.get("/", (c) => {
	return c.json({ message: "Hello from Hono!" });
});

const port = Number(process.env.PORT) || 3000;
console.log(`Server is running on port ${port}`);

serve({
	fetch: app.fetch,
	port,
});
