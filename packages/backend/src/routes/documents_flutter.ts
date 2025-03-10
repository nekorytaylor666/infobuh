import { Hono } from "hono";
import { eq, and, desc } from "drizzle-orm";
import type { HonoEnv } from "../db";
import { documentsFlutter } from "../db/schema";
import { HTTPException } from "hono/http-exception";
import { describeRoute } from "hono-openapi";

export const documentsFlutterRouter = new Hono<HonoEnv>();

// GET all documents for a legal entity
documentsFlutterRouter.get(
  "/:legalEntityId",
  describeRoute({
    description: "Get all documents for a legal entity",
    responses: {
      200: {
        description: "List of documents",
        content: {
          "application/json": {},
        },
      },
      500: {
        description: "Internal server error",
      },
    },
  }),
  async (c) => {
    const legalEntityId = c.req.param("legalEntityId");

    const docs = await c.env.db.query.documentsFlutter.findMany({
      where: eq(documentsFlutter.legalEntityId, legalEntityId),
      orderBy: [desc(documentsFlutter.createdAt)],
    });

    return c.json(docs);
  }
);

// GET a specific document for a legal entity
documentsFlutterRouter.get(
  "/:legalEntityId/:id",
  describeRoute({
    description: "Get a specific document for a legal entity",
    responses: {
      200: {
        description: "Document retrieved successfully",
        content: {
          "application/json": {},
        },
      },
      404: {
        description: "Document not found",
      },
      500: {
        description: "Internal server error",
      },
    },
  }),
  async (c) => {
    const id = c.req.param("id");
    const legalEntityId = c.req.param("legalEntityId");

    const doc = await c.env.db.query.documentsFlutter.findFirst({
      where: and(
        eq(documentsFlutter.id, id),
        eq(documentsFlutter.legalEntityId, legalEntityId)
      ),
    });

    if (!doc) {
      throw new HTTPException(404, { message: "Document not found" });
    }

    return c.json(doc);
  }
);

// POST: Create a new document for a legal entity
documentsFlutterRouter.post(
  "/:legalEntityId",
  describeRoute({
    description: "Create a new document for a legal entity",
    responses: {
      200: {
        description: "Document created successfully",
        content: {
          "application/json": {},
        },
      },
      400: {
        description: "Missing required fields",
      },
      500: {
        description: "Internal server error",
      },
    },
  }),
  async (c) => {
    const legalEntityId = c.req.param("legalEntityId");
    const body = await c.req.json();
    const { type, receiverBin, receiverName, fields, file, cms } = body;

    // Basic validation for required fields
    if (
      !type ||
      !receiverBin ||
      !receiverName ||
      !fields ||
      !file ||
      !file.data ||
      !file.name
    ) {
      throw new HTTPException(400, { message: "Missing required fields or file data" });
    }

    // Create a unique file path (e.g., legalEntityId/timestamp-filename)
    const fileName = file.name;
    const newFilePath = `${legalEntityId}/${Date.now()}-${fileName}`;

    // Convert the base64 encoded file data to a buffer
    const fileBuffer = Buffer.from(file.data, "base64");

    // Upload file to Supabase Storage (bucket "documents")
    const { error: uploadError } = await c.env.supabase.storage
      .from("documents")
      .upload(newFilePath, fileBuffer, {
        contentType: file.contentType || "application/octet-stream",
      });
    if (uploadError) {
      throw new HTTPException(500, { message: "Failed to upload file to storage" });
    }

    // Insert the document record with the uploaded file path
    const newDoc = await c.env.db
      .insert(documentsFlutter)
      .values({
        legalEntityId,
        type,
        receiverBin,
        receiverName,
        fields,
        filePath: newFilePath,
        cms: cms || null,
      })
      .returning();

    return c.json(newDoc[0]);
  }
);

// PUT: Update an existing document for a legal entity (only if not signed and doesn't have CMS)
documentsFlutterRouter.put(
  "/:legalEntityId/:id",
  describeRoute({
    description: "Update an existing document for a legal entity",
    responses: {
      200: {
        description: "Document updated successfully",
        content: {
          "application/json": {},
        },
      },
      400: {
        description: "Cannot update document that is signed or has CMS / Invalid update",
      },
      404: {
        description: "Document not found",
      },
      500: {
        description: "Internal server error",
      },
    },
  }),
  async (c) => {
    const id = c.req.param("id");
    const legalEntityId = c.req.param("legalEntityId");
    const body = await c.req.json();

    // Retrieve the document to check update eligibility
    const doc = await c.env.db.query.documentsFlutter.findFirst({
      where: and(
        eq(documentsFlutter.id, id),
        eq(documentsFlutter.legalEntityId, legalEntityId)
      ),
    });

    if (!doc) {
      throw new HTTPException(404, { message: "Document not found" });
    }

    // Only allow update if the document has not been signed (i.e. cms is not set)
    if (doc.cms) {
      throw new HTTPException(400, { message: "Cannot update document that is signed or has CMS" });
    }

    let updatedFilePath = doc.filePath;
    if (body.file && body.file.data && body.file.name) {
      // Remove the old file from Supabase Storage if exists
      if (doc.filePath) {
        const { error: removeError } = await c.env.supabase.storage
          .from("documents")
          .remove([doc.filePath]);
        if (removeError) {
          throw new HTTPException(500, { message: "Failed to delete old file from storage" });
        }
      }

      // Generate a new unique file path and upload the new file
      const fileName = body.file.name;
      const newFilePath = `${legalEntityId}/${Date.now()}-${fileName}`;
      const fileBuffer = Buffer.from(body.file.data, "base64");
      const { error: uploadError } = await c.env.supabase.storage
        .from("documents")
        .upload(newFilePath, fileBuffer, {
          contentType: body.file.contentType || "application/octet-stream",
        });
      if (uploadError) {
        throw new HTTPException(500, { message: "Failed to upload new file to storage" });
      }
      updatedFilePath = newFilePath;
    }

    // Update the document record with the new file path if applicable
    const updatedDoc = await c.env.db
      .update(documentsFlutter)
      .set({
        type: body.type ?? doc.type,
        receiverBin: body.receiverBin ?? doc.receiverBin,
        receiverName: body.receiverName ?? doc.receiverName,
        fields: body.fields ?? doc.fields,
        filePath: updatedFilePath,
      })
      .where(
        and(
          eq(documentsFlutter.id, id),
          eq(documentsFlutter.legalEntityId, legalEntityId)
        )
      )
      .returning();

    if (!updatedDoc.length) {
      throw new HTTPException(404, { message: "Document not found or update failed" });
    }

    return c.json(updatedDoc[0]);
  }
);
