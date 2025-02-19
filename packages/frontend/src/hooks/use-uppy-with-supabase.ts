import { useState, useEffect } from "react";
import Uppy from "@uppy/core";
import Tus from "@uppy/tus";
import { createClient } from "@supabase/supabase-js";

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

	useEffect(() => {
		const initializeUppy = async () => {
			const {
				data: { session },
			} = await supabase.auth.getSession();

			const tusId = `Tus-${Math.random().toString(36).substring(7)}`;
			uppy.use(Tus, {
				id: tusId,
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

			uppy.on("file-added", (file) => {
				file.meta = {
					...file.meta,
					bucketName,
					objectName: file.name,
					contentType: file.type,
				};
				console.log("File added:", file);
			});
		};

		initializeUppy();

		return () => {
			try {
				const plugin = uppy.getPlugin("Tus");
				if (plugin) {
					uppy.removePlugin(plugin);
				}
			} catch (error) {
				console.warn("Error removing Tus plugin:", error);
			}
		};
	}, [uppy, bucketName, supabaseUrl, supabaseAnonKey, supabase]);

	return uppy;
};
