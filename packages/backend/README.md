# Document Templates System

This module provides a system for generating dynamic documents based on JSON schemas and Zod validation, with PDF generation using React PDF.

## Features

- Define document templates with JSON Schema and Zod validation
- Generate React Hook Form schemas for dynamic form rendering
- Create PDFs from document data using React PDF
- Save generated documents to storage
- Built-in invoice template example

## API Endpoints

### Document Templates

- `GET /document-templates/:legalEntityId` - Get all templates for a legal entity
- `GET /document-templates/:legalEntityId/:id` - Get a specific template
- `POST /document-templates/:legalEntityId` - Create a new template
- `PUT /document-templates/:legalEntityId/:id` - Update a template
- `DELETE /document-templates/:legalEntityId/:id` - Delete a template
- `POST /document-templates/:legalEntityId/from-example` - Create a template from a predefined example

### Generated Documents

- `POST /document-templates/:legalEntityId/:id/generate` - Generate a document from a template
- `GET /document-templates/:legalEntityId/:id/generated` - Get all generated documents for a template
- `GET /document-templates/:legalEntityId/generated/:docId` - Get a specific generated document
- `POST /document-templates/:legalEntityId/generated/:docId/pdf` - Generate a PDF from a document
- `POST /document-templates/:legalEntityId/generated/:docId/save-pdf` - Save a generated PDF to storage

### Testing

- `GET /document-templates/test-pdf` - Generate a sample invoice PDF for testing

## Usage Example

### 1. Create a template from the example invoice

```typescript
// POST /document-templates/:legalEntityId/from-example
const response = await fetch(
  "/document-templates/your-legal-entity-id/from-example",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      templateType: "invoice",
      createdById: "your-user-id",
    }),
  }
);

const template = await response.json();
```

### 2. Generate a document from the template

```typescript
// POST /document-templates/:legalEntityId/:templateId/generate
const documentData = {
  invoiceNumber: "INV-2023-001",
  date: "2023-05-15",
  dueDate: "2023-06-15",
  company: {
    name: "Your Company",
    address: "123 Main St",
    // ... other fields
  },
  // ... other fields according to the schema
};

const response = await fetch(
  `/document-templates/:legalEntityId/${template.id}/generate`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Invoice for Client A",
      documentData,
      createdById: "your-user-id",
    }),
  }
);

const generatedDoc = await response.json();
```

### 3. Generate a PDF from the document

```typescript
// GET /document-templates/:legalEntityId/generated/:docId/pdf
const pdfResponse = await fetch(
  `/document-templates/:legalEntityId/generated/${generatedDoc.id}/pdf`
);
const pdfBlob = await pdfResponse.blob();

// Display PDF in browser
const pdfUrl = URL.createObjectURL(pdfBlob);
window.open(pdfUrl, "_blank");
```

### 4. Save the PDF to storage

```typescript
// POST /document-templates/:legalEntityId/generated/:docId/save-pdf
const saveResponse = await fetch(
  `/document-templates/:legalEntityId/generated/${generatedDoc.id}/save-pdf`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ownerId: "your-user-id",
      parentId: "optional-folder-id", // If you want to save to a specific folder
    }),
  }
);

const savedDoc = await saveResponse.json();
```

## Frontend Integration

### Using with React Hook Form

The JSON Schema generated from Zod can be used with libraries like `@hookform/resolvers/zod` to create dynamic forms:

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Fetched template with Zod schema
const template = await fetchTemplate(templateId);
const zodSchema = eval(`(${template.zodSchema})`);

// Create form with React Hook Form
const form = useForm({
  resolver: zodResolver(zodSchema),
  defaultValues: {},
});

// Render form fields based on schema
// ...

// Handle form submission
const onSubmit = async (data) => {
  const response = await fetch(
    `/document-templates/:legalEntityId/${template.id}/generate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Document Name",
        documentData: data,
        createdById: "user-id",
      }),
    }
  );

  const generatedDoc = await response.json();
  // Proceed to generate PDF, etc.
};
```

## Custom Templates

To create custom templates, you need to define:

1. A Zod schema for validation
2. A PDF template that defines the layout for React PDF

```typescript
// Define a Zod schema
const mySchema = z.object({
  // Your schema definition
});

// Define a PDF template
const myPdfTemplate = {
  documentTitle: "My Document",
  layout: {
    sections: [
      // Define sections and components
    ],
  },
};

// Create a template
const response = await fetch("/document-templates/:legalEntityId", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "My Custom Template",
    description: "A custom document template",
    zodSchema: mySchema.toString(),
    pdfTemplate: myPdfTemplate,
    createdById: "your-user-id",
  }),
});
```
