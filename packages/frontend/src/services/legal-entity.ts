import { api } from "@/lib/api";

export interface Bank {
	id: string;
	name: string;
	bik: string;
	account: string;
}

export interface LegalEntity {
	id: string;
	name: string;
	type: string;
	bin: string;
	address: string;
	phone: string;
	oked: string;
	registrationDate: string;
	ugd: string;
	banks: Bank[];
}

export const legalEntityService = {
	getCurrent: async () => {
		const response = await api.get<LegalEntity>("/legal-entity/current");
		return response.data;
	},
};
