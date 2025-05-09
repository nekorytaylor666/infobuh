import type { Config } from "drizzle-kit";

export default {
	schema: "./src/db/schema.ts",
	schemaFilter: ["public"],
	out: "./src/db/migrations",
	dialect: "postgresql",
	dbCredentials: {
		// biome-ignore lint/style/noNonNullAssertion: env variables are set in .env
		url: process.env.DATABASE_URL!,
	},
} satisfies Config;
