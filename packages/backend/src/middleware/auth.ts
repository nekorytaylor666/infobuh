import { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function authMiddleware(c: Context, next: Next) {
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
