import { z } from "zod";

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
});

export type OnboardingData = z.infer<typeof onboardingSchema>;
