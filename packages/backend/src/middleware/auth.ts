import { Context } from "hono";
import { supabase } from "../lib/supabase";

export async function authMiddleware(c: Context, next: () => Promise<void>) {
	const authHeader = c.req.header("Authorization");

	if (!authHeader) {
		return c.json({ error: "No authorization header" }, 401);
	}

	const token = authHeader.replace("Bearer ", "");

	const {
		data: { user },
		error,
	} = await supabase.auth.getUser(token);

	if (error || !user) {
		return c.json({ error: "Invalid token" }, 401);
	}

	c.set("user", user);
	await next();
}
