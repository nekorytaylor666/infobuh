# Expense Accrual Feature Implementation

## Overview

This feature implements proper accounting for expense deals with separate accrual and payment entries. It follows the principle that receiving services/goods and paying for them are two separate accounting events.

## Changes Made

### 1. Modified `recordExpensePayment` Method

**File:** `packages/backend/src/lib/accounting-service/deal-accounting-service.ts`

The `recordExpensePayment` method now implements smart accrual management:

#### Key Logic:
1. **Checks** if accrual entry already exists for the deal
2. **Creates accrual entry** ONLY if it doesn't exist and deal type is "service" or "product"
3. **Always creates payment entry** to record the actual payment

#### Accrual Entries (Created only once per deal):
- **For Service deals** (`dealType: "service"`):
  - Creates entry: **7110 (Debit) - 3310 (Credit)**
  - 7110: Services expense account
  - 3310: Accounts Payable

- **For Product deals** (`dealType: "product"`):
  - Creates entry: **1330 (Debit) - 3310 (Credit)**
  - 1330: Inventory account
  - 3310: Accounts Payable

#### Payment Entry (Created every time):
- **Always creates**: **3310 (Debit) - 1010/1030 (Credit)**
- 3310: Accounts Payable (погашение задолженности)
- 1010: Cash account (if paymentMethod: "cash")
- 1030: Bank account (if paymentMethod: "bank" or default)

#### Behavior

When calling `POST /deals/:dealId/expense-payments`:

1. Checks if accrual entry (invoice type) exists for this deal
2. If NO accrual exists AND deal is service/product → Creates accrual entry
3. Always creates payment entry: 3310 (Debit) - 1030/1010 (Credit)
4. Updates deal paid amount
5. Returns both journal entries in response (accrualJournalEntry is null if already existed)

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

### Example 1: Accrual First, Then Payment (Recommended Flow)

**Step 1: Record accrual when service is received**

```bash
POST /deals/abc-123-def/expense-accrual?legalEntityId=xyz-456

{
  "amount": 50000,
  "currencyId": "currency-uuid",
  "description": "Consulting services received"
}
```

**Result:**
- Creates accrual entry: 7110 (Debit 50,000) - 3310 (Credit 50,000)
- Does NOT update deal paid amount

**Step 2: Record payment later**

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
- Creates payment entry: 3310 (Debit 50,000) - 1030 (Credit 50,000)
- Does NOT create duplicate accrual (already exists)
- Updates deal paid amount by 50,000

### Example 2: Payment + Accrual Together (Quick Flow)

For a service deal, first payment:

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
- Creates accrual entry: 7110 (Debit 50,000) - 3310 (Credit 50,000)
- Creates payment entry: 3310 (Debit 50,000) - 1030 (Credit 50,000)
- Updates deal paid amount by 50,000

### Example 3: Second Payment (No Duplicate Accrual)

```bash
POST /deals/abc-123-def/expense-payments?legalEntityId=xyz-456

{
  "amount": 30000,
  "currencyId": "currency-uuid",
  "description": "Second payment installment"
}
```

**Result:**
- Does NOT create accrual entry (already exists from previous payment)
- Creates payment entry: 3310 (Debit 30,000) - 1010 (Credit 30,000)
- Updates deal paid amount by 30,000 (total now 80,000)

### Example 4: Product Deal

```bash
POST /deals/abc-123-def/expense-accrual?legalEntityId=xyz-456

{
  "amount": 100000,
  "currencyId": "currency-uuid",
  "description": "Inventory received"
}
```

**Result:**
- Creates accrual entry: 1330 (Debit 100,000) - 3310 (Credit 100,000)
- Does NOT update deal paid amount

## Account Codes Used

| Code | Account Name | Type | Used In |
|------|--------------|------|---------|
| 1010 | Касса (Cash) | Asset | Payment entry (Credit) |
| 1030 | Банковский счет (Bank) | Asset | Payment entry (Credit) |
| 1330 | Товары (Inventory) | Asset | Accrual entry for products (Debit) |
| 3310 | Кредиторская задолженность (Accounts Payable) | Liability | Accrual entry (Credit), Payment entry (Debit) |
| 7110 | Расходы на услуги (Service Expenses) | Expense | Accrual entry for services (Debit) |

## Accounting Flow Explained

### When You Receive Service/Goods (Accrual)
```
Debit:  7110 or 1330  (Your expense/asset increases)
Credit: 3310          (Your liability/debt increases)
```

### When You Pay (Payment)
```
Debit:  3310          (Your liability/debt decreases)
Credit: 1010 or 1030  (Your cash/bank decreases)
```

### Net Effect
After both entries, the account 3310 balances out:
- First entry: +100,000 credit (you owe)
- Second entry: +100,000 debit (you pay)
- Net: 0 (debt is settled)

## Backwards Compatibility

- ✅ Existing expense payment calls work without changes
- ✅ If deal type is not "service" or "product", only payment entry is created
- ✅ The `accrualJournalEntry` field in response is nullable/optional
- ⚠️ **Changed:** Payment entry now uses 3310-1010/1030 instead of 6010-1030
- ⚠️ **Changed:** Accrual entries are not duplicated on subsequent payments

## Testing

### Test Scenario 1: Accrual Then Payment
1. Create a deal with type "service"
2. Call accrual endpoint with amount 100,000
3. Verify one entry created (type: "invoice")
4. Call payment endpoint with amount 100,000
5. Verify second entry created (type: "payment")
6. Check that accrual entry was NOT duplicated

### Test Scenario 2: Payment Without Prior Accrual
1. Create a deal with type "service"
2. Call payment endpoint with amount 100,000
3. Verify TWO entries created:
   - One with type "invoice" (accrual)
   - One with type "payment"

### Test Scenario 3: Multiple Payments
1. Create a deal with totalAmount 200,000
2. Call payment endpoint with amount 100,000
3. Verify two entries created
4. Call payment endpoint again with amount 100,000
5. Verify only ONE new entry created (payment)
6. Total should be 3 entries: 1 accrual + 2 payments

## Notes

- Both accrual and payment entries are created in a single transaction
- If any entry creation fails, the entire transaction is rolled back
- All entries are linked to the deal via `deal_journal_entries` table
- Entry type "invoice" is used for accrual entries
- Entry type "payment" is used for payment entries
- System checks for existing "invoice" type entries to prevent duplicates
- The same amount is used for both accrual and payment entries

