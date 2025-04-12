import { Hono } from "hono";
import type { HonoEnv } from "../db";
import { partners } from "../db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { eq, and } from "drizzle-orm";

// Create Zod schemas for partners based on the Drizzle definitions.
const partnerZodSchema = createSelectSchema(partners);
const partnerInsertSchema = createInsertSchema(partners);

const router = new Hono<HonoEnv>();

// GET all partners for a legal entity
router.get(
  "/:legalEntityId",
  describeRoute({
    description: "Get all partners for a legal entity",
    tags: ["Partners"],
    responses: {
      200: {
        description: "List of partners",
        content: {
          "application/json": {
            schema: resolver(z.array(partnerZodSchema)),
          },
        },
      },
      500: { description: "Internal server error" },
    },
  }),
  async (c) => {
    try {
      const legalEntityId = c.req.param("legalEntityId");
      const partnersList = await c.env.db.query.partners.findMany({
        where: eq(partners.legalEntityId, legalEntityId),
      });
      return c.json(partnersList);
    } catch (error) {
      console.error("Error fetching partners:", error);
      return c.json({ error: "Failed to fetch partners" }, 500);
    }
  }
);

// GET a single partner by id
router.get(
  "/:legalEntityId/:id",
  describeRoute({
    description: "Get a single partner",
    tags: ["Partners"],
    responses: {
      200: {
        description: "Partner details",
        content: {
          "application/json": {
            schema: resolver(partnerZodSchema),
          },
        },
      },
      404: { description: "Partner not found" },
      500: { description: "Internal server error" },
    },
  }),
  async (c) => {
    try {
      const legalEntityId = c.req.param("legalEntityId");
      const id = c.req.param("id");
      const partner = await c.env.db.query.partners.findFirst({
        where: and(eq(partners.id, id), eq(partners.legalEntityId, legalEntityId)),
      });
      if (!partner) {
        return c.json({ error: "Partner not found" }, 404);
      }
      return c.json(partner);
    } catch (error) {
      console.error("Error fetching partner:", error);
      return c.json({ error: "Failed to fetch partner" }, 500);
    }
  }
);

// Create a new partner
router.post(
  "/:legalEntityId",
  describeRoute({
    description: "Create a new partner",
    tags: ["Partners"],
    responses: {
      201: {
        description: "Partner created",
        content: {
          "application/json": {
            schema: resolver(partnerZodSchema),
          },
        },
      },
      400: { description: "Invalid input" },
      500: { description: "Internal server error" },
    },
  }),
  zValidator("json", partnerInsertSchema),
  async (c) => {
    try {
      const legalEntityId = c.req.param("legalEntityId");
      const data = await c.req.json();
      const validatedData = partnerInsertSchema.parse(data);

      const [newPartner] = await c.env.db
        .insert(partners)
        .values({
          ...validatedData,
          legalEntityId: legalEntityId,
        })
        .returning();

      return c.json(newPartner, 201);
    } catch (error) {
      console.error("Error creating partner:", error);
      if (error instanceof z.ZodError) {
        return c.json({ error: error.errors }, 400);
      }
      return c.json({ error: "Failed to create partner" }, 500);
    }
  }
);

// Update an existing partner
router.put(
  "/:legalEntityId/:id",
  describeRoute({
    description: "Update a partner",
    tags: ["Partners"],
    responses: {
      200: {
        description: "Partner updated",
        content: {
          "application/json": {
            schema: resolver(partnerZodSchema),
          },
        },
      },
      404: { description: "Partner not found" },
      400: { description: "Invalid input" },
      500: { description: "Internal server error" },
    },
  }),
  zValidator("json", partnerZodSchema.partial()),
  async (c) => {
    try {
      const legalEntityId = c.req.param("legalEntityId");
      const id = c.req.param("id");
      const data = await c.req.json();
      const validatedData = partnerZodSchema.partial().parse(data);

      const [updatedPartner] = await c.env.db
        .update(partners)
        .set({ ...validatedData })
        .where(and(eq(partners.id, id), eq(partners.legalEntityId, legalEntityId)))
        .returning();

      if (!updatedPartner) {
        return c.json({ error: "Partner not found" }, 404);
      }

      return c.json(updatedPartner);
    } catch (error) {
      console.error("Error updating partner:", error);
      if (error instanceof z.ZodError) {
        return c.json({ error: error.errors }, 400);
      }
      return c.json({ error: "Failed to update partner" }, 500);
    }
  }
);

export default router;
