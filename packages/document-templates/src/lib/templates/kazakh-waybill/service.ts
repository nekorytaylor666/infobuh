import type { Database } from "@accounting-kz/db";
import { type Bank, banks, employees, legalEntities, eq } from "@accounting-kz/db";
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
	db: Database,
	input: KazakhWaybillInput,
): Promise<GenerateWaybillResult> {
	// 1. Fetch all required entities in parallel
	const [seller, sellerBank, client, sender, receiver, releaser] = await Promise.all([
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
		(sum: number, item: WaybillItem) => sum + item.quantity * item.price,
		0,
	);
	const vatRate = 0.12; // 12% VAT
	const vatAmount = totalAmount * vatRate;

	const formatDateToString = (date: Date | undefined): string => {
		if (!date) return "";
		return date.toLocaleDateString("ru-RU");
	};

	// 4. Prepare template data
	const templateData = {
		// Seller info
		sellerName: seller.name,
		sellerBin: seller.bin,
		sellerAddress: seller.address || "",

		// Receiver info
		receiverName: client.name,
		receiverAddress: client.address || "",

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
		responsiblePersonName: sender?.fullName || "",

		// Employee info
		senderEmployeeName: sender?.fullName || "",
		receiverEmployeeName: receiver?.fullName || "",
		releaserEmployeeName: releaser?.fullName || "",
		chiefAccountantName: "", // Needs to be determined
		unitDescription: "штуках", // Needs to be determined
	};

	// 5. Generate PDF
	const templatePath = path.join(__dirname, "template.typ");
	const fileName = `waybill-${input.sellerLegalEntityId}-${input.clientLegalEntityId}-${input.waybillNumber}.pdf`;
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
			orgName: seller.name,
			orgAddress: seller.address || "",
			orgBin: seller.bin,
			buyerName: client.name,
			buyerBin: client.bin,
			orgPersonName: releaser?.fullName || sender?.fullName || "",
			orgPersonRole: releaser?.role || sender?.role || "",
			buyerPersonName: receiver?.fullName || "",
			buyerPersonRole: receiver?.role || "",
			phone: input.contactPhone,
			selectedBank: sellerBank,
			products: input.items,
			idx: input.waybillNumber,
			total: totalAmount,
		},
	};
}

// Export factory function that returns service functions
export function createKazakhWaybillService(db: Database): {
	generateDocument: (
		input: KazakhWaybillInput,
	) => Promise<GenerateWaybillResult>;
	templateType: string;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	parseInput: (input: any) => KazakhWaybillInput;
} {
	return {
		generateDocument: (input: KazakhWaybillInput) => generateWaybill(db, input),
		templateType: TEMPLATE_TYPE,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		parseInput: (input: any) => kazakhWaybillInputSchema.parse(input),
	};
}
