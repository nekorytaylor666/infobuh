import { z } from "zod";

// Base product schema for all documents
export const documentProductSchema = z.object({
	name: z.string().min(1, "Product name is required"),
	description: z.string().optional(),
	quantity: z.number().positive("Quantity must be positive"),
	unit: z.string().min(1, "Unit is required"),
	price: z.number().positive("Price must be positive"),
	total: z.number().positive("Total must be positive"),
	vat: z.number().optional(),
	nomenclatureCode: z.string().optional(),
});

// АВР (Act of Completed Works) Schema
export const avrDocumentSchema = z.object({
	// Organization info
	orgName: z.string().min(1, "Organization name is required"),
	orgAddress: z.string().min(1, "Organization address is required"),
	orgBin: z.string().length(12, "BIN must be 12 characters"),
	
	// Buyer info
	buyerName: z.string().min(1, "Buyer name is required"),
	buyerBin: z.string().length(12, "Buyer BIN must be 12 characters"),
	
	// Contract info
	contract: z.string().min(1, "Contract number is required"),
	
	// Personnel info
	orgPersonName: z.string().min(1, "Organization person name is required"),
	orgPersonRole: z.string().min(1, "Organization person role is required"),
	buyerPersonName: z.string().optional(),
	buyerPersonRole: z.string().optional(),
	
	// Contact info
	phone: z.string().min(1, "Phone is required"),
	
	// Bank info
	selectedBank: z.object({
		name: z.string(),
		account: z.string(),
		bik: z.string(),
	}),
	
	// Services/products
	products: z.array(documentProductSchema).min(1, "At least one product is required"),
	
	// Document specifics
	idx: z.string().min(1, "Document index is required"),
	total: z.number().positive("Total amount must be positive"),
});

// Доверенность (Power of Attorney) Schema
export const powerOfAttorneySchema = z.object({
	orgName: z.string().min(1, "Organization name is required"),
	orgAddress: z.string().min(1, "Organization address is required"),
	orgBin: z.string().length(12, "BIN must be 12 characters"),
	buyerName: z.string().min(1, "Buyer name is required"),
	buyerBin: z.string().length(12, "Buyer BIN must be 12 characters"),
	schetNaOplatu: z.string().min(1, "Invoice number is required"),
	orgPersonName: z.string().min(1, "Organization person name is required"),
	orgPersonRole: z.string().min(1, "Organization person role is required"),
	phone: z.string().min(1, "Phone is required"),
	selectedBank: z.object({
		name: z.string(),
		account: z.string(),
		bik: z.string(),
	}),
	employeeName: z.string().min(1, "Employee name is required"),
	employeeRole: z.string().min(1, "Employee role is required"),
	employeeIin: z.string().length(12, "Employee IIN must be 12 characters"),
	employeeDocNumber: z.string().min(1, "Employee document number is required"),
	employeeDocNumberDate: z.date(),
	employeeWhoGives: z.string().min(1, "Document issuer is required"),
	dateUntil: z.date(),
	products: z.array(documentProductSchema).min(1, "At least one product is required"),
	idx: z.string().min(1, "Document index is required"),
});

// Накладная (Waybill) Schema
export const waybillDocumentSchema = z.object({
	orgName: z.string().min(1, "Organization name is required"),
	orgAddress: z.string().min(1, "Organization address is required"),
	orgBin: z.string().length(12, "BIN must be 12 characters"),
	buyerName: z.string().min(1, "Buyer name is required"),
	buyerBin: z.string().length(12, "Buyer BIN must be 12 characters"),
	orgPersonName: z.string().min(1, "Organization person name is required"),
	orgPersonRole: z.string().min(1, "Organization person role is required"),
	buyerPersonName: z.string().optional(),
	buyerPersonRole: z.string().optional(),
	phone: z.string().min(1, "Phone is required"),
	selectedBank: z.object({
		name: z.string(),
		account: z.string(),
		bik: z.string(),
	}),
	products: z.array(documentProductSchema).min(1, "At least one product is required"),
	idx: z.string().min(1, "Document index is required"),
	total: z.number().positive("Total amount must be positive"),
});

