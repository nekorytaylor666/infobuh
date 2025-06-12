import type { Database } from "@accounting-kz/db";
import { banks, employees, legalEntities, eq } from "@accounting-kz/db";
import {
    type ActItem,
    kazakhActInputSchema,
    type KazakhActInput,
} from "./schema";
import { numToFullWords } from "@accounting-kz/utils";
import * as fs from "fs/promises";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Template type identifier for Typst
const TEMPLATE_TYPE = "kazakh-act-typst";

export interface GenerateTypstActResult {
    success: true;
    filePath: string;
    fileName: string;
    pdfBuffer: Buffer;
}

/**
 * Typst-based document generation service for Kazakh acts
 */
export class TypstActService {
    private templatesDir: string;
    private outputDir: string;

    constructor(templatesDir: string, outputDir: string) {
        this.templatesDir = templatesDir;
        this.outputDir = outputDir;
    }

    /**
     * Generates a Kazakh act PDF using Typst from the provided input
     */
    async generateAct(
        db: Database,
        input: KazakhActInput,
    ): Promise<GenerateTypstActResult> {
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
            return date.toISOString().split('T')[0];
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

        // 5. Generate Typst document
        const fileName = `act-${input.sellerLegalEntityId}-${input.clientLegalEntityId}-${input.actNumber}`;
        const typstFilePath = path.join(this.outputDir, `${fileName}.typ`);
        const pdfFilePath = path.join(this.outputDir, `${fileName}.pdf`);

        // 6. Create Typst document with data
        const typstContent = await this.generateTypstContent(templateData);
        await fs.writeFile(typstFilePath, typstContent, 'utf-8');

        // 7. Compile Typst to PDF
        try {
            await execAsync(`typst compile "${typstFilePath}" "${pdfFilePath}"`);
        } catch (error) {
            throw new Error(`Failed to compile Typst document: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // 8. Read generated PDF
        const pdfBuffer = await fs.readFile(pdfFilePath);

        // 9. Clean up temporary files (optional)
        await fs.unlink(typstFilePath).catch(() => { }); // Ignore cleanup errors

        return {
            success: true,
            filePath: pdfFilePath,
            fileName: `${fileName}.pdf`,
            pdfBuffer,
        };
    }

    /**
     * Generates Typst content by embedding the template and data
     */
    private async generateTypstContent(data: any): Promise<string> {
        const templatePath = path.join(this.templatesDir, 'template.typ');
        const templateContent = await fs.readFile(templatePath, 'utf-8');

        // Convert data to Typst dictionary format
        const typstData = this.convertToTypstData(data);

        return `
${templateContent}

// Document data
#let documentData = ${typstData}

// Generate the document
#kazakhActTemplate(documentData)
`;
    }

    /**
     * Converts JavaScript object to Typst dictionary syntax
     */
    private convertToTypstData(data: any): string {
        const convertValue = (value: any): string => {
            if (value === null || value === undefined) {
                return 'none'
            }
            if (typeof value === 'string') {
                return `"${value.replace(/"/g, '\\"')}"`;
            }
            if (typeof value === 'number') {
                return value.toString();
            }
            if (typeof value === 'boolean') {
                return value.toString();
            }
            if (Array.isArray(value)) {
                const items = value.map(convertValue).join(', ');
                return `(${items})`;
            }
            if (typeof value === 'object') {
                const entries = Object.entries(value)
                    .map(([key, val]) => `${key}: ${convertValue(val)}`)
                    .join(', ');
                return `(${entries})`;
            }
            return 'none';
        };

        return convertValue(data);
    }
}

/**
 * Creates a factory function for the Typst service
 */
export function createTypstActService(
    db: Database,
    templatesDir: string,
    outputDir: string
): {
    generateDocument: (input: KazakhActInput) => Promise<GenerateTypstActResult>;
    templateType: string;
    parseInput: (input: any) => KazakhActInput;
} {
    const service = new TypstActService(templatesDir, outputDir);

    return {
        generateDocument: (input: KazakhActInput) => service.generateAct(db, input),
        templateType: TEMPLATE_TYPE,
        parseInput: (input: any) => kazakhActInputSchema.parse(input),
    };
} 