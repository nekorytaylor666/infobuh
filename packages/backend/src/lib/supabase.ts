import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
config();

// biome-ignore lint/style/noNonNullAssertion: env variables are set in .env
const supabaseUrl = process.env.SUPABASE_URL!;
// biome-ignore lint/style/noNonNullAssertion: env variables are set in .env
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const supabaseStorage = supabase.storage;
