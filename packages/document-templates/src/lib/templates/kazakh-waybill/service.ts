import type { Database } from "@accounting-kz/db";
import { type Bank } from "@accounting-kz/db";
import { typstService } from "../../typst-service";
import {
	kazakhWaybillInputSchema,
	type WaybillItem,
	type KazakhWaybillInput,
} from "./schema";
import { numToFullWords } from "@accounting-kz/utils";
import path from "node:path";

// Template type identifier
const TEMPLATE_TYPE = "kazakh-waybill";

export interface GenerateWaybillResult {
	success: true;
	filePath: string;
	fileName: string;
	pdfBuffer: Buffer;
	fields: {
		orgName: string;
		orgAddress: string;
		orgBin: string;
		buyerName: string;
		buyerBin: string;
		orgPersonName: string;
		orgPersonRole: string;
		buyerPersonName: string;
		buyerPersonRole: string;
		phone: string | null | undefined;
		selectedBank: Bank | null | undefined;
		products: WaybillItem[];
		idx: string;
		total: number;
	};
}

/**
 * Generates a Kazakh waybill PDF from the provided input
 */
async function generateWaybill(
	input: KazakhWaybillInput,
): Promise<GenerateWaybillResult> {
	// 1. Calculate totals
	const totalAmount = input.items.reduce(
		(sum: number, item: WaybillItem) => sum + item.quantity * item.price,
		0,
	);
	const vatRate = 0.12; // 12% VAT
	const vatAmount = totalAmount * vatRate;

	const formatDateToString = (date: Date | undefined): string => {
		if (!date) return "";
		return date.toLocaleDateString("ru-RU");
	};

	// 2. Prepare template data
	const templateData = {
		// Seller info
		sellerName: input.orgName,
		sellerBin: input.orgBin,
		sellerAddress: input.orgAddress || "",

		// Receiver info
		receiverName: input.buyerName,
		receiverAddress: "", // Not in schema, but in template

		// Waybill details
		waybillNumber: input.waybillNumber,
		waybillDate: formatDateToString(input.waybillDate),
		contractNumber: input.contractNumber || "",
		contractDate: formatDateToString(input.contractDate),

		// Items and totals
		items: input.items,
		totalAmount,
		vatAmount,
		totalInWords: numToFullWords(totalAmount + vatAmount),

		// Transport info
		transportOrgName: input.transportOrgName || "",
		transportResponsiblePerson: input.transportResponsiblePerson || "",
		responsiblePersonName: input.orgPersonName || "",

		// Employee info
		senderEmployeeName: input.orgPersonName || "",
		receiverEmployeeName: input.buyerPersonName || "",
		releaserEmployeeName: input.orgPersonName || "",
		chiefAccountantName: "", // Needs to be determined
		unitDescription: "штуках", // Needs to be determined
	};

	// 3. Generate PDF
	const templatePath = path.join(__dirname, "template.typ");
	const fileName = `waybill-${input.orgBin}-${input.buyerBin}-${input.waybillNumber}.pdf`;
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
			buyerName: input.buyerName,
			buyerBin: input.buyerBin,
			orgPersonName: input.orgPersonName || "",
			orgPersonRole: input.orgPersonRole || "",
			buyerPersonName: input.buyerPersonName || "",
			buyerPersonRole: input.buyerPersonRole || "",
			phone: input.phone,
			selectedBank: input.selectedBank,
			products: input.items,
			idx: input.waybillNumber,
			total: totalAmount,
		},
	};
}

// Export factory function that returns service functions
export function createKazakhWaybillService(): {
	generateDocument: (
		input: KazakhWaybillInput,
	) => Promise<GenerateWaybillResult>;
	templateType: string;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	parseInput: (input: any) => KazakhWaybillInput;
} {
	return {
		generateDocument: (input: KazakhWaybillInput) => generateWaybill(input),
		templateType: TEMPLATE_TYPE,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		parseInput: (input: any) => kazakhWaybillInputSchema.parse(input),
	};
}
