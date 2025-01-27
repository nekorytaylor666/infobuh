import { useQuery } from "@tanstack/react-query";
import { legalEntityService } from "@/services/legal-entity";

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
