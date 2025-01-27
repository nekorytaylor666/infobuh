import { getLegalEntity } from "@/lib/api";

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
		const response = await getLegalEntity();
		return response;
	},
};
