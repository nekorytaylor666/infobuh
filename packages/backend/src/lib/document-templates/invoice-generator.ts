import { generateInvoicePdf } from "./react-pdf-generator";
import { sampleInvoiceData } from "./sample-invoice-data";
import fs from "fs";
import path from "path";

/**
 * Generate a sample invoice PDF file using the sample data
 * @param outputPath Optional path to save the PDF (defaults to 'invoice.pdf' in current directory)
 * @returns Path to the generated PDF file
 */
export async function generateSampleInvoice(
	outputPath?: string,
): Promise<string> {
	// Use default path if none provided
	const filePath = outputPath || path.join(process.cwd(), "invoice.pdf");

	try {
		// Generate the PDF using our sample data
		const buffer = await generateInvoicePdf(sampleInvoiceData);

		// Write to file
		fs.writeFileSync(filePath, buffer);

		console.log(`Invoice PDF generated successfully at: ${filePath}`);
		return filePath;
	} catch (error) {
		console.error("Failed to generate sample invoice:", error);
		throw error;
	}
}

// If this file is run directly, generate a sample invoice
if (require.main === module) {
	generateSampleInvoice()
		.then((filePath) => {
			console.log(`Sample invoice saved to: ${filePath}`);
		})
		.catch((err) => {
			console.error("Error:", err);
			process.exit(1);
		});
}
