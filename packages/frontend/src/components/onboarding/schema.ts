import { z } from "zod";

const BankSchema = z.object({
	name: z.string().min(1, "Bank name is required"),
	bik: z.string().min(1, "BIK is required"),
	account: z.string().min(1, "Account number is required"),
});

const EmployeeSchema = z.object({
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
	name: z.string().min(1, "Full name is required"),
	image: z.string().optional(),
	legalEntity: z.object({
		name: z.string().min(1, "Company name is required"),
		image: z.string().optional(),
		type: z.string().min(1, "Company type is required"),
		address: z.string().min(1, "Address is required"),
		phone: z.string().min(1, "Phone number is required"),
		oked: z.string().min(1, "OKED code is required"),
		bin: z.string().length(12, "BIN must be 12 characters"),
		registrationDate: z.string().min(1, "Registration date is required"),
		ugd: z.string().min(1, "UGD code is required"),
	}),
	banks: z.array(BankSchema).optional().default([]),
	employees: z.array(EmployeeSchema).optional().default([]),
});

export type OnboardingData = z.infer<typeof onboardingSchema>;
export type Bank = z.infer<typeof BankSchema>;
export type Employee = z.infer<typeof EmployeeSchema>;
