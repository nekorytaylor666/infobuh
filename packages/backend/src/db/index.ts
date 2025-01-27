import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import type { Context } from "hono";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

export type HonoEnv = {
	Bindings: {
		DATABASE_URL: string;
		db: PostgresJsDatabase<typeof schema>;
	};
};

export const createDbClient = (url: string) => {
	const client = postgres(url, { prepare: false });
	return drizzle(client, { schema });
};