// Инвойс (Invoice) Schema
export const invoiceDocumentSchema = z.object({
	orgName: z.string().min(1, "Organization name is required"),
	orgBin: z.string().length(12, "BIN must be 12 characters"),
	orgIik: z.string().min(1, "Organization IIK is required"),
	orgBik: z.string().min(1, "Organization BIK is required"),
	phone: z.string().min(1, "Phone is required"),
	productDescription: z.string().min(1, "Product description is required"),
	productDeadline: z.date(),
	productPriceCondition: z.string().min(1, "Price condition is required"),
	selectedBank: z.object({
		name: z.string(),
		account: z.string(),
		bik: z.string(),
	}),
	products: z.array(documentProductSchema).min(1, "At least one product is required"),
});

// КП (Commercial Proposal) Schema
export const commercialProposalSchema = z.object({
	orgName: z.string().min(1, "Organization name is required"),
	orgBin: z.string().length(12, "BIN must be 12 characters"),
	orgIik: z.string().min(1, "Organization IIK is required"),
	orgBik: z.string().min(1, "Organization BIK is required"),
	phone: z.string().min(1, "Phone is required"),
	productDescription: z.string().min(1, "Product description is required"),
	productName: z.string().min(1, "Product name is required"),
	productDeadline: z.date(),
	productPrice: z.number().positive("Product price must be positive"),
	productPriceCondition: z.string().min(1, "Price condition is required"),
	selectedBank: z.object({
		name: z.string(),
		account: z.string(),
		bik: z.string(),
	}),
});

// Счет на оплату (Payment Invoice) Schema
export const paymentInvoiceSchema = z.object({
	orgName: z.string().min(1, "Organization name is required"),
	orgAddress: z.string().min(1, "Organization address is required"),
	orgBin: z.string().length(12, "BIN must be 12 characters"),
	orgIik: z.string().min(1, "Organization IIK is required"),
	orgBik: z.string().min(1, "Organization BIK is required"),
	buyerName: z.string().min(1, "Buyer name is required"),
	buyerBin: z.string().length(12, "Buyer BIN must be 12 characters"),
	codeKnp: z.string().min(1, "KNP code is required"),
	contract: z.string().min(1, "Contract number is required"),
	orgPersonName: z.string().min(1, "Organization person name is required"),
	phone: z.string().min(1, "Phone is required"),
	selectedBank: z.object({
		name: z.string(),
		account: z.string(),
		bik: z.string(),
	}),
	products: z.array(documentProductSchema).min(1, "At least one product is required"),
	idx: z.string().min(1, "Document index is required"),
});

// Document Type Enum
export const DOCUMENT_TYPES = [
	"avr", // АВР
	"power-of-attorney", // Доверенность  
	"waybill", // Накладная
	"invoice", // Инвойс
	"commercial-proposal", // КП
	"payment-invoice", // Счет на оплату
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

// Infer types
export type AVRDocument = z.infer<typeof avrDocumentSchema>;
export type PowerOfAttorneyDocument = z.infer<typeof powerOfAttorneySchema>;
export type WaybillDocument = z.infer<typeof waybillDocumentSchema>;
export type InvoiceDocument = z.infer<typeof invoiceDocumentSchema>;
export type CommercialProposalDocument = z.infer<typeof commercialProposalSchema>;
export type PaymentInvoiceDocument = z.infer<typeof paymentInvoiceSchema>;
export type DocumentProduct = z.infer<typeof documentProductSchema>;

// Union type for all documents
export type AllDocumentTypes = 
	| AVRDocument 
	| PowerOfAttorneyDocument 
	| WaybillDocument 
	| InvoiceDocument 
	| CommercialProposalDocument 
	| PaymentInvoiceDocument;

// Document schema mapping
export const documentSchemaMap = {
	"avr": avrDocumentSchema,
	"power-of-attorney": powerOfAttorneySchema,
	"waybill": waybillDocumentSchema,
	"invoice": invoiceDocumentSchema,
	"commercial-proposal": commercialProposalSchema,
	"payment-invoice": paymentInvoiceSchema,
} as const; 