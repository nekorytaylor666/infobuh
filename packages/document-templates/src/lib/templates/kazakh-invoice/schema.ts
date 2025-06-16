import { z } from "zod";

// Input schema for invoice items
export const invoiceItemSchema = z.object({
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

// Input schema for generating Kazakh invoice (Счет на оплату)
export const kazakhInvoiceInputSchema = z.object({
	orgName: z.string(),
	orgAddress: z.string().optional(),
	orgBin: z.string(),
	orgIik: z.string().optional(),
	orgBik: z.string().optional(),
	buyerName: z.string(),
	buyerBin: z.string(),
	codeKnp: z.string().optional(),
	contract: z.string(),
	orgPersonName: z.string().optional().nullable(),
	phone: z.string().optional(),
	selectedBank: bankSchema.optional(),
	items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
	invoiceNumber: z.string(), // idx
	invoiceDate: z.string(),
	contractDate: z.string().optional(),
	executorEmployeeId: z.string().uuid().optional().nullable(),
});

// Infer types from schemas
export type KazakhInvoiceInput = z.infer<typeof kazakhInvoiceInputSchema>;
export type InvoiceItem = z.infer<typeof invoiceItemSchema>;
