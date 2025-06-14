import type { Database } from "@accounting-kz/db";
import {
    type Bank,
} from "@accounting-kz/db";
import { typstService } from "../../typst-service";
import {
    type DoverennostItem,
    kazakhDoverennostInputSchema,
    type KazakhDoverennostInput,
} from "./schema";
import { numToFullWords } from "@accounting-kz/utils";
import path from "node:path";

const TEMPLATE_TYPE = "kazakh-doverennost";

export interface GenerateDoverennostResult {
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
        schetNaOplatu: string;
        orgPersonName: string | null | undefined;
        orgPersonRole: string;
        phone: string | null | undefined;
        selectedBank: Bank | null | undefined;
        employeeName: string | null | undefined;
        employeeRole: string;
        employeeIin: string | null | undefined;
        employeeDocNumber: string;
        employeeDocNumberDate: Date;
        employeeWhoGives: string;
        dateUntil: Date;
        products: DoverennostItem[];
        idx: string;
    };
}

async function generateDoverennost(
    input: KazakhDoverennostInput,
): Promise<GenerateDoverennostResult> {
    const totalAmount = input.items.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0,
    );

    const templateData = {
        organizationName: input.orgName,
        organizationBin: input.orgBin,
        organizationAddress: input.orgAddress,
        accountNumber: input.selectedBank?.account || "",
        bankName: input.selectedBank?.name || "",
        bankBik: input.selectedBank?.bik || "",

        doverennostNumber: input.idx,
        issueDate: input.issueDate,
        validUntil: input.dateUntil,

        issuedToName: input.employeeName,
        issuedToRole: input.employeeRole,
        issuedToIin: input.employeeIin,
        passportNumber: input.employeeDocNumber,
        passportIssueDate: input.employeeDocNumberDate,
        passportIssuer: input.employeeWhoGives,

        supplierName: input.buyerName,
        supplierBin: input.buyerBin,

        contractReference: input.schetNaOplatu,
        items: input.items,
        totalAmount,
        totalInWords: numToFullWords(totalAmount),

        directorName: input.orgPersonName,
        bookkeeperName: input.bookkeeperName,
    };

    const templatePath = path.join(__dirname, "template.typ");
    const fileName = `doverennost-${input.orgBin}-${input.idx}.pdf`;
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
            schetNaOplatu: input.schetNaOplatu,
            orgPersonName: input.orgPersonName,
            orgPersonRole: input.orgPersonRole || "Директор",
            phone: input.phone,
            selectedBank: input.selectedBank,
            employeeName: input.employeeName,
            employeeRole: input.employeeRole || "",
            employeeIin: input.employeeIin,
            employeeDocNumber: input.employeeDocNumber,
            employeeDocNumberDate: input.employeeDocNumberDate,
            employeeWhoGives: input.employeeWhoGives,
            dateUntil: input.dateUntil,
            products: input.items,
            idx: input.idx,
        },
    };
}

export function createKazakhDoverennostService() {
    return {
        generateDocument: (input: KazakhDoverennostInput) =>
            generateDoverennost(input),
        templateType: TEMPLATE_TYPE,
        parseInput: (input: any) => kazakhDoverennostInputSchema.parse(input),
    };
} 