import { z } from "zod";

// Define schema for an invoice document
export const invoiceSchema = z.object({
	invoiceNumber: z.string().min(1, "Invoice number is required"),
	date: z.string().min(1, "Date is required"),
	dueDate: z.string().min(1, "Due date is required"),

	// Company information (seller)
	company: z.object({
		name: z.string().min(1, "Company name is required"),
		address: z.string().min(1, "Company address is required"),
		city: z.string().optional(),
		postalCode: z.string().optional(),
		phone: z.string().optional(),
		email: z.string().email("Invalid email format").optional(),
		website: z.string().url("Invalid URL format").optional(),
		taxId: z.string().optional(),
	}),

	// Client information
	client: z.object({
		name: z.string().min(1, "Client name is required"),
		address: z.string().min(1, "Client address is required"),
		city: z.string().optional(),
		postalCode: z.string().optional(),
		phone: z.string().optional(),
		email: z.string().email("Invalid email format").optional(),
		taxId: z.string().optional(),
	}),

	// Invoice items
	items: z
		.array(
			z.object({
				description: z.string().min(1, "Item description is required"),
				quantity: z.number().positive("Quantity must be positive"),
				unitPrice: z.number().nonnegative("Unit price must be non-negative"),
				taxRate: z.number().min(0).max(100).default(0),
				discount: z.number().min(0).max(100).default(0),
			}),
		)
		.min(1, "At least one item is required"),

	// Payment information
	payment: z.object({
		method: z.enum(["bank_transfer", "card", "cash", "other"]),
		bankAccount: z.string().optional(),
		bankName: z.string().optional(),
		swift: z.string().optional(),
		notes: z.string().optional(),
	}),

	// Additional fields
	currency: z.string().min(1, "Currency is required"),
	notes: z.string().optional(),
	terms: z.string().optional(),
});

// Export as string to store in database
export const invoiceSchemaString = invoiceSchema.toString();

// PDF Template for invoice - this defines the layout for React PDF
export const invoicePdfTemplate = {
	documentTitle: "Invoice",
	layout: {
		sections: [
			{
				type: "header",
				components: [
					{
						type: "text",
						content: "INVOICE",
						style: {
							fontSize: 24,
							fontWeight: "bold",
							textAlign: "right",
							marginBottom: 10,
						},
					},
					{
						type: "grid",
						columns: 2,
						components: [
							{
								type: "stack",
								components: [
									{
										type: "text",
										fieldPath: "company.name",
										style: { fontWeight: "bold", fontSize: 14 },
									},
									{ type: "text", fieldPath: "company.address" },
									{
										type: "text",
										template: "{{company.city}}, {{company.postalCode}}",
									},
									{ type: "text", fieldPath: "company.phone" },
									{ type: "text", fieldPath: "company.email" },
									{
										type: "text",
										fieldPath: "company.taxId",
										label: "Tax ID:",
									},
								],
							},
							{
								type: "stack",
								style: { textAlign: "right" },
								components: [
									{
										type: "text",
										template: "Invoice #: {{invoiceNumber}}",
										style: { fontWeight: "bold" },
									},
									{ type: "text", template: "Date: {{date}}" },
									{ type: "text", template: "Due Date: {{dueDate}}" },
								],
							},
						],
					},
				],
			},
			{
				type: "section",
				title: "Bill To",
				components: [
					{
						type: "stack",
						components: [
							{
								type: "text",
								fieldPath: "client.name",
								style: { fontWeight: "bold" },
							},
							{ type: "text", fieldPath: "client.address" },
							{
								type: "text",
								template: "{{client.city}}, {{client.postalCode}}",
							},
							{ type: "text", fieldPath: "client.phone" },
							{ type: "text", fieldPath: "client.email" },
							{ type: "text", fieldPath: "client.taxId", label: "Tax ID:" },
						],
					},
				],
			},
			{
				type: "section",
				title: "Items",
				components: [
					{
						type: "table",
						fieldPath: "items",
						columns: [
							{ header: "Description", fieldPath: "description", width: "40%" },
							{
								header: "Quantity",
								fieldPath: "quantity",
								width: "15%",
								align: "right",
							},
							{
								header: "Unit Price",
								fieldPath: "unitPrice",
								width: "15%",
								align: "right",
								format: "currency",
							},
							{
								header: "Tax Rate",
								fieldPath: "taxRate",
								width: "15%",
								align: "right",
								format: "percent",
							},
							{
								header: "Total",
								calculate:
									"{{item.quantity * item.unitPrice * (1 + item.taxRate/100)}}",
								width: "15%",
								align: "right",
								format: "currency",
							},
						],
						summaries: [
							{
								label: "Subtotal",
								calculate:
									"{{sum(items.map(item => item.quantity * item.unitPrice))}}",
								format: "currency",
							},
							{
								label: "Tax",
								calculate:
									"{{sum(items.map(item => item.quantity * item.unitPrice * (item.taxRate/100)))}}",
								format: "currency",
							},
							{
								label: "Total",
								calculate:
									"{{sum(items.map(item => item.quantity * item.unitPrice * (1 + item.taxRate/100)))}}",
								format: "currency",
								style: { fontWeight: "bold" },
							},
						],
					},
				],
			},
			{
				type: "section",
				title: "Payment Information",
				components: [
					{
						type: "stack",
						components: [
							{ type: "text", template: "Payment Method: {{payment.method}}" },
							{ type: "text", template: "Bank Name: {{payment.bankName}}" },
							{
								type: "text",
								template: "Bank Account: {{payment.bankAccount}}",
							},
							{ type: "text", template: "SWIFT: {{payment.swift}}" },
						],
					},
				],
			},
			{
				type: "section",
				components: [
					{
						type: "stack",
						components: [
							{ type: "text", fieldPath: "notes", label: "Notes:" },
							{
								type: "text",
								fieldPath: "terms",
								label: "Terms & Conditions:",
							},
						],
					},
				],
			},
			{
				type: "footer",
				components: [
					{
						type: "text",
						content: "Thank you for your business!",
						style: { textAlign: "center", marginTop: 20 },
					},
				],
			},
		],
	},
};
