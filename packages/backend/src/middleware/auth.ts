import { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { createClient } from "@supabase/supabase-js";
import { env } from "hono/adapter";

export async function authMiddleware(c: Context, next: Next) {
	// if (process.env.NODE_ENV === "development") {
	// 	await next();
	// 	return;
	// }
	const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env<{
		SUPABASE_URL: string;
		SUPABASE_SERVICE_ROLE_KEY: string;
	}>(c);

	if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
		throw new Error("Missing Supabase environment variables");
	}

	const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});

	const authHeader = c.req.header("Authorization");

	if (!authHeader) {
		throw new HTTPException(401, { message: "No authorization header" });
	}

	const token = authHeader.replace("Bearer ", "");
	console.log(token);
	try {
		const {
			data: { user },
			error,
		} = await supabase.auth.getUser(token);
		console.log(user, error);
		if (error || !user) {
			console.error("Auth error:", error);
			throw new HTTPException(401, { message: "Invalid token" });
		}

		// Add user data to context
		c.set("user", user);
		c.set("userId", user.id);

		await next();
	} catch (error) {
		console.error("Auth middleware error:", error);
		if (error instanceof HTTPException) {
			throw error;
		}
		throw new HTTPException(401, { message: "Invalid token" });
	}
}
