import { z } from "zod";

const BankSchema = z.object({
	name: z.string().min(1, "Введите название банка"),
	bik: z.string().min(1, "Введите БИК"),
	account: z.string().min(1, "Введите номер счета"),
});

const EmployeeSchema = z.object({
	fullName: z.string().min(1, "Введите ФИО"),
	pfp: z.string().optional(),
	role: z.string().min(1, "Введите должность"),
	address: z.string().min(1, "Введите адрес"),
	iin: z.string().length(12, "ИИН должен содержать 12 символов"),
	dateOfBirth: z.string().min(1, "Введите дату рождения"),
	udosId: z.string().min(1, "Введите номер удостоверения"),
	udosDateGiven: z.string().min(1, "Введите дату выдачи"),
	udosWhoGives: z.string().min(1, "Введите кем выдано"),
});

export const onboardingSchema = z.object({
	name: z.string().min(1, "Введите ФИО"),
	image: z.string().optional(),
	legalEntity: z.object({
		name: z.string().min(1, "Введите название компании"),
		image: z.string().optional(),
		type: z.string().min(1, "Введите тип компании"),
		address: z.string().min(1, "Введите адрес"),
		phone: z.string().min(1, "Введите номер телефона"),
		oked: z.string().min(1, "Введите код ОКЭД"),
		bin: z.string().length(12, "БИН должен содержать 12 символов"),
		registrationDate: z.string().min(1, "Введите дату регистрации"),
		ugd: z.string().min(1, "Введите код УГД"),
	}),
	banks: z.array(BankSchema).optional().default([]),
	employees: z.array(EmployeeSchema).optional().default([]),
});

export type OnboardingData = z.infer<typeof onboardingSchema>;
export type Bank = z.infer<typeof BankSchema>;
export type Employee = z.infer<typeof EmployeeSchema>;
