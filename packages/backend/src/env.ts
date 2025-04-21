import type { Database } from "@accounting-kz/db";
import type { supabase } from "./lib/supabase";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

export type HonoEnv = {
	Bindings: {
		DATABASE_URL: string;
		db: Database;
		supabase: typeof supabase;
	};
	Variables: {
		db: PostgresJsDatabase;
	};
};
