import { Hono } from "hono";
import type { HonoEnv } from "../db";
import { products } from "../db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { eq, and } from "drizzle-orm";

const productZodSchema = createSelectSchema(products);
const productInsertSchema = createInsertSchema(products);

const router = new Hono<HonoEnv>();

router.get(
  "/:legalEntityId",
  describeRoute({
    description: "Get all products for a legal entity",
    tags: ["Products"],
    responses: {
      200: {
        description: "List of products",
        content: {
          "application/json": {
            schema: resolver(z.array(productZodSchema)),
          },
        },
      },
      500: { description: "Internal server error" },
    },
  }),
  async (c) => {
    try {
      const legalEntityId = c.req.param("legalEntityId");
      const productsList = await c.env.db.query.products.findMany({
        where: eq(products.legalEntityId, legalEntityId),
      });
      return c.json(productsList);
    } catch (error) {
      console.error("Error fetching products:", error);
      return c.json({ error: "Failed to fetch products" }, 500);
    }
  }
);

// GET a single product by id for a legal entity
router.get(
  "/:legalEntityId/:id",
  describeRoute({
    description: "Get a single product",
    tags: ["Products"],
    responses: {
      200: {
        description: "Product details",
        content: {
          "application/json": {
            schema: resolver(productZodSchema),
          },
        },
      },
      404: { description: "Product not found" },
      500: { description: "Internal server error" },
    },
  }),
  async (c) => {
    try {
      const legalEntityId = c.req.param("legalEntityId");
      const id = c.req.param("id");
      const product = await c.env.db.query.products.findFirst({
        where: and(eq(products.id, id), eq(products.legalEntityId, legalEntityId)),
      });
      if (!product) {
        return c.json({ error: "Product not found" }, 404);
      }
      return c.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      return c.json({ error: "Failed to fetch product" }, 500);
    }
  }
);

router.post(
  "/:legalEntityId",
  describeRoute({
    description: "Create a new product",
    tags: ["Products"],
    responses: {
      201: {
        description: "Product created",
        content: {
          "application/json": {
            schema: resolver(productZodSchema),
          },
        },
      },
      400: { description: "Invalid input" },
      500: { description: "Internal server error" },
    },
  }),
  zValidator("json", productInsertSchema),
  async (c) => {
    try {
      const legalEntityId = c.req.param("legalEntityId");
      const data = await c.req.json();
      const validatedData = productInsertSchema.parse(data);

      // Ensure legalEntityId is set from the route
      const [newProduct] = await c.env.db
        .insert(products)
        .values({
          ...validatedData,
          legalEntityId,
        })
        .returning();

      return c.json(newProduct, 201);
    } catch (error) {
      console.error("Error creating product:", error);
      if (error instanceof z.ZodError) {
        return c.json({ error: error.errors }, 400);
      }
      return c.json({ error: "Failed to create product" }, 500);
    }
  }
);

// PUT update an existing product (ensuring the product belongs to the specified legal entity)
router.put(
  "/:legalEntityId/:id",
  describeRoute({
    description: "Update a product",
    tags: ["Products"],
    responses: {
      200: {
        description: "Product updated",
        content: {
          "application/json": {
            schema: resolver(productZodSchema),
          },
        },
      },
      404: { description: "Product not found" },
      400: { description: "Invalid input" },
      500: { description: "Internal server error" },
    },
  }),
  zValidator("json", productZodSchema.partial()),
  async (c) => {
    try {
      const legalEntityId = c.req.param("legalEntityId");
      const id = c.req.param("id");
      const data = await c.req.json();
      const validatedData = productZodSchema.partial().parse(data);

      const [updatedProduct] = await c.env.db
        .update(products)
        .set(validatedData)
        .where(and(eq(products.id, id), eq(products.legalEntityId, legalEntityId)))
        .returning();

      if (!updatedProduct) {
        return c.json({ error: "Product not found" }, 404);
      }

      return c.json(updatedProduct);
    } catch (error) {
      console.error("Error updating product:", error);
      if (error instanceof z.ZodError) {
        return c.json({ error: error.errors }, 400);
      }
      return c.json({ error: "Failed to update product" }, 500);
    }
  }
);

export default router;
