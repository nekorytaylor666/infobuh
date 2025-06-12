import type { Bank, Database } from "@accounting-kz/db";
import { banks, employees, legalEntities, eq } from "@accounting-kz/db";
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
		(sum: number, item: InvoiceItem) => sum + item.quantity * item.price,
		0,
	);
	const vatAmount = totalAmount * 0.12; // 12% VAT

	// 4. Prepare template data
	const templateData = {
		// Company info
		sellerName: seller.name,
		sellerBin: seller.bin,
		sellerAccount: sellerBank?.account || "",
		sellerBik: sellerBank?.bik || "",
		sellerBank: sellerBank?.name || "",
		knp: input.knp || "710",

		// Invoice details
		invoiceNumber: input.invoiceNumber,
		invoiceDate: input.invoiceDate.toLocaleDateString("ru-RU"),
		invoiceTime: input.invoiceDate.toLocaleTimeString("ru-RU"),

		// Buyer info
		buyerName: client.name,
		buyerBin: client.bin,

		// Contract reference
		contractReference: `Договор ${input.contractNumber}, от ${input.contractDate?.toLocaleDateString("ru-RU")}`,

		// Items and totals
		items: input.items,
		totalAmount,
		vatAmount,
		totalInWords: numToFullWords(totalAmount),

		// Additional info
		executorName: executor?.fullName,
		executorPosition: executor?.role || "Директор",
		contactPhone: input.contactPhone,
	};

	// 5. Generate PDF
	const templatePath = path.join(__dirname, "template.typ");
	const fileName = `invoice-${input.sellerLegalEntityId}-${input.clientLegalEntityId}-${input.invoiceNumber}.pdf`;
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
			orgIik: sellerBank?.account || "",
			orgBik: sellerBank?.bik || "",
			buyerName: client.name,
			buyerBin: client.bin,
			codeKnp: input.knp || "710",
			contract: `Договор №${input.contractNumber} от ${formatDate(
				input.contractDate,
			)}`,
			orgPersonName: executor?.fullName,
			phone: input.contactPhone,
			selectedBank: sellerBank,
			products: input.items,
			idx: input.invoiceNumber,
		},
	};
}

// Export factory function that returns service functions
export function createKazakhInvoiceService(db: Database): {
	generateDocument: (
		input: KazakhInvoiceInput,
	) => Promise<GenerateInvoiceResult>;
	templateType: string;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	parseInput: (input: any) => KazakhInvoiceInput;
} {
	return {
		generateDocument: (input: KazakhInvoiceInput) => generateInvoice(db, input),
		templateType: TEMPLATE_TYPE,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		parseInput: (input: any) => kazakhInvoiceInputSchema.parse(input),
	};
}
