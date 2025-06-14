import { z } from "zod";

// Input schema for waybill items
export const waybillItemSchema = z.object({
	name: z.string().min(1, "Name is required"),
	quantity: z.number().positive("Quantity must be positive"),
	unit: z.string().min(1, "Unit is required"),
	price: z.number().positive("Price must be positive"),
	nomenclatureCode: z.string().optional(),
});

export const bankSchema = z.object({
	name: z.string().optional(),
	account: z.string().optional(),
	bik: z.string().optional(),
});

// Input schema for generating Kazakh waybill
export const kazakhWaybillInputSchema = z.object({
	orgName: z.string(),
	orgAddress: z.string().optional(),
	orgBin: z.string(),
	buyerName: z.string(),
	buyerBin: z.string(),
	orgPersonName: z.string().optional().nullable(),
	orgPersonRole: z.string().optional(),
	buyerPersonName: z.string().optional().nullable(),
	buyerPersonRole: z.string().optional(),
	phone: z.string().optional(),
	selectedBank: bankSchema.optional(),
	items: z.array(waybillItemSchema).min(1, "At least one item is required"),
	waybillNumber: z.string(), // idx
	waybillDate: z.date(),
	contractNumber: z.string().min(1, "Contract number is required").optional(),
	contractDate: z.date().optional(),
	senderEmployeeId: z.string().uuid().optional().nullable(),
	receiverEmployeeId: z.string().uuid().optional().nullable(),
	releaserEmployeeId: z.string().uuid().optional().nullable(),
	transportOrgName: z.string().optional(),
	transportResponsiblePerson: z.string().optional(),
});

// Infer types from schemas
export type KazakhWaybillInput = z.infer<typeof kazakhWaybillInputSchema>;
export type WaybillItem = z.infer<typeof waybillItemSchema>;
