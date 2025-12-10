# Current Deal Creation Behavior

## Scenario: Company A creates deal with Company B

### What Happens Now:

**When Company A creates a deal:**
```typescript
dealAccountingService.createDealWithAccounting({
  receiverBin: COMPANY_B_BIN,  // "222222222222"
  legalEntityId: COMPANY_A_ID,  // Company A's ID
  // ... other fields
});
```

**Result:**
1. ✅ Deal record created with `legalEntityId = COMPANY_A_ID`
2. ✅ Journal entries created ONLY for Company A:
   - Debit: 1210 (Receivable)
   - Credit: 6010 (Revenue)
3. ✅ Journal entry has `legalEntityId = COMPANY_A_ID`
4. ✅ Company B gets ZERO automatic entries
5. ✅ Company B must manually create their own entries

### Entry Isolation:

```sql
-- Company A queries their entries
SELECT * FROM journal_entries WHERE legal_entity_id = 'COMPANY_A_ID';
-- Returns: 1 entry (the automatic one)

-- Company B queries their entries
SELECT * FROM journal_entries WHERE legal_entity_id = 'COMPANY_B_ID';
-- Returns: 0 entries (nothing automatic)
```

### What Company B Must Do:

Company B must **manually** call:
```typescript
accountingService.createJournalEntry({
  legalEntityId: COMPANY_B_ID,  // Their own ID
  // ... entry details
  lines: [
    { accountId: expense_account, debitAmount: 1000000 },    // Expense
    { accountId: payable_account, creditAmount: 1000000 },   // Payable
  ]
});
```

---

## Alternative: NO Automatic Entries at All

If you want **both parties** to manually create entries:

### Option 1: Remove automatic entry creation entirely

**Change:** Don't create journal entries in `createDealWithAccounting()`
- Only create the deal record
- Both Company A and Company B manually create their own entries

### Option 2: Add a flag to control automatic entries

```typescript
dealAccountingService.createDealWithAccounting({
  // ... existing fields
  createAutomaticEntries: false,  // New flag
});
```

---

## Question for Clarification:

**What behavior do you want?**

A) **Keep current behavior** (sender gets automatic entries, receiver manual)
B) **NO automatic entries** (both sender and receiver create entries manually)
C) **Something else** (please describe)

---

## Current Test Results:

Our bilateral test confirms:
- ✅ Company A: 1 automatic entry
- ✅ Company B: 0 automatic entries
- ✅ Complete isolation verified
- ✅ Cross-entity queries blocked
- ✅ Company B successfully creates manual entries

The anti-spam mechanism is working - receivers don't get automatic entries.
