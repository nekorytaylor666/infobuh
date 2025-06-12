import { z } from "zod";

// Input schema for waybill items
export const waybillItemSchema = z.object({
	description: z.string().min(1, "Description is required"),
	quantity: z.number().positive("Quantity must be positive"),
	unit: z.string().min(1, "Unit is required"),
	price: z.number().positive("Price must be positive"),
	nomenclatureCode: z.string().optional(),
});

// Input schema for generating Kazakh waybill
export const kazakhWaybillInputSchema = z.object({
	sellerLegalEntityId: z.string().uuid("Invalid seller legal entity ID"),
	clientLegalEntityId: z.string().uuid("Invalid client legal entity ID"),
	waybillNumber: z.string().min(1, "Waybill number is required"),
	waybillDate: z.date(),
	contractNumber: z.string().min(1, "Contract number is required").optional(),
	contractDate: z.date().optional(),
	items: z.array(waybillItemSchema).min(1, "At least one item is required"),
	senderEmployeeId: z
		.string()
		.uuid("Invalid sender employee ID")
		.optional()
		.nullable(),
	receiverEmployeeId: z
		.string()
		.uuid("Invalid receiver employee ID")
		.optional()
		.nullable(),
	releaserEmployeeId: z
		.string()
		.uuid("Invalid releaser employee ID")
		.optional()
		.nullable(),
	transportOrgName: z.string().optional(),
	transportResponsiblePerson: z.string().optional(),
	contactPhone: z.string().optional(),
});

// Infer types from schemas
export type KazakhWaybillInput = z.infer<typeof kazakhWaybillInputSchema>;
export type WaybillItem = z.infer<typeof waybillItemSchema>;
