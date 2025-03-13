import { Hono } from "hono";
import { eq, and, desc } from "drizzle-orm";
import type { HonoEnv } from "../db";
import { documentTemplates, generatedDocuments, documents } from "../db/schema";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import * as zodToJsonSchema from "zod-to-json-schema";
import {
	invoiceSchema,
	invoicePdfTemplate,
} from "../lib/document-templates/example-invoice";
import {
	generatePdf,
	generateInvoicePdf,
	generateKazakhInvoicePdf,
} from "../lib/document-templates/react-pdf-generator";
import { sampleInvoiceData } from "../lib/document-templates/sample-invoice-data";
import { kazakhSampleInvoiceData } from "../lib/document-templates/kazakh-sample-invoice-data";
import fs from "fs";
export const documentTemplatesRouter = new Hono<HonoEnv>();

// Helper function to convert Zod schema to JSON Schema
function zodToJSON(zodSchema: string): any {
	try {
		// Parse the Zod schema string into a real Zod schema
		// This is safe because we're evaluating our own code that we saved
		// eslint-disable-next-line no-eval
		const parsedZodSchema = eval(`(${zodSchema})`);

		// Convert to JSON Schema
		return zodToJsonSchema.default(parsedZodSchema);
	} catch (error) {
		console.error("Error converting Zod schema to JSON schema:", error);
		throw new Error("Invalid Zod schema");
	}
}

// Schema for validating document template creation
const createDocumentTemplateSchema = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
	zodSchema: z.string().min(1, "Zod schema is required"),
	pdfTemplate: z.any().optional(),
	legalEntityId: z.string().uuid("Invalid legal entity ID"),
	createdById: z.string().uuid("Invalid user ID"),
});

// Test endpoint for generating a sample invoice PDF
documentTemplatesRouter.get("/test-pdf", async (c) => {
	try {
		// Generate PDF using the sample data and our React invoice template
		const pdfBuffer = await generateInvoicePdf(sampleInvoiceData);

		// Set headers for the PDF response
		c.header("Content-Type", "application/pdf");
		c.header("Content-Disposition", 'inline; filename="sample-invoice.pdf"');
		fs.writeFileSync(`${__dirname}/sample-invoice.pdf`, pdfBuffer);

		// Return the PDF buffer as the response body
		return c.body(pdfBuffer);
	} catch (error) {
		console.error("Error generating test PDF:", error);
		throw new HTTPException(500, { message: "Failed to generate test PDF" });
	}
});

// Test endpoint for generating a Kazakh invoice PDF
documentTemplatesRouter.get("/test-kazakh-invoice", async (c) => {
	try {
		// Generate PDF using the Kazakh sample data and template
		const pdfBuffer = await generateKazakhInvoicePdf(kazakhSampleInvoiceData);

		// Set headers for the PDF response
		c.header("Content-Type", "application/pdf");
		c.header("Content-Disposition", 'inline; filename="kazakh-invoice.pdf"');

		fs.writeFileSync(`${__dirname}/kazakh-invoice.pdf`, pdfBuffer);

		// Return the PDF buffer as the response body
		return c.body(pdfBuffer);
	} catch (error) {
		console.error("Error generating Kazakh invoice PDF:", error);
		throw new HTTPException(500, {
			message: "Failed to generate Kazakh invoice PDF",
		});
	}
});
