import { useQuery } from "@tanstack/react-query";
import { legalEntityService } from "@/services/legal-entity";
import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";

export function useLegalEntity() {
	const { data: legalEntity, isLoading } = useQuery({
		queryKey: ["legalEntity"],
		queryFn: () => legalEntityService.getCurrent(),
	});

	return {
		legalEntity,
		isLoading,
	};
}
