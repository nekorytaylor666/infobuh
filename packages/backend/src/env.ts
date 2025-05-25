import type { Database } from "@accounting-kz/db";
import type { supabase } from "./lib/supabase";
import type { App as FirebaseApp } from "firebase-admin/app";

export type HonoEnv = {
	Bindings: {
		DATABASE_URL: string;
		supabase: typeof supabase;
		db: Database;
		firebaseAdmin: FirebaseApp;
		POSTHOG_PUBLIC_KEY: string;
	};
	Variables: {
		userId: string; // Added userId
	};
};
