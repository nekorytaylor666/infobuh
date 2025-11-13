# 📋 Expense Accrual Feature - Quick Summary

## ✅ What Was Implemented

### 1. Enhanced Expense Payment Endpoint
**Endpoint:** `POST /deals/:dealId/expense-payments`

**What it does now:**
- Records the payment entry (existing functionality)
- **NEW:** Automatically creates accrual entries based on deal type
- Returns both entries in the response

**Accrual entries created:**
- **Service deals** → Creates: `7110 (Debit) - 3310 (Credit)`
- **Product deals** → Creates: `1330 (Debit) - 3310 (Credit)`
- **Other types** → No accrual entry (keeps existing behavior)

### 2. New Standalone Accrual Endpoint
**Endpoint:** `POST /deals/:dealId/expense-accrual`

**What it does:**
- Records ONLY the accrual entry (no payment)
- Useful for recording received services/goods before payment
- Does NOT update deal's paid amount

## 🎯 Usage Scenarios

### Scenario A: Payment with Automatic Accrual
**When to use:** You're paying for a service/product that was just received

```
POST /deals/:dealId/expense-payments

Result:
✓ Payment recorded (6010 → 1030)
✓ Accrual recorded (7110 → 3310 or 1330 → 3310)
✓ Deal paid amount updated
```

### Scenario B: Accrual Only (No Payment Yet)
**When to use:** You received services/goods but haven't paid yet

```
POST /deals/:dealId/expense-accrual

Result:
✓ Accrual recorded (7110 → 3310 or 1330 → 3310)
✗ Deal paid amount NOT updated (payment pending)
```

## 📊 Accounting Entries

### For Services (dealType: "service")
```
Payment Entry:
  Debit:  6010 (Expenses)         100,000
  Credit: 1030 (Bank)             100,000

Accrual Entry:
  Debit:  7110 (Service Expenses)  100,000
  Credit: 3310 (Accounts Payable)  100,000
```

### For Products (dealType: "product")
```
Payment Entry:
  Debit:  6010 (Expenses)         100,000
  Credit: 1030 (Bank)             100,000

Accrual Entry:
  Debit:  1330 (Inventory)        100,000
  Credit: 3310 (Accounts Payable) 100,000
```

## 🔄 Response Changes

### Updated Response Structure
```json
{
  "deal": { ... },
  "journalEntry": { ... },
  "accrualJournalEntry": {  // ← NEW FIELD
    "id": "uuid",
    "entryNumber": "JE-xxx",
    "description": "...",
    "status": "draft"
  }
}
```

Note: `accrualJournalEntry` is `null` if deal type is not service/product

## ✨ Key Features

- ✅ **Automatic:** No need to manually create accrual entries
- ✅ **Type-based:** Different accounts based on service vs product
- ✅ **Transactional:** Both entries created atomically (all or nothing)
- ✅ **Backwards compatible:** Existing calls work unchanged
- ✅ **Flexible:** Separate endpoint for accrual-only scenarios

## 🧪 Quick Test

1. Create a service deal
2. Call: `POST /deals/{dealId}/expense-payments` with amount
3. Check transactions: `GET /deals/{dealId}/transactions`
4. You should see 2 journal entries:
   - One with entry type "payment"
   - One with entry type "invoice"

## 📝 Important Notes

- Accrual entries are only created for "service" and "product" deal types
- If deal type is missing or different, only payment entry is created
- The accrual endpoint REQUIRES deal type to be service or product
- All entries are linked to the deal in `deal_journal_entries` table

