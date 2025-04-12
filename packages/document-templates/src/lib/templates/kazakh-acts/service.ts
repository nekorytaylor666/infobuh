import type { Database } from "@accounting-kz/db";
import { banks, employees, legalEntities, eq } from "@accounting-kz/db";
import { pdfService } from "../../pdf-service";
import {
	type ActItem,
	kazakhActInputSchema,
	type KazakhActInput,
} from "./schema";
import { numToFullWords } from "@accounting-kz/utils";
import { KazakhActTemplate } from "./template";
// Template type identifier
const TEMPLATE_TYPE = "kazakh-act";

export interface GenerateActResult {
	success: true;
	filePath: string;
	fileName: string;
	pdfBuffer: Buffer;
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
		actDate: input.actDate,
		contractNumber: input.contractNumber,
		contractDate: input.contractDate,
		dateOfCompletion: input.dateOfCompletion,

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
	const pdfBuffer = await pdfService.renderPDF(KazakhActTemplate, {
		data: templateData,
	});

	// 6. Save PDF
	const fileName = `act-${input.sellerLegalEntityId}-${input.clientLegalEntityId}-${input.actNumber}.pdf`;
	const filePath = await pdfService.savePDF(pdfBuffer, fileName);

	return {
		success: true,
		filePath,
		fileName,
		pdfBuffer,
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
