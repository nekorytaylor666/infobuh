import { z } from "zod";

// Input schema for invoice items
export const invoiceItemSchema = z.object({
	description: z.string().min(1, "Description is required"),
	quantity: z.number().positive("Quantity must be positive"),
	unit: z.string().min(1, "Unit is required"),
	price: z.number().positive("Price must be positive"),
});

// Input schema for generating Kazakh invoice
export const kazakhInvoiceInputSchema = z.object({
	sellerLegalEntityId: z.string().uuid("Invalid seller legal entity ID"),
	clientLegalEntityId: z.string().uuid("Invalid client legal entity ID"),
	invoiceNumber: z.string().min(1, "Invoice number is required"),
	invoiceDate: z.string(),
	contractNumber: z.string().min(1, "Contract number is required"),
	contractDate: z.string().optional(),
	items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
	executorEmployeeId: z
		.string()
		.uuid("Invalid executor employee ID")
		.optional()
		.nullable(),
	contactPhone: z.string().optional(),
});

// Infer types from schemas
export type KazakhInvoiceInput = z.infer<typeof kazakhInvoiceInputSchema>;
export type InvoiceItem = z.infer<typeof invoiceItemSchema>;
