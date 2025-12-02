# 📋 Expense Accrual Feature - Quick Summary

## ✅ What Was Implemented

### 1. Enhanced Expense Payment Endpoint
**Endpoint:** `POST /deals/:dealId/expense-payments`

**What it does now:**
- **NEW:** Checks if accrual entry exists, creates it if missing
- Records the payment entry (погашение задолженности)
- Returns both entries in the response

**Logic:**
1. Checks if accrual entry already exists for this deal
2. If NO accrual entry exists AND deal is service/product → Creates accrual entry
3. Always creates payment entry: `6060 (Debit) - 1010/1030 (Credit)`

**Accrual entries (created only if not exists):**
- **Service deals** → Creates: `7110 (Debit) - 3310 (Credit)`
- **Product deals** → Creates: `1330 (Debit) - 3310 (Credit)`

### 2. New Standalone Accrual Endpoint
**Endpoint:** `POST /deals/:dealId/expense-accrual`

**What it does:**
- Records ONLY the accrual entry (no payment)
- Useful for recording received services/goods before payment
- Does NOT update deal's paid amount

## 🎯 Usage Scenarios

### Scenario A: Accrual First, Payment Later (Recommended)
**Step 1:** Record that you received service/goods

```
POST /deals/:dealId/expense-accrual

Result:
✓ Accrual recorded (7110 → 3310 or 1330 → 3310)
✗ Deal paid amount NOT updated
```

**Step 2:** When you pay

```
POST /deals/:dealId/expense-payments

Result:
✓ Payment recorded (6060 → 1010/1030)
✓ Deal paid amount updated
✗ Accrual NOT created (already exists)
```

### Scenario B: Payment + Accrual Together
**When to use:** You're paying immediately when receiving service/goods

```
POST /deals/:dealId/expense-payments

Result:
✓ Accrual recorded (7110 → 3310 or 1330 → 3310)
✓ Payment recorded (6060 → 1010/1030)
✓ Deal paid amount updated
```

### Scenario C: Multiple Payments for One Deal
**First payment:**
```
POST /deals/:dealId/expense-payments

Result:
✓ Accrual recorded (7110 → 3310)
✓ Payment recorded (6060 → 1010)
```

**Second payment:**
```
POST /deals/:dealId/expense-payments

Result:
✓ Payment recorded (6060 → 1010)
✗ Accrual NOT created (already exists from first payment)
```

## 📊 Accounting Entries

### For Services (dealType: "service")

**Accrual Entry (when received service):**
```
Debit:  7110 (Service Expenses)     100,000
Credit: 3310 (Accounts Payable)     100,000
```

**Payment Entry (when paid):**
```
Debit:  3310 (Accounts Payable)     100,000
Credit: 1010 (Cash) or 1030 (Bank)  100,000
```

### For Products (dealType: "product")

**Accrual Entry (when received goods):**
```
Debit:  1330 (Inventory)            100,000
Credit: 3310 (Accounts Payable)     100,000
```

**Payment Entry (when paid):**
```
Debit:  6060 (Expenses)             100,000
Credit: 1010 (Cash) or 1030 (Bank)  100,000
```

## 🔄 Response Changes

### Updated Response Structure
```json
{
  "deal": { ... },
  "journalEntry": { ... },  // ← This is the PAYMENT entry (6060 → 1010/1030)
  "accrualJournalEntry": {  // ← NEW FIELD (null if already exists)
    "id": "uuid",
    "entryNumber": "JE-xxx",
    "description": "...",
    "status": "draft"
  }
}
```

**Note:** `accrualJournalEntry` is:
- `null` if accrual entry already exists for this deal
- `null` if deal type is not service/product
- Contains entry data if accrual was just created

## ✨ Key Features

- ✅ **Smart Deduplication:** Doesn't create duplicate accrual entries
- ✅ **Type-based:** Different accounts based on service vs product
- ✅ **Transactional:** All entries created atomically (all or nothing)
- ✅ **Flexible:** Separate endpoint for accrual-only scenarios
- ✅ **Correct Accounting:** Payment entry debits 6060 (Expenses) and credits Cash/Bank

## 🧪 Quick Test

### Test 1: Accrual First, Payment Second
```bash
# Step 1: Record accrual
POST /deals/{dealId}/expense-accrual
{ "amount": 100000, "currencyId": "..." }

# Check: Should see 1 entry (type: "invoice")
GET /deals/{dealId}/transactions

# Step 2: Record payment
POST /deals/{dealId}/expense-payments  
{ "amount": 100000, "currencyId": "..." }

# Check: Should see 2 entries now
# - Entry 1 (type: "invoice"): 7110 → 3310
# - Entry 2 (type: "payment"): 6060 → 1010/1030
GET /deals/{dealId}/transactions
```

### Test 2: Payment + Accrual Together
```bash
# Record payment (first time for this deal)
POST /deals/{dealId}/expense-payments
{ "amount": 100000, "currencyId": "..." }

# Check: Should see 2 entries created
# - Entry 1 (type: "invoice"): 7110 → 3310 (auto-created)
# - Entry 2 (type: "payment"): 6060 → 1010/1030
GET /deals/{dealId}/transactions
```

### Test 3: Second Payment (No Duplicate Accrual)
```bash
# Record second payment for same deal
POST /deals/{dealId}/expense-payments
{ "amount": 50000, "currencyId": "..." }

# Check: Should see 3 entries total (no duplicate accrual)
# - Entry 1 (type: "invoice"): 7110 → 3310 (from first payment)
# - Entry 2 (type: "payment"): 6060 → 1010/1030 (first payment)
# - Entry 3 (type: "payment"): 6060 → 1010/1030 (second payment)
GET /deals/{dealId}/transactions
```

## 📝 Important Notes

- **Accrual entries** are only created for "service" and "product" deal types
- **No duplicates:** System checks if accrual entry exists before creating
- **Payment entry** ALWAYS debits 6060 (Expenses) and credits 1010/1030 (Cash/Bank)
- **Accrual entry** debits 7110 (Services) or 1330 (Inventory) and credits 3310 (Accounts Payable)
- All entries are linked to the deal in `deal_journal_entries` table
- Both entries use the same amount from the payment request

## 🔑 Account Codes Reference

| Code | Name | Type | Used In |
|------|------|------|---------|
| 1010 | Касса (Cash) | Asset | Payment entry (Credit) |
| 1030 | Банковский счет (Bank) | Asset | Payment entry (Credit) |
| 1330 | Товары (Inventory) | Asset | Accrual entry - Products (Debit) |
| 3310 | Кредиторская задолженность (Accounts Payable) | Liability | Accrual entry (Credit) |
| 6060 | Расходы (Expenses) | Expense | Payment entry (Debit) |
| 7110 | Расходы на услуги (Service Expenses) | Expense | Accrual entry - Services (Debit) |

