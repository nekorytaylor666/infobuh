/**
 * Sample invoice data that matches the invoice schema and can be used for testing
 */
export const sampleInvoiceData = {
	invoiceNumber: "INV-2023-001",
	date: "2023-05-15",
	dueDate: "2023-06-15",

	company: {
		name: "Astana Tech Solutions",
		address: "123 Kunayev Street",
		city: "Astana",
		postalCode: "010000",
		phone: "+7 (717) 123-4567",
		email: "billing@astanatech.kz",
		website: "https://www.astanatech.kz",
		taxId: "BIN 123456789012",
	},

	client: {
		name: "Almaty Digital Services",
		address: "456 Abay Avenue",
		city: "Almaty",
		postalCode: "050000",
		phone: "+7 (727) 987-6543",
		email: "finance@almatydigital.kz",
		taxId: "BIN 987654321098",
	},

	items: [
		{
			description: "Web Application Development",
			quantity: 1,
			unitPrice: 500000,
			taxRate: 12,
			discount: 0,
		},
		{
			description: "UI/UX Design Services",
			quantity: 1,
			unitPrice: 250000,
			taxRate: 12,
			discount: 0,
		},
		{
			description: "Server Maintenance (Monthly)",
			quantity: 3,
			unitPrice: 75000,
			taxRate: 12,
			discount: 5,
		},
	],

	payment: {
		method: "bank_transfer",
		bankName: "Kaspi Bank",
		bankAccount: "KZ123456789012345678",
		swift: "CASPKZKA",
		notes: "Please include invoice number in the payment reference",
	},

	currency: "KZT",
	notes:
		"Thank you for your business. All amounts are in Kazakhstani Tenge (KZT).",
	terms:
		"Payment is due within 30 days. Late payments may be subject to a 2% monthly fee.",
};
