import { eq } from "drizzle-orm";
import type { Database } from "../../../../db";
import { banks, employees, legalEntities } from "../../../../db/schema";
import { pdfService } from "../../pdf-service";
import { kazakhWaybillInputSchema, type KazakhWaybillInput } from "./schema";
import { numToFullWords } from "../../../../utils/numToFullWords";
import { KazakhWaybillTemplate } from "./template";
// Template type identifier
const TEMPLATE_TYPE = "kazakh-waybill";

export interface GenerateWaybillResult {
	success: true;
	filePath: string;
	fileName: string;
	pdfBuffer: Buffer;
}

/**
 * Generates a Kazakh waybill PDF from the provided input
 */
async function generateWaybill(
	db: Database,
	input: KazakhWaybillInput,
): Promise<GenerateWaybillResult> {
	// 1. Fetch all required entities in parallel
	const [seller, sellerBank, client, sender, receiver, releaser] =
		await Promise.all([
			db.query.legalEntities.findFirst({
				where: eq(legalEntities.id, input.sellerLegalEntityId),
			}),
			db.query.banks.findFirst({
				where: eq(banks.legalEntityId, input.sellerLegalEntityId),
			}),
			db.query.legalEntities.findFirst({
				where: eq(legalEntities.id, input.clientLegalEntityId),
			}),
			input.senderEmployeeId
				? db.query.employees.findFirst({
						where: eq(employees.id, input.senderEmployeeId),
					})
				: null,
			input.receiverEmployeeId
				? db.query.employees.findFirst({
						where: eq(employees.id, input.receiverEmployeeId),
					})
				: null,
			input.releaserEmployeeId
				? db.query.employees.findFirst({
						where: eq(employees.id, input.releaserEmployeeId),
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
		(sum, item) => sum + item.quantity * item.price,
		0,
	);
	const vatRate = 0.12; // 12% VAT
	const vatAmount = totalAmount * vatRate;

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

		// Waybill details
		waybillNumber: input.waybillNumber,
		waybillDate: input.waybillDate,
		contractNumber: input.contractNumber || "",
		contractDate: input.contractDate || "",

		// Client info
		clientName: client.name,
		clientBin: client.bin,
		clientAddress: client.address || "",

		// Items and totals
		items: input.items,
		totalAmount,
		vatAmount,
		totalInWords: numToFullWords(totalAmount),

		// Transport info
		transportOrgName: input.transportOrgName || "",
		transportResponsiblePerson: input.transportResponsiblePerson || "",

		// Additional info
		senderName: sender?.fullName || "",
		senderPosition: sender?.role || "Директор",
		receiverName: receiver?.fullName || "",
		receiverPosition: receiver?.role || "",
		releaserName: releaser?.fullName || "",
		releaserPosition: releaser?.role || "",
	};

	// 5. Generate PDF
	const pdfBuffer = await pdfService.renderPDF(KazakhWaybillTemplate, {
		data: templateData,
	});

	// 6. Save PDF
	const fileName = `waybill-${input.sellerLegalEntityId}-${input.clientLegalEntityId}-${input.waybillNumber}.pdf`;
	const filePath = await pdfService.savePDF(pdfBuffer, fileName);

	return {
		success: true,
		filePath,
		fileName,
		pdfBuffer,
	};
}

// Export factory function that returns service functions
export function createKazakhWaybillService(db: Database): {
	generateDocument: (
		input: KazakhWaybillInput,
	) => Promise<GenerateWaybillResult>;
	templateType: string;
	parseInput: (input: any) => KazakhWaybillInput;
} {
	return {
		generateDocument: (input: KazakhWaybillInput) => generateWaybill(db, input),
		templateType: TEMPLATE_TYPE,
		parseInput: (input: any) => kazakhWaybillInputSchema.parse(input),
	};
}
