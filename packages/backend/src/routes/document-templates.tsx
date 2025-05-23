import { Hono } from "hono";
import type { HonoEnv } from "../env";
import { HTTPException } from "hono/http-exception";
import { z, ZodError } from "zod";
import {
  kazakhInvoiceInputSchema,
  createDocumentGenerator,
  kazakhActInputSchema,
  kazakhWaybillInputSchema,
  type KazakhActInput,
} from "@accounting-kz/document-templates";
import "zod-openapi/extend";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
// Register templates
export const documentTemplatesRouter = new Hono<HonoEnv>();

// Generate a Kazakh invoice PDF
documentTemplatesRouter.post(
  "/kazakh-invoice",
  describeRoute({
    description: "Generate a Kazakh invoice PDF",
    responses: {
      200: {
        description: "Kazakh invoice PDF generated successfully",
        content: {
          "application/json": {
            schema: resolver(
              z.object({
                documentId: z.string().uuid(),
                pdfBuffer: z.instanceof(Buffer),
              })
            ),
          },
        },
      },
      400: {
        description: "Invalid input",
      },
      500: {
        description: "Failed to generate invoice PDF",
      },
    },
  }),
  zValidator("json", kazakhInvoiceInputSchema),
  async (c) => {
    try {
      // 1. Parse and validate input
      const body = await c.req.json();

      // 2. Generate invoice using our service
      const result = await createDocumentGenerator(c.env.db).generate(
        "generateInvoice",
        {
          ...body,
        }
      );

      // 3. Return response
      return c.json(result);
    } catch (error) {
      console.error("Error generating Kazakh invoice PDF:", error);

      if (error instanceof ZodError) {
        throw new HTTPException(400, {
          message: "Invalid input",
        });
      }

      throw new HTTPException(500, {
        message: "Failed to generate invoice PDF",
      });
    }
  }
);

// Generate a Kazakh act PDF
documentTemplatesRouter.post(
  "/kazakh-act",
  describeRoute({
    description: "Generate a Kazakh act of completed works PDF",

    responses: {
      200: {
        description: "Kazakh act PDF generated successfully",
        content: {
          "application/json": {
            schema: resolver(
              z.object({
                documentId: z.string().uuid(),
                pdfBuffer: z.instanceof(Buffer),
              })
            ),
          },
        },
      },
      400: {
        description: "Invalid input",
      },
      500: {
        description: "Failed to generate act PDF",
      },
    },
  }),
  zValidator("json", kazakhActInputSchema),
  async (c) => {
    try {
      // Parse and validate input
      const body = await c.req.json<KazakhActInput>();

      // Generate act using our service
      const result = await createDocumentGenerator(c.env.db).generate(
        "generateAct",
        { ...body }
      );

      // Return response
      return c.json(result);
    } catch (error) {
      console.error("Error generating Kazakh act PDF:", error);

      if (error instanceof ZodError) {
        throw new HTTPException(400, {
          message: "Invalid input",
        });
      }

      throw new HTTPException(500, {
        message: "Failed to generate act PDF",
      });
    }
  }
);

// Generate a Kazakh waybill PDF
documentTemplatesRouter.post(
  "/kazakh-waybill",
  describeRoute({
    description: "Generate a Kazakh waybill PDF",

    responses: {
      200: {
        description: "Kazakh waybill PDF generated successfully",
        content: {
          "application/json": {
            schema: resolver(
              z.object({
                documentId: z.string().uuid(),
                pdfBuffer: z.instanceof(Buffer),
              })
            ),
          },
        },
      },
      400: {
        description: "Invalid input",
      },
      500: {
        description: "Failed to generate waybill PDF",
      },
    },
  }),
  zValidator("json", kazakhWaybillInputSchema),
  async (c) => {
    try {
      // Parse and validate input
      const body = await c.req.json();

      // Generate waybill using our service
      const result = await createDocumentGenerator(c.env.db).generate(
        "generateWaybill",
        {
          ...body,
        }
      );

      // Return response
      return c.json(result);
    } catch (error) {
      console.error("Error generating Kazakh waybill PDF:", error);

      if (error instanceof ZodError) {
        throw new HTTPException(400, {
          message: "Invalid input",
        });
      }

      throw new HTTPException(500, {
        message: "Failed to generate waybill PDF",
      });
    }
  }
);
