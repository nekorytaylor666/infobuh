import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@accounting-kz/db";
import type { Context } from "hono";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { supabase } from "../lib/supabase";

export type Database = PostgresJsDatabase<typeof schema>;

export const createDbClient = (url: string) => {
	const client = postgres(url, { prepare: false });
	return drizzle(client, { schema });
};
