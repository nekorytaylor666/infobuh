-- Make signerId and legalEntityId nullable in document_signatures_flutter for public signatures
ALTER TABLE "document_signatures_flutter" ALTER COLUMN "signer_id" DROP NOT NULL;
ALTER TABLE "document_signatures_flutter" ALTER COLUMN "legal_entity_id" DROP NOT NULL;
