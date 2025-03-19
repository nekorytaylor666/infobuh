import { eq } from "drizzle-orm";
import type { Database } from "../../../../db";
import { banks, employees, legalEntities } from "../../../../db/schema";
import { pdfService } from "../../pdf-service";
import { kazakhInvoiceInputSchema, type KazakhInvoiceInput } from "./schema";
import { numToFullWords } from "../../../../utils/numToFullWords";
import { KazakhInvoiceTemplate } from "./template";
// Template type identifier
const TEMPLATE_TYPE = "kazakh-invoice";

export interface GenerateInvoiceResult {
	success: true;
	filePath: string;
	fileName: string;
	pdfBuffer: Buffer;
}

/**
 * Generates a Kazakh invoice PDF from the provided input
 */
async function generateInvoice(
	db: Database,
	input: KazakhInvoiceInput,
): Promise<GenerateInvoiceResult> {
	// 1. Fetch all required entities in parallel
	const [seller, sellerBank, client, executor] = await Promise.all([
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

		// Invoice details
		invoiceNumber: input.invoiceNumber,
		invoiceDate: input.invoiceDate,
		contractNumber: input.contractNumber,
		contractDate: input.contractDate,

		// Client info
		clientName: client.name,
		clientBin: client.bin,
		clientAddress: client.address || "",

		// Items and totals
		items: input.items,
		totalAmount,
		vatAmount,
		totalInWords: numToFullWords(totalAmount),

		// Additional info
		executorName: executor?.fullName,
		contactPhone: input.contactPhone,
	};

	// 5. Generate PDF
	const pdfBuffer = await pdfService.renderPDF(KazakhInvoiceTemplate, {
		data: templateData,
	});

	// 6. Save PDF
	const fileName = `invoice-${input.sellerLegalEntityId}-${input.clientLegalEntityId}-${input.invoiceNumber}.pdf`;
	const filePath = await pdfService.savePDF(pdfBuffer, fileName);

	return {
		success: true,
		filePath,
		fileName,
		pdfBuffer,
	};
}

// Export factory function that returns service functions
export function createKazakhInvoiceService(db: Database): {
	generateDocument: (
		input: KazakhInvoiceInput,
	) => Promise<GenerateInvoiceResult>;
	templateType: string;
	parseInput: (input: any) => KazakhInvoiceInput;
} {
	return {
		generateDocument: (input: KazakhInvoiceInput) => generateInvoice(db, input),
		templateType: TEMPLATE_TYPE,
		parseInput: (input: any) => kazakhInvoiceInputSchema.parse(input),
	};
}
