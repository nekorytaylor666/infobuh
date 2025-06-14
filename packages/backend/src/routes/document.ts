import { Hono } from "hono";
import type { HonoEnv } from "../env";
import { z } from "zod";
import { validator as zValidator } from "hono-openapi/zod";
import { describeRoute } from "hono-openapi";
import { DocumentGenerationService, type DocumentType } from "../lib/accounting-service/document-generation-service";

const documentRouter = new Hono<HonoEnv>();

const documentTypes: [DocumentType, ...DocumentType[]] = ["АВР", "Доверенность", "Накладная", "Инвойс", "КП", "Счет на оплату"];

const generateDocumentSchema = z.object({
    documentType: z.enum(documentTypes),
    data: z.any(),
});

documentRouter.post(
    "/generate",
    describeRoute({
        description: "Generate a document",
        tags: ["Documents"],
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: generateDocumentSchema,
                    },
                },
            },
        },
        responses: {
            200: {
                description: "Document generated successfully",
                content: {
                    "application/pdf": {
                        schema: {
                            type: "string",
                            format: "binary",
                        },
                    },
                },
            },
            400: { description: "Invalid input" },
            401: { description: "Unauthorized" },
            500: { description: "Internal server error" },
        },
    }),
    zValidator("json", generateDocumentSchema),
    async (c) => {
        const { documentType, data } = c.req.valid("json");
        const documentGenerationService = new DocumentGenerationService();

        const result = await documentGenerationService.generateDocument(documentType, data);

        if (result.success) {
            const { createReadStream } = await import("node:fs");
            const stream = createReadStream(result.filePath);

            c.header("Content-Type", "application/pdf");
            c.header("Content-Disposition", `attachment; filename="${result.fileName}"`);
            return c.body(stream as any);
        }

        return c.json(result.error, 500);
    },
);

export { documentRouter }; 