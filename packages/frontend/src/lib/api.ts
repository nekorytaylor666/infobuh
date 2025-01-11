const API_URL = import.meta.env.VITE_API_URL;

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
	const response = await fetch(`${API_URL}/auth/onboarding/status/${userId}`, {
		credentials: "include",
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to get onboarding status");
	}

	return response.json();
}

export async function submitOnboarding(data: OnboardingData) {
	const response = await fetch(`${API_URL}/auth/onboarding`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
		credentials: "include",
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to complete onboarding");
	}

	return response.json();
}
