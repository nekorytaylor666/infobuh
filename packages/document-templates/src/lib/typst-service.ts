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

        const dataAsTypstString = this.convertToTypstData(data);
        const templateContent = await fs.readFile(templatePath, "utf-8");

        const typstContent = `
${templateContent}

#show: main(${dataAsTypstString})
`;
        try {
            await fs.writeFile(tempInputPath, typstContent);

            const command = `typst compile "${tempInputPath}" "${outputPdfPath}"`;
            const startTime = performance.now();
            await execAsync(command);
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

    private convertToTypstData(data: any): string {
        const convertValue = (value: any): string => {
            if (typeof value === "string") {
                // Escape quotes and backslashes for Typst strings
                return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
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
                if (items.length === 1) {
                    return `(${items[0]},)`;
                }
                return `(${items.join(", ")})`;
            }
            if (typeof value === "object") {
                const fields = Object.entries(value)
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