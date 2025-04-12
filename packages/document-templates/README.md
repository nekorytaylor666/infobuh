# Document Templates

This package contains document templates for generating various PDF documents for Kazakhstan accounting requirements.

## Available Templates

- Kazakh Invoice
- Kazakh Acts
- Kazakh Waybill

## Usage

```typescript
import {
  pdfService,
  createDocumentGenerator,
} from "@accounting-kz/document-templates";

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

// Access the PDF buffer
const pdfBuffer = result.pdfBuffer;
```
