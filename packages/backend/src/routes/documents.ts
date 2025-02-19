import { Hono } from "hono";
import type { HonoEnv } from "../db";

export const documentsRouter = new Hono<HonoEnv>();

documentsRouter.get("/", (c) => {
	return c.json({ message: "Hello from documents" });
});

documentsRouter.post("/", async (c) => {
	const body = await c.req.parseBody();
	console.log(body.file); // File | string

	const file = body.file as File;

	const fileBuffer = await file.arrayBuffer();
	const fileString = Buffer.from(fileBuffer).toString("base64");
	const { data, error } = await c.env.supabase.storage
		.from("documents")
		.upload(`${file.name}`, fileString);

	console.log(data);

	return c.json({ message: "Hello from documents" });
});
