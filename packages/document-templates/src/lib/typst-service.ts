import { exec } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execAsync = promisify(exec);

// Template registry type
/**
 * Typst Service for generating PDFs from .typ templates
 */
export class TypstService {
    private outputDir: string;

    constructor() {
        this.outputDir = path.join(process.cwd(), "uploads");
        this.initialize();
    }

    private async initialize() {
        try {
            await fs.mkdir(this.outputDir, { recursive: true });
        } catch (error) {
            console.error("Error creating uploads directory:", error);
        }
    }

    /**
     * Render PDF directly from a Typst template
     */
    async renderPDF(
        templatePath: string,
        data: unknown,
        fileName: string,
    ): Promise<{ filePath: string; pdfBuffer: Buffer }> {
        const tempDir = path.join(this.outputDir, "temp");
        await fs.mkdir(tempDir, { recursive: true });

        const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const tempInputPath = path.join(tempDir, `input-${uniqueId}.typ`);
        const outputPdfPath = path.join(this.outputDir, fileName);

        // Validate and sanitize data
        const sanitizedData = this.sanitizeData(data);
        const dataAsTypstString = this.convertToTypstData(sanitizedData);
        const templateContent = await fs.readFile(templatePath, "utf-8");

        const typstContent = `
${templateContent}

#show: main(${dataAsTypstString})
`;
        try {
            await fs.writeFile(tempInputPath, typstContent);

            // Debug: Log the generated Typst content if compilation fails
            const command = `typst compile "${tempInputPath}" "${outputPdfPath}"`;
            const startTime = performance.now();

            try {
                await execAsync(command);
            } catch (compilationError) {
                console.error("Typst compilation failed. Generated content:");
                console.error("=".repeat(50));
                console.error(typstContent);
                console.error("=".repeat(50));
                throw compilationError;
            }

            const endTime = performance.now();
            console.log(`Typst compilation took ${endTime - startTime}ms`);

            const pdfBuffer = await fs.readFile(outputPdfPath);

            return { filePath: outputPdfPath, pdfBuffer };
        } catch (error) {
            console.error("Error rendering Typst PDF:", error);
            throw error;
        } finally {
            // Clean up temporary files
            await fs.unlink(tempInputPath).catch(() => { });
        }
    }

    /**
     * Save PDF to disk
     */
    async savePDF(buffer: Buffer, fileName: string): Promise<string> {
        const filePath = path.join(this.outputDir, fileName);
        await fs.writeFile(filePath, buffer);
        return filePath;
    }

    /**
     * Sanitize data to prevent Typst compilation issues
     */
    private sanitizeData(data: any): any {
        if (typeof data === 'string') {
            // Remove or escape problematic characters
            return data.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters
        }

        if (Array.isArray(data)) {
            return data.map(item => this.sanitizeData(item));
        }

        if (typeof data === 'object' && data !== null) {
            const sanitized: any = {};
            for (const [key, value] of Object.entries(data)) {
                sanitized[key] = this.sanitizeData(value);
            }

            // Add default values for commonly missing keys in templates
            const defaultValues = {
                executorName: sanitized.executorName || "",
                contractReference: sanitized.contractReference || "",
                sellerAccount: sanitized.sellerAccount || "",
                sellerBik: sanitized.sellerBik || "",
                sellerBank: sanitized.sellerBank || "",
                contactPhone: sanitized.contactPhone || "",
                knp: sanitized.knp || "002"
            };

            // Only add defaults if they're not already present and this looks like a document data object
            if (sanitized.items || sanitized.invoiceNumber || sanitized.actNumber || sanitized.waybillNumber) {
                Object.assign(sanitized, defaultValues);
            }

            return sanitized;
        }

        return data;
    }

    private convertToTypstData(data: any): string {
        const convertValue = (value: any): string => {
            if (typeof value === "string") {
                // Escape quotes, backslashes, and hash symbols for Typst strings
                return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/#/g, "\\#")}"`;
            }
            if (typeof value === "number" || typeof value === "boolean") {
                return String(value);
            }
            if (value === null || value === undefined) {
                return "none";
            }
            if (value instanceof Date) {
                return `datetime(year: ${value.getFullYear()}, month: ${value.getMonth() + 1}, day: ${value.getDate()})`;
            }
            if (Array.isArray(value)) {
                const items = value.map(convertValue);
                if (items.length === 0) {
                    return "()";
                }
                if (items.length === 1) {
                    return `(${items[0]},)`;
                }
                return `(${items.join(", ")})`;
            }
            if (typeof value === "object" && value !== null) {
                const fields = Object.entries(value)
                    .filter(([key, val]) => val !== undefined) // Filter out undefined values
                    .map(([key, val]) => `${key}: ${convertValue(val)}`)
                    .join(", ");
                return `(${fields})`;
            }
            return "none";
        };
        return convertValue(data);
    }
}

// Export singleton instance
export const typstService = new TypstService(); 