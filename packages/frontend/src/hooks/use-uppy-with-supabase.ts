import { useState, useEffect, useRef } from "react";
import Uppy from "@uppy/core";
import Tus from "@uppy/tus";
import { createClient } from "@supabase/supabase-js";
import type { UppyFile } from "@uppy/core";

interface UseUppyWithSupabaseOptions {
	bucketName: string;
	supabaseUrl: string;
	supabaseAnonKey: string;
}

export const useUppyWithSupabase = ({
	bucketName,
	supabaseUrl,
	supabaseAnonKey,
}: UseUppyWithSupabaseOptions) => {
	const [uppy] = useState(() => new Uppy());
	const supabase = createClient(supabaseUrl, supabaseAnonKey);
	const tusPluginId = useRef(`Tus-${Math.random().toString(36).substring(7)}`);

	useEffect(() => {
		const initializeUppy = async () => {
			const {
				data: { session },
			} = await supabase.auth.getSession();

			uppy.use(Tus, {
				id: tusPluginId.current,
				endpoint: `${supabaseUrl}/storage/v1/upload/resumable`,
				retryDelays: [0, 3000, 5000, 10000, 20000],
				headers: {
					authorization: `Bearer ${session?.access_token}`,
					apikey: supabaseAnonKey,
				},
				uploadDataDuringCreation: true,
				removeFingerprintOnSuccess: true,
				chunkSize: 6 * 1024 * 1024,
				allowedMetaFields: [
					"bucketName",
					"objectName",
					"contentType",
					"cacheControl",
				],
				onError: (error) => console.error("Upload error:", error),
			});

			const handleFileAdded = (
				file: UppyFile<Record<string, unknown>, Record<string, unknown>>,
			) => {
				file.meta = {
					...file.meta,
					bucketName,
					objectName: file.name,
					contentType: file.type,
				};
			};

			uppy.on("file-added", handleFileAdded);

			return () => {
				uppy.off("file-added", handleFileAdded);
			};
		};

		const cleanup = initializeUppy();

		return () => {
			cleanup.then(() => {
				try {
					const plugin = uppy.getPlugin(tusPluginId.current);
					if (plugin) {
						uppy.removePlugin(plugin);
					}
				} catch (error) {
					console.warn("Error removing Tus plugin:", error);
				}
			});
		};
	}, [uppy, bucketName, supabaseUrl, supabaseAnonKey, supabase]);

	return uppy;
};
