import { z } from "zod";

// Input schema for act items
export const actItemSchema = z.object({
	description: z.string().min(1, "Description is required"),
	quantity: z.number().positive("Quantity must be positive"),
	unit: z.string().min(1, "Unit is required"),
	price: z.number().positive("Price must be positive"),
});

// Input schema for generating Kazakh act of completed works
export const kazakhActInputSchema = z.object({
	sellerLegalEntityId: z.string().uuid("Invalid seller legal entity ID"),
	clientLegalEntityId: z.string().uuid("Invalid client legal entity ID"),
	actNumber: z.string().min(1, "Act number is required"),
	actDate: z.date(),
	contractNumber: z.string().min(1, "Contract number is required"),
	contractDate: z.date().optional(),
	items: z.array(actItemSchema).min(1, "At least one item is required"),
	executorEmployeeId: z
		.string()
		.uuid("Invalid executor employee ID")
		.optional()
		.nullable(),
	customerEmployeeId: z
		.string()
		.uuid("Invalid customer employee ID")
		.optional()
		.nullable(),
	contactPhone: z.string().optional(),
	dateOfCompletion: z.date(),
});

// Infer types from schemas
export type KazakhActInput = z.infer<typeof kazakhActInputSchema>;
export type ActItem = z.infer<typeof actItemSchema>;
