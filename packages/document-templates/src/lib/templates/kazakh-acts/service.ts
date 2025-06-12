import type { Database } from "@accounting-kz/db";
import { type Bank, banks, employees, legalEntities, eq } from "@accounting-kz/db";
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
	db: Database,
	input: KazakhActInput,
): Promise<GenerateActResult> {
	// 1. Fetch all required entities in parallel
	const [seller, sellerBank, client, executor, customer] = await Promise.all([
		db.query.legalEntities.findFirst({
			where: eq(legalEntities.id, input.sellerLegalEntityId),
		}),
		db.query.banks.findFirst({
			where: eq(banks.legalEntityId, input.sellerLegalEntityId),
		}),
		db.query.legalEntities.findFirst({
			where: eq(legalEntities.id, input.clientLegalEntityId),
		}),
		input.executorEmployeeId
			? db.query.employees.findFirst({
				where: eq(employees.id, input.executorEmployeeId),
			})
			: null,
		input.customerEmployeeId
			? db.query.employees.findFirst({
				where: eq(employees.id, input.customerEmployeeId),
			})
			: null,
	]);

	// 2. Validate entities exist
	if (!seller) {
		throw new Error(
			`Seller legal entity not found: ${input.sellerLegalEntityId}`,
		);
	}
	if (!client) {
		throw new Error(
			`Client legal entity not found: ${input.clientLegalEntityId}`,
		);
	}

	// 3. Calculate totals
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

	// 4. Prepare template data
	const templateData = {
		// Company info
		companyName: seller.name,
		bin: seller.bin,
		kbe: seller.ugd || "",
		account: sellerBank?.account || "",
		bik: sellerBank?.bik || "",
		bank: sellerBank?.name || "",
		sellerImage: seller.image || undefined,
		sellerAddress: seller.address || "",

		// Act details
		actNumber: input.actNumber,
		actDate: formatDateToString(input.actDate),
		contractNumber: input.contractNumber,
		contractDate: formatDateToString(input.contractDate),
		dateOfCompletion: formatDateToString(input.dateOfCompletion),

		// Client info
		clientName: client.name,
		clientBin: client.bin,
		clientAddress: client.address,

		// Items and totals
		items: input.items,
		totalAmount,
		vatAmount,
		totalInWords: numToFullWords(totalAmount),

		// Additional info
		executorName: executor?.fullName,
		executorPosition: executor?.role || "Предприниматель",
		customerName: customer?.fullName,
		customerPosition: customer?.role || "",
	};

	// 5. Generate PDF
	const templatePath = path.join(
		__dirname,
		"template.typ",
	);
	const fileName = `act-${input.sellerLegalEntityId}-${input.clientLegalEntityId}-${input.actNumber}.pdf`;
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
			orgName: seller.name,
			orgAddress: seller.address || "",
			orgBin: seller.bin,
			buyerName: client.name,
			buyerBin: client.bin,
			contract: `Договор №${input.contractNumber} от ${formatDate(
				input.contractDate,
			)}`,
			orgPersonName: executor?.fullName,
			orgPersonRole: executor?.role || "Предприниматель",
			buyerPersonName: customer?.fullName,
			buyerPersonRole: customer?.role || "",
			phone: input.contactPhone,
			selectedBank: sellerBank,
			products: input.items,
			idx: input.actNumber,
			total: totalAmount,
		},
	};
}

// Export factory function that returns service functions
export function createKazakhActService(db: Database): {
	generateDocument: (input: KazakhActInput) => Promise<GenerateActResult>;
	templateType: string;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	parseInput: (input: any) => KazakhActInput;
} {
	return {
		generateDocument: (input: KazakhActInput) => generateAct(db, input),
		templateType: TEMPLATE_TYPE,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		parseInput: (input: any) => kazakhActInputSchema.parse(input),
	};
}
