import type { Database } from "@accounting-kz/db";
import {
    type Bank,
    banks,
    employees,
    legalEntities,
    eq,
    type LegalEntity,
    type Employee,
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
    db: Database,
    input: KazakhDoverennostInput,
): Promise<GenerateDoverennostResult> {
    const [
        organization,
        orgBank,
        supplier,
        employee,
        director,
        bookkeeper,
    ] = await Promise.all([
        db.query.legalEntities.findFirst({
            where: eq(legalEntities.id, input.organizationLegalEntityId),
        }),
        db.query.banks.findFirst({
            where: eq(banks.legalEntityId, input.organizationLegalEntityId),
        }),
        db.query.legalEntities.findFirst({
            where: eq(legalEntities.id, input.supplierLegalEntityId),
        }),
        db.query.employees.findFirst({
            where: eq(employees.id, input.employeeId),
        }),
        input.directorEmployeeId
            ? db.query.employees.findFirst({
                where: eq(employees.id, input.directorEmployeeId),
            })
            : null,
        input.bookkeeperEmployeeId
            ? db.query.employees.findFirst({
                where: eq(employees.id, input.bookkeeperEmployeeId),
            })
            : null,
    ]);

    if (!organization) {
        throw new Error(
            `Organization legal entity not found: ${input.organizationLegalEntityId}`,
        );
    }
    if (!supplier) {
        throw new Error(
            `Supplier legal entity not found: ${input.supplierLegalEntityId}`,
        );
    }
    if (!employee) {
        throw new Error(`Employee not found: ${input.employeeId}`);
    }

    const totalAmount = input.items.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0,
    );

    const directorName = director?.fullName || "";
    const bookkeeperName = bookkeeper?.fullName || "";

    const templateData = {
        organizationName: organization.name,
        organizationBin: organization.bin,
        organizationAddress: organization.address,
        accountNumber: orgBank?.account || "",
        bankName: orgBank?.name || "",
        bankBik: orgBank?.bik || "",

        doverennostNumber: input.doverennostNumber,
        issueDate: input.issueDate,
        validUntil: input.validUntil,

        issuedToName: employee.fullName,
        issuedToRole: employee.role,
        issuedToIin: employee.iin,
        passportNumber: input.passportNumber,
        passportIssueDate: input.passportIssueDate,
        passportIssuer: input.passportIssuer,

        supplierName: supplier.name,
        supplierBin: supplier.bin,

        contractReference: input.contractReference,
        items: input.items,
        totalAmount,
        totalInWords: numToFullWords(totalAmount),

        directorName,
        bookkeeperName,
    };

    const templatePath = path.join(__dirname, "template.typ");
    const fileName = `doverennost-${input.organizationLegalEntityId}-${input.doverennostNumber}.pdf`;
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
            orgName: organization.name,
            orgAddress: organization.address || "",
            orgBin: organization.bin,
            buyerName: supplier.name,
            buyerBin: supplier.bin,
            schetNaOplatu: input.contractReference,
            orgPersonName: director?.fullName,
            orgPersonRole: director?.role || "Директор",
            phone: input.contactPhone,
            selectedBank: orgBank,
            employeeName: employee.fullName,
            employeeRole: employee.role || "",
            employeeIin: employee.iin,
            employeeDocNumber: input.passportNumber,
            employeeDocNumberDate: input.passportIssueDate,
            employeeWhoGives: input.passportIssuer,
            dateUntil: input.validUntil,
            products: input.items,
            idx: input.doverennostNumber,
        },
    };
}

export function createKazakhDoverennostService(db: Database) {
    return {
        generateDocument: (input: KazakhDoverennostInput) =>
            generateDoverennost(db, input),
        templateType: TEMPLATE_TYPE,
        parseInput: (input: any) => kazakhDoverennostInputSchema.parse(input),
    };
} 