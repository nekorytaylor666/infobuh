# Expense Accrual Feature Implementation

## Overview

This feature adds automatic accounting entries based on deal type when recording expense payments. It also provides a separate endpoint for recording accruals without payments.

## Changes Made

### 1. Modified `recordExpensePayment` Method

**File:** `packages/backend/src/lib/accounting-service/deal-accounting-service.ts`

The `recordExpensePayment` method now automatically creates additional accrual entries based on the deal type:

- **For Service deals** (`dealType: "service"`):
  - Creates entry: **7110 (Debit) - 3310 (Credit)**
  - 7110: Services expense account
  - 3310: Accounts Payable

- **For Product deals** (`dealType: "product"`):
  - Creates entry: **1330 (Debit) - 3310 (Credit)**
  - 1330: Inventory account
  - 3310: Accounts Payable

- **For other deal types or unspecified**:
  - Only creates the payment entry (existing behavior preserved)
  - No accrual entries are created

#### Behavior

When calling `POST /deals/:dealId/expense-payments`:

1. Creates payment entry: 6010 (Debit) - 1030/1010 (Credit)
2. If deal type is "service" or "product", creates accrual entry based on type
3. Returns both journal entries in response

### 2. New `recordExpenseAccrual` Method

**File:** `packages/backend/src/lib/accounting-service/deal-accounting-service.ts`

A new service method for recording accrual entries without payments:

```typescript
async recordExpenseAccrual(params: {
  dealId: string;
  amount: number;
  description?: string;
  reference?: string;
  legalEntityId: string;
  currencyId: string;
  createdBy: string;
})
```

- **Requires** deal type to be "service" or "product"
- Creates only the accrual entry (7110-3310 or 1330-3310)
- Does NOT update the deal's paid amount
- Links the journal entry to the deal

### 3. New API Endpoint: `POST /deals/:dealId/expense-accrual`

**File:** `packages/backend/src/routes/deal.ts`

A new endpoint for recording expense accruals without payment:

**Request:**
```json
{
  "amount": 100000,
  "description": "Optional description",
  "reference": "Optional reference",
  "currencyId": "uuid"
}
```

**Response:**
```json
{
  "deal": { /* deal object */ },
  "journalEntry": {
    "id": "uuid",
    "entryNumber": "JE-xxxx",
    "description": "Начисление: услуги/товары от Partner Name",
    "status": "draft"
  }
}
```

**Error Cases:**
- 400: Deal type is not "service" or "product"
- 404: Deal not found
- 401: Unauthorized

### 4. Updated `POST /deals/:dealId/expense-payments` Response

The response now includes an optional `accrualJournalEntry` field:

```json
{
  "deal": { /* deal object */ },
  "journalEntry": { /* payment entry */ },
  "accrualJournalEntry": { /* accrual entry (null if deal type not service/product) */ }
}
```

## Usage Examples

### Example 1: Record Expense Payment with Automatic Accrual

For a service deal:

```bash
POST /deals/abc-123-def/expense-payments?legalEntityId=xyz-456

{
  "amount": 50000,
  "currencyId": "currency-uuid",
  "description": "Payment for consulting services",
  "paymentMethod": "bank"
}
```

**Result:**
- Creates payment entry: 6010 (Debit 50,000) - 1030 (Credit 50,000)
- Creates accrual entry: 7110 (Debit 50,000) - 3310 (Credit 50,000)
- Updates deal paid amount by 50,000

### Example 2: Record Only Accrual (No Payment)

```bash
POST /deals/abc-123-def/expense-accrual?legalEntityId=xyz-456

{
  "amount": 30000,
  "currencyId": "currency-uuid",
  "description": "Service received, payment pending"
}
```

**Result:**
- Creates accrual entry: 7110 (Debit 30,000) - 3310 (Credit 30,000)
- Does NOT update deal paid amount

### Example 3: Product Deal

```bash
POST /deals/abc-123-def/expense-payments?legalEntityId=xyz-456

{
  "amount": 100000,
  "currencyId": "currency-uuid",
  "dealType": "product"
}
```

**Result:**
- Creates payment entry: 6010 (Debit 100,000) - 1030 (Credit 100,000)
- Creates accrual entry: 1330 (Debit 100,000) - 3310 (Credit 100,000)
- Updates deal paid amount by 100,000

## Account Codes Used

| Code | Account Name | Type |
|------|--------------|------|
| 1010 | Cash | Asset |
| 1030 | Bank Account | Asset |
| 1330 | Inventory | Asset |
| 3310 | Accounts Payable | Liability |
| 6010 | Expense Account | Expense |
| 7110 | Services Expense | Expense |

## Backwards Compatibility

- Existing expense payment calls work without changes
- If deal type is not "service" or "product", only payment entry is created (original behavior)
- The `accrualJournalEntry` field in response is nullable/optional

## Testing

To test the feature:

1. Create a deal with type "service" or "product"
2. Call the expense payment endpoint
3. Check that two journal entries are created
4. Verify the account codes match the deal type

## Notes

- Both entries are created in a single transaction
- If the accrual entry creation fails, the entire transaction is rolled back
- The accrual entries are linked to the deal via `deal_journal_entries` table
- Entry type for accrual is set to "invoice" to distinguish from payment entries

