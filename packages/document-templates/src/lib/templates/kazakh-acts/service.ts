import { type Bank } from "@accounting-kz/db";
import { typstService } from "../../typst-service";
import {
	type ActItem,
	kazakhActInputSchema,
	type KazakhActInput,
} from "./schema";
import { numToFullWords } from "@accounting-kz/utils";
import path from "node:path";

// Template type identifier
const TEMPLATE_TYPE = "kazakh-act";

export interface GenerateActResult {
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
		contract: string;
		orgPersonName: string | null | undefined;
		orgPersonRole: string;
		buyerPersonName: string | null | undefined;
		buyerPersonRole: string;
		phone: string | null | undefined;
		selectedBank: Bank | null | undefined;
		products: ActItem[];
		idx: string;
		total: number;
	};
}

/**
 * Generates a Kazakh act of completed works PDF from the provided input
 */
async function generateAct(
	input: KazakhActInput,
): Promise<GenerateActResult> {
	// 1. Calculate totals
	const totalAmount = input.items.reduce(
		(sum: number, item: ActItem) => sum + item.quantity * item.price,
		0,
	);
	const vatAmount = totalAmount * 0.12; // 12% VAT

	// Helper function to format date to YYYY-MM-DD string
	const formatDateToString = (date: Date | undefined): string => {
		if (!date) return "";
		return date.toISOString().split("T")[0];
	};

	// 2. Prepare template data
	const templateData = {
		// Company info
		companyName: input.orgName,
		bin: input.orgBin,
		kbe: input.kbe || "",
		account: input.selectedBank?.account || "",
		bik: input.selectedBank?.bik || "",
		bank: input.selectedBank?.name || "",
		sellerImage: input.sellerImage || undefined,
		sellerAddress: input.orgAddress,

		// Act details
		actNumber: input.actNumber,
		actDate: formatDateToString(input.actDate),
		contractNumber: input.contractNumber,
		contractDate: formatDateToString(input.contractDate),
		dateOfCompletion: formatDateToString(input.dateOfCompletion),

		// Client info
		clientName: input.buyerName,
		clientBin: input.buyerBin,
		clientAddress: input.buyerAddress,

		// Items and totals
		items: input.items,
		totalAmount,
		vatAmount,
		totalInWords: numToFullWords(totalAmount),

		// Additional info
		executorName: input.executorName,
		executorPosition: input.executorPosition || "Предприниматель",
		customerName: input.customerName,
		customerPosition: input.customerPosition || "",
	};

	// 3. Generate PDF
	const templatePath = path.join(
		__dirname,
		"template.typ",
	);
	const fileName = `act-${input.orgBin}-${input.buyerBin}-${input.actNumber}.pdf`;
	const { filePath, pdfBuffer } = await typstService.renderPDF(
		templatePath,
		templateData,
		fileName,
	);

	const formatDate = (date: Date | undefined): string => {
		if (!date) return "";
		return date.toLocaleDateString("ru-RU");
	};

	return {
		success: true,
		filePath,
		fileName,
		pdfBuffer,
		fields: {
			orgName: input.orgName,
			orgAddress: input.orgAddress,
			orgBin: input.orgBin,
			buyerName: input.buyerName,
			buyerBin: input.buyerBin,
			contract: `Договор №${input.contractNumber} от ${formatDate(
				input.contractDate,
			)}`,
			orgPersonName: input.orgPersonName,
			orgPersonRole: input.orgPersonRole,
			buyerPersonName: input.buyerPersonName,
			buyerPersonRole: input.buyerPersonRole,
			phone: input.phone,
			selectedBank: input.selectedBank,
			products: input.items,
			idx: input.actNumber,
			total: totalAmount,
		},
	};
}

// Export factory function that returns service functions
export function createKazakhActService(): {
	generateDocument: (input: KazakhActInput) => Promise<GenerateActResult>;
	templateType: string;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	parseInput: (input: any) => KazakhActInput;
} {
	return {
		generateDocument: (input: KazakhActInput) => generateAct(input),
		templateType: TEMPLATE_TYPE,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		parseInput: (input: any) => kazakhActInputSchema.parse(input),
	};
}
