import type { Database } from "@accounting-kz/db";
import type { supabase } from "./lib/supabase";

export type HonoEnv = {
	Bindings: {
		DATABASE_URL: string;
		supabase: typeof supabase;
		db: Database;
	};
	Variables: {
		userId: string; // Added userId
	};
};
