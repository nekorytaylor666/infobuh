import axios from "axios";
import { supabase } from "./supabase";

const API_URL = import.meta.env.VITE_API_URL;

// Create custom axios instance
export const api = axios.create({
	baseURL: API_URL,
});

// Add Supabase auth header interceptor
api.interceptors.request.use(async (config) => {
	const {
		data: { session },
		error,
	} = await supabase.auth.getSession();

	if (session?.access_token) {
		config.headers.Authorization = `Bearer ${session.access_token}`;
	}

	return config;
});

interface Bank {
	name: string;
	bik: string;
	account: string;
}

interface Employee {
	fullName: string;
	pfp?: string;
	role: string;
	address: string;
	iin: string;
	dateOfBirth: string;
	udosId: string;
	udosDateGiven: string;
	udosWhoGives: string;
}

interface OnboardingData {
	fullname: string;
	pfp?: string;
	legalEntity: {
		name: string;
		pfp?: string;
		type: string;
		address: string;
		phone: string;
		oked: string;
		bin: string;
		registrationDate: string;
		ugd: string;
		banks: Bank[];
		employees: Employee[];
	};
}

interface OnboardingStatus {
	userId: string;
	isComplete: boolean;
	currentStep: "profile" | "company" | "banks" | "employees" | "completed";
	completedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export async function getOnboardingStatus(
	userId: string,
): Promise<OnboardingStatus> {
	const response = await api.get<OnboardingStatus>(
		`/auth/onboarding/status/${userId}`,
	);
	return response.data;
}

export async function submitOnboarding(userId: string, data: OnboardingData) {
	const response = await api.post(`/auth/onboarding/${userId}`, data);
	return response.data;
}

export async function getLegalEntity() {
	const response = await api.get("/legal-entity/current");
	return response.data;
}

export async function getEmployees(legalEntityId: string) {
	const response = await api.get(`/employees/${legalEntityId}`);
	return response.data;
}
