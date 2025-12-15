import { useQuery } from "@tanstack/react-query";
import { legalEntityService } from "@/services/legal-entity";
import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";

export function useLegalEntity() {
	const { data: legalEntity, isLoading } = useQuery({
		queryKey: ["legalEntity"],
		queryFn: async () => {
			// Check if user is authenticated before making the request
			const { data: { session } } = await supabase.auth.getSession();
			if (!session) {
				return null;
			}
			return legalEntityService.getCurrent();
		},
		// Only run query when there's a potential session
		retry: false,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});

	return {
		legalEntity,
		isLoading,
	};
}
