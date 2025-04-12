CREATE TABLE "document_templates" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "json_schema" JSONB NOT NULL,
    "zod_schema" TEXT NOT NULL,
    "pdf_template" JSONB,
    "legal_entity_id" UUID NOT NULL REFERENCES "legal_entities"("id") ON DELETE CASCADE,
    "created_by_id" UUID NOT NULL REFERENCES "profile"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "generated_documents" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "template_id" UUID NOT NULL REFERENCES "document_templates"("id") ON DELETE CASCADE,
    "document_data" JSONB NOT NULL,
    "pdf_path" TEXT,
    "document_id" UUID REFERENCES "documents"("id") ON DELETE SET NULL,
    "legal_entity_id" UUID NOT NULL REFERENCES "legal_entities"("id") ON DELETE CASCADE,
    "created_by_id" UUID NOT NULL REFERENCES "profile"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX "document_templates_legal_entity_id_idx" ON "document_templates" ("legal_entity_id");
CREATE INDEX "document_templates_created_by_id_idx" ON "document_templates" ("created_by_id");
CREATE INDEX "generated_documents_template_id_idx" ON "generated_documents" ("template_id");
CREATE INDEX "generated_documents_document_id_idx" ON "generated_documents" ("document_id");
CREATE INDEX "generated_documents_legal_entity_id_idx" ON "generated_documents" ("legal_entity_id");
CREATE INDEX "generated_documents_created_by_id_idx" ON "generated_documents" ("created_by_id"); 