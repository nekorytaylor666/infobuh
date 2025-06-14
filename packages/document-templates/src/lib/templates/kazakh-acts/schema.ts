import { z } from "zod";

// Input schema for act items
export const actItemSchema = z.object({
	name: z.string().min(1, "Name is required"),
	quantity: z.number().positive("Quantity must be positive"),
	unit: z.string().min(1, "Unit is required"),
	price: z.number().positive("Price must be positive"),
});

export const bankSchema = z.object({
	name: z.string().optional(),
	account: z.string().optional(),
	bik: z.string().optional(),
});

// Input schema for generating Kazakh act of completed works
export const kazakhActInputSchema = z.object({
	orgName: z.string(),
	orgAddress: z.string(),
	orgBin: z.string(),
	buyerName: z.string(),
	buyerBin: z.string(),
	buyerAddress: z.string().optional(),
	contractNumber: z.string(),
	contractDate: z.date().optional(),
	orgPersonName: z.string().optional().nullable(),
	orgPersonRole: z.string(),
	buyerPersonName: z.string().optional().nullable(),
	buyerPersonRole: z.string(),
	phone: z.string().optional(),
	selectedBank: bankSchema.optional(),
	items: z.array(actItemSchema).min(1, "At least one item is required"),
	actNumber: z.string(), // idx
	actDate: z.date(),
	dateOfCompletion: z.date(),
	sellerImage: z.string().optional(),
	kbe: z.string().optional(),
	executorName: z.string().optional().nullable(),
	executorPosition: z.string().optional(),
	customerName: z.string().optional().nullable(),
	customerPosition: z.string().optional(),
});

// Infer types from schemas
export type KazakhActInput = z.infer<typeof kazakhActInputSchema>;
export type ActItem = z.infer<typeof actItemSchema>;
