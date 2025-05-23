import type { Config } from "drizzle-kit";
import { config as loadEnv } from "dotenv";
loadEnv();

export default {
	schema: "./src/schema",
	schemaFilter: ["public"],
	out: "./src/migrations",
	dialect: "postgresql",
	dbCredentials: {
		// biome-ignore lint/style/noNonNullAssertion: env variables are set in .env
		url: process.env.DATABASE_URL!,
	},
} satisfies Config;
