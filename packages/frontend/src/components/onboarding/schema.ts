import { z } from "zod";

export const bankSchema = z.object({
	name: z.string().min(1, "Bank name is required"),
	bik: z.string().min(1, "BIK is required"),
	account: z.string().min(1, "Account number is required"),
});

export const employeeSchema = z.object({
	fullName: z.string().min(1, "Full name is required"),
	pfp: z.string().optional(),
	role: z.string().min(1, "Role is required"),
	address: z.string().min(1, "Address is required"),
	iin: z.string().length(12, "IIN must be 12 characters"),
	dateOfBirth: z.string().min(1, "Date of birth is required"),
	udosId: z.string().min(1, "UDOS ID is required"),
	udosDateGiven: z.string().min(1, "UDOS date is required"),
	udosWhoGives: z.string().min(1, "UDOS issuer is required"),
});

export const onboardingSchema = z.object({
	fullname: z.string().min(1, "Full name is required"),
	pfp: z.string().optional(),
	legalEntity: z.object({
		name: z.string().min(1, "Company name is required"),
		pfp: z.string().optional(),
		type: z.string().min(1, "Company type is required"),
		address: z.string().min(1, "Address is required"),
		phone: z.string().min(1, "Phone number is required"),
		oked: z.string().min(1, "OKED is required"),
		bin: z.string().length(12, "BIN must be 12 characters"),
		registrationDate: z.string().min(1, "Registration date is required"),
		ugd: z.string().min(1, "UGD is required"),
		banks: z.array(bankSchema).min(1, "At least one bank is required"),
		employees: z.array(employeeSchema),
	}),
});

export type Bank = z.infer<typeof bankSchema>;
export type Employee = z.infer<typeof employeeSchema>;
export type OnboardingData = z.infer<typeof onboardingSchema>;
