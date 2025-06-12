# Document Templates

This package contains document templates for generating various PDF documents for Kazakhstan accounting requirements.
It uses [Typst](https://typst.app/) to compile `.typ` templates into PDFs.

## Prerequisites

You must have the `typst` CLI installed on your system. Please follow the installation instructions on the official Typst repository: https://github.com/typst/typst

## Available Templates

- Kazakh Invoice
- Kazakh Acts
- Kazakh Waybill
- Kazakh Doverennost (Power of Attorney)

## Usage

```typescript
import { createDocumentGenerator } from "@accounting-kz/document-templates";

// Create a document generator with your database
const documentGenerator = createDocumentGenerator(db);

// Generate an invoice
const invoiceProps = {
  // ... invoice data
};
const result = await documentGenerator.generate(
  "generateInvoice",
  invoiceProps
);

// Access the PDF file path
const pdfFilePath = result.filePath;
```

## Building

The package needs to be built before use:

```bash
# From monorepo root
pnpm build

# Or directly
cd packages/document-templates
pnpm build
```
