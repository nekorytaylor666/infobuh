import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import path from "path";
import { analyzer } from "vite-bundle-analyzer";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		TanStackRouterVite({ autoCodeSplitting: true }),
		react({
			babel: {
				plugins: [["babel-plugin-react-compiler"]],
			},
		}),
		analyzer(),
	],

	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src"),
			"@backend": path.resolve(__dirname, "../backend/src"),
		},
	},
	server: {
		proxy: {
			"/api": "http://localhost:3000",
		},
	},
});
