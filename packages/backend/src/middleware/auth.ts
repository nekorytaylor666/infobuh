import { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { createClient } from "@supabase/supabase-js";
import { env } from "hono/adapter";

export async function authMiddleware(c: Context, next: Next) {
	console.log(env(c));
	const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env(c);
	console.log(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
	const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

	const authHeader = c.req.header("Authorization");

	if (!authHeader) {
		throw new HTTPException(401, { message: "No authorization header" });
	}

	const token = authHeader.replace("Bearer ", "");

	try {
		const {
			data: { user },
			error,
		} = await supabase.auth.getUser(token);

		if (error || !user) {
			throw new HTTPException(401, { message: "Invalid token" });
		}

		console.log(user);
		// Add user ID to context
		c.set("userId", user.id);

		await next();
	} catch (error) {
		if (error instanceof HTTPException) {
			throw error;
		}
		throw new HTTPException(401, { message: "Invalid token" });
	}
}
