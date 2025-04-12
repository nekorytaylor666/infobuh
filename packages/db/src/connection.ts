import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

export type Database = PostgresJsDatabase<typeof schema>;
export const createDbClient = (url: string) => {
	const client = postgres(url, { prepare: false });
	return drizzle(client, { schema });
};
