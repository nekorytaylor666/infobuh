# Document Templates Migration Guide

This package was extracted from the backend package to be reused across different parts of the application. It contains:

1. PDF generation service
2. Document templates for various Kazakhstan documents (invoices, acts, waybill)

## What Changed

- Document templates are now a separate package in the monorepo
- The package is imported as `@accounting-kz/document-templates`
- All schema types, templates, and PDF service functions are exported from the package root

## How to Use

### In Backend

```typescript
// Import from the package instead of relative paths
import {
  createDocumentGenerator,
  kazakhInvoiceInputSchema,
} from "@accounting-kz/document-templates";

// Usage remains the same
const documentGenerator = createDocumentGenerator(db);
const result = await documentGenerator.generate("generateInvoice", props);
```

### Building

The package needs to be built before use:

```bash
# From monorepo root
pnpm build

# Or directly
cd packages/document-templates
pnpm build
```
