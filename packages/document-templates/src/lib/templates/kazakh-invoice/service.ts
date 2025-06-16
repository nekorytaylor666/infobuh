import type { Bank, Database } from "@accounting-kz/db";
import { typstService } from "../../typst-service";
import {
	type InvoiceItem,
	kazakhInvoiceInputSchema,
	type KazakhInvoiceInput,
} from "./schema";
import { numToFullWords } from "@accounting-kz/utils";
import path from "node:path";

// Template type identifier
const TEMPLATE_TYPE = "kazakh-invoice";

export interface GenerateInvoiceResult {
	success: true;
	filePath: string;
	fileName: string;
	pdfBuffer: Buffer;
	fields: {
		orgName: string;
		orgAddress: string;
		orgBin: string;
		orgIik: string;
		orgBik: string;
		buyerName: string;
		buyerBin: string;
		codeKnp: string;
		contract: string;
		orgPersonName: string | null | undefined;
		phone: string | null | undefined;
		selectedBank: Bank | null | undefined;
		products: InvoiceItem[];
		idx: string;
	};
}

/**
 * Generates a Kazakh invoice PDF from the provided input
 */
async function generateInvoice(
	input: KazakhInvoiceInput,
): Promise<GenerateInvoiceResult> {
	// 1. Calculate totals
	const totalAmount = input.items.reduce(
		(sum: number, item: InvoiceItem) => sum + item.quantity * item.price,
		0,
	);
	const vatAmount = totalAmount * 0.12; // 12% VAT

	// 2. Prepare template data
	const templateData = {
		// Company info
		sellerName: input.orgName,
		sellerBin: input.orgBin,
		sellerAccount: input.orgIik || "",
		sellerBik: input.orgBik || "",
		sellerBank: input.selectedBank?.name || "",
		knp: input.codeKnp || "710",

		// Invoice details
		invoiceNumber: input.invoiceNumber,
		invoiceDate: input.invoiceDate,
		invoiceTime: input.invoiceDate,

		// Buyer info
		buyerName: input.buyerName,
		buyerBin: input.buyerBin,

		// Contract reference
		contractReference: input.contract,

		// Items and totals
		items: input.items,
		totalAmount,
		vatAmount,
		totalInWords: numToFullWords(totalAmount),

		// Additional info
		executorName: input.orgPersonName || "",
		executorPosition: "Директор",
		contactPhone: input.phone,
	};

	// 3. Generate PDF
	const templatePath = path.join(__dirname, "template.typ");
	const fileName = `invoice-${input.orgBin}-${input.buyerBin}-${input.invoiceNumber}.pdf`;
	const { filePath, pdfBuffer } = await typstService.renderPDF(
		templatePath,
		templateData,
		fileName,
	);

	return {
		success: true,
		filePath,
		fileName,
		pdfBuffer,
		fields: {
			orgName: input.orgName,
			orgAddress: input.orgAddress || "",
			orgBin: input.orgBin,
			orgIik: input.orgIik || "",
			orgBik: input.orgBik || "",
			buyerName: input.buyerName,
			buyerBin: input.buyerBin,
			codeKnp: input.codeKnp || "710",
			contract: input.contract,
			orgPersonName: input.orgPersonName,
			phone: input.phone,
			selectedBank: input.selectedBank,
			products: input.items,
			idx: input.invoiceNumber,
		},
	};
}

// Export factory function that returns service functions
export function createKazakhInvoiceService(): {
	generateDocument: (
		input: KazakhInvoiceInput,
	) => Promise<GenerateInvoiceResult>;
	templateType: string;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	parseInput: (input: any) => KazakhInvoiceInput;
} {
	return {
		generateDocument: (input: KazakhInvoiceInput) => generateInvoice(input),
		templateType: TEMPLATE_TYPE,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		parseInput: (input: any) => kazakhInvoiceInputSchema.parse(input),
	};
}
