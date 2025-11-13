# 📝 Changelog: Expense Accrual Feature

## 🎯 Summary

Implemented proper accounting for expense deals with separate accrual and payment entries, following the principle that **receiving services/goods** and **paying for them** are two separate accounting events.

## ✅ What Changed

### 1. Modified `recordExpensePayment` Method

**Location:** `packages/backend/src/lib/accounting-service/deal-accounting-service.ts`

**Previous Behavior:**
- Created single payment entry: `6010 (Debit) - 1030 (Credit)`
- No tracking of accruals

**New Behavior:**
- ✅ Checks if accrual entry exists for the deal
- ✅ Creates accrual entry ONLY if missing and deal type is service/product
- ✅ Always creates payment entry: `3310 (Debit) - 1010/1030 (Credit)`
- ✅ No duplicate accruals on subsequent payments

### 2. New `recordExpenseAccrual` Method

**Location:** `packages/backend/src/lib/accounting-service/deal-accounting-service.ts`

**Purpose:**
- Records ONLY the accrual entry (no payment)
- Used when service/goods are received but not yet paid

### 3. New API Endpoint

**Endpoint:** `POST /deals/:dealId/expense-accrual`

**Request:**
```json
{
  "amount": 100000,
  "currencyId": "uuid",
  "description": "Optional",
  "reference": "Optional"
}
```

**Response:**
```json
{
  "deal": { ... },
  "journalEntry": {
    "id": "uuid",
    "entryNumber": "JE-xxx",
    "description": "Начисление: услуги/товары от Partner",
    "status": "draft"
  }
}
```

### 4. Updated Endpoint Behavior

**Endpoint:** `POST /deals/:dealId/expense-payments`

**Changed:** Response now includes `accrualJournalEntry` field (null if already exists)

## 🔄 Migration Impact

### Breaking Changes
- ⚠️ Payment entry changed from `6010-1030` to `3310-1010/1030`
- ⚠️ Accrual entries are not created on every payment call

### Non-Breaking Changes
- ✅ API interface remains the same
- ✅ Response structure is backward compatible (added optional field)

## 📊 Accounting Entries Created

### Service Deal

**Accrual (7110 - 3310):**
```
Journal Entry Type: "invoice"
Debit:  7110 (Расходы на услуги)        100,000
Credit: 3310 (Кредиторская задолженность) 100,000
```

**Payment (3310 - 1010/1030):**
```
Journal Entry Type: "payment"
Debit:  3310 (Кредиторская задолженность) 100,000
Credit: 1010 (Касса) or 1030 (Банк)      100,000
```

### Product Deal

**Accrual (1330 - 3310):**
```
Journal Entry Type: "invoice"
Debit:  1330 (Товары)                    100,000
Credit: 3310 (Кредиторская задолженность) 100,000
```

**Payment (3310 - 1010/1030):**
```
Journal Entry Type: "payment"
Debit:  3310 (Кредиторская задолженность) 100,000
Credit: 1010 (Касса) or 1030 (Банк)      100,000
```

## 🎬 Usage Flows

### Flow 1: Accrual First, Payment Later (Recommended)

```bash
# Step 1: Record accrual when receiving service
POST /deals/:dealId/expense-accrual
Result: 1 entry created (7110-3310)

# Step 2: Record payment later
POST /deals/:dealId/expense-payments
Result: 1 entry created (3310-1010), no duplicate accrual
```

### Flow 2: Immediate Payment

```bash
# Record payment immediately (first time)
POST /deals/:dealId/expense-payments
Result: 2 entries created (7110-3310 and 3310-1010)
```

### Flow 3: Multiple Payments

```bash
# First payment
POST /deals/:dealId/expense-payments (amount: 50,000)
Result: 2 entries created (7110-3310 and 3310-1010)

# Second payment
POST /deals/:dealId/expense-payments (amount: 50,000)
Result: 1 entry created (3310-1010), NO duplicate accrual
```

## 🧪 Testing Recommendations

1. **Test accrual-only flow**
   - Create deal → Call expense-accrual → Verify 1 entry

2. **Test payment-only flow**
   - Create deal → Call expense-payment → Verify 2 entries

3. **Test accrual + payment flow**
   - Create deal → Call expense-accrual → Call expense-payment → Verify 2 entries total (no duplicates)

4. **Test multiple payments**
   - Create deal → Call expense-payment twice → Verify 3 entries (1 accrual + 2 payments)

## 📚 Documentation

- **Quick Reference:** `EXPENSE_ACCRUAL_SUMMARY.md`
- **Detailed Guide:** `EXPENSE_ACCRUAL_FEATURE.md`
- **This Changelog:** `CHANGELOG_EXPENSE_ACCRUAL.md`

## 🔑 Key Points

1. ✅ Accrual and payment are now separate accounting events
2. ✅ No duplicate accruals on subsequent payments
3. ✅ Payment entry correctly debits Accounts Payable (3310)
4. ✅ Works with both "service" and "product" deal types
5. ✅ All entries are transactional (all or nothing)
6. ✅ Entries are properly linked to deals

## 🎉 Version

**Date:** November 13, 2025
**Feature:** Expense Accrual System
**Status:** ✅ Completed

