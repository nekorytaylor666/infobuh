# Deal Accounting API Documentation

This document describes the API endpoints for managing deals with integrated accounting functionality based on the Kazakhstani Chart of Accounts.

## Account Structure

The system uses the official Kazakhstani Chart of Accounts with the following key account codes:

### Assets

- **1010** - Денежные средства в кассе (Cash on hand)
- **1030** - Денежные средства на текущих банковских счетах (Bank accounts)
- **1210** - Краткосрочная дебиторская задолженность покупателей и заказчиков (Accounts receivable)
- **1310** - Сырье и материалы (Raw materials)
- **1320** - Готовая продукция (Finished goods)
- **1330** - Товары (Merchandise)

### Liabilities

- **3010** - Краткосрочные финансовые обязательства (Short-term financial liabilities)
- **3110** - Корпоративный подоходный налог (Corporate income tax payable)
- **3130** - Налог на добавленную стоимость (VAT payable)
- **3310** - Краткосрочная задолженность поставщикам (Accounts payable)

### Equity

- **5010** - Простые акции (Common shares)
- **5610** - Нераспределенная прибыль отчетного года (Current year retained earnings)

### Revenue

- **6010** - Доход от реализации продукции и оказания услуг (Revenue from sales)
- **6290** - Прочие доходы (Other income)

### Expenses

- **7010** - Себестоимость реализованной продукции (Cost of goods sold)
- **7210** - Административные расходы (Administrative expenses)
- **7480** - Прочие расходы (Other expenses)

## API Endpoints

### 1. Create Deal with Accounting

**POST** `/deals/with-accounting?legalEntityId={uuid}`

Creates a new deal and automatically generates the corresponding accounting journal entries.

#### Request Body

```json
{
  "receiverBin": "123456789012",
  "title": "Services for Client ABC",
  "description": "IT consulting services",
  "dealType": "service", // or "product"
  "totalAmount": 100000,
  "currencyId": "uuid-of-currency"
}
```

**Note**: Account IDs are automatically resolved by the system using standard account codes:

- **Accounts Receivable**: Account code 1210
- **Revenue**: Account code 6010

#### Response

```json
{
  "deal": {
    "id": "deal-uuid",
    "receiverBin": "123456789012",
    "title": "Services for Client ABC",
    "dealType": "service",
    "totalAmount": 100000,
    "paidAmount": 0,
    "status": "active"
  },
  "journalEntry": {
    "id": "journal-entry-uuid",
    "entryNumber": "JE-2024-001",
    "description": "Услуги: Services for Client ABC",
    "status": "draft"
  },
  "document": {
    "success": true,
    "documentId": "document-uuid",
    "filePath": "/path/to/generated/document.pdf",
    "fileName": "act-2024-001.pdf",
    "documentType": "АВР"
  }
}
```

#### Journal Entry Generated

- **Debit** Account 1210 (Accounts Receivable): 100,000 KZT
- **Credit** Account 6010 (Revenue): 100,000 KZT

### 2. Record Payment

**POST** `/deals/{dealId}/payments?legalEntityId={uuid}`

Records a payment for a specific deal.

#### Request Body

```json
{
  "amount": 50000,
  "description": "Partial payment received",
  "reference": "PAY-001",
  "currencyId": "uuid-of-currency",
  "paymentMethod": "bank" // "bank" (default) or "cash"
}
```

**Note**: Account IDs are automatically resolved by the system:

- **Bank Account**: Account code 1030 (when paymentMethod is "bank")
- **Cash Account**: Account code 1010 (when paymentMethod is "cash")
- **Accounts Receivable**: Account code 1210

#### Response

```json
{
  "deal": {
    "id": "deal-uuid",
    "totalAmount": 100000,
    "paidAmount": 50000,
    "status": "active"
  },
  "journalEntry": {
    "id": "journal-entry-uuid",
    "entryNumber": "JE-2024-002",
    "description": "Оплата по сделке: Services for Client ABC",
    "status": "draft"
  }
}
```

#### Journal Entry Generated

- **Debit** Account 1030 (Bank Account): 50,000 KZT
- **Credit** Account 1210 (Accounts Receivable): 50,000 KZT

### 3. Get Deal Transactions

**GET** `/deals/{dealId}/transactions`

Retrieves all accounting transactions (journal entries) for a specific deal with complete details from the database.

**Features:**

- Fetches real journal entries and their line items
- Includes actual account information (code, name, ID)
- Shows entry numbers, references, and status
- Provides complete audit trail for the deal

#### Response

```json
{
  "dealId": "deal-uuid",
  "dealTitle": "Services for Client ABC",
  "totalAmount": 100000,
  "paidAmount": 50000,
  "transactions": [
    {
      "id": "journal-entry-uuid-1",
      "dealId": "deal-uuid",
      "entryType": "invoice",
      "entryNumber": "JE-2024-001",
      "entryDate": "2024-01-15",
      "description": "Услуги: Services for Client ABC",
      "reference": "DEAL-deal-uuid",
      "status": "draft",
      "lines": [
        {
          "id": "line-uuid-1",
          "accountId": "account-uuid-1210",
          "accountCode": "1210",
          "accountName": "Краткосрочная дебиторская задолженность покупателей и заказчиков",
          "debitAmount": 100000,
          "creditAmount": 0,
          "description": "Дебиторская задолженность: Services for Client ABC"
        },
        {
          "id": "line-uuid-2",
          "accountId": "account-uuid-6010",
          "accountCode": "6010",
          "accountName": "Доход от реализации продукции и оказания услуг",
          "debitAmount": 0,
          "creditAmount": 100000,
          "description": "Доходы от услуг"
        }
      ]
    },
    {
      "id": "journal-entry-uuid-2",
      "dealId": "deal-uuid",
      "entryType": "payment",
      "entryNumber": "JE-2024-002",
      "entryDate": "2024-01-20",
      "description": "Оплата по сделке: Services for Client ABC",
      "reference": "PAY-deal-uuid",
      "status": "draft",
      "lines": [
        {
          "id": "line-uuid-3",
          "accountId": "account-uuid-1030",
          "accountCode": "1030",
          "accountName": "Денежные средства на текущих банковских счетах",
          "debitAmount": 50000,
          "creditAmount": 0,
          "description": "Поступление денежных средств"
        },
        {
          "id": "line-uuid-4",
          "accountId": "account-uuid-1210",
          "accountCode": "1210",
          "accountName": "Краткосрочная дебиторская задолженность покупателей и заказчиков",
          "debitAmount": 0,
          "creditAmount": 50000,
          "description": "Погашение дебиторской задолженности"
        }
      ]
    }
  ]
}
```

**Response Structure:**

- **Transaction Level**: Contains journal entry metadata (number, date, status, etc.)
- **Line Level**: Contains individual account debits/credits with full account details
- **Real Data**: All information comes directly from the accounting database tables

### 4. Get Deal Balance

**GET** `/deals/{dealId}/balance`

Retrieves balance information for a specific deal.

### 5. Generate Reconciliation Report

**GET** `/deals/{dealId}/reconciliation`

Generates a reconciliation report comparing deal amounts with journal entries.

## Account Requirements

The system automatically resolves account IDs by looking up accounts with the following standard codes in your legal entity:

### Required Accounts (Must exist in database)

- **1010** - Денежные средства в кассе (Cash account)
- **1030** - Денежные средства на текущих банковских счетах (Bank account)
- **1210** - Краткосрочная дебиторская задолженность покупателей и заказчиков (Accounts receivable)
- **6010** - Доход от реализации продукции и оказания услуг (Revenue account)

### Usage by Transaction Type

#### Deal Creation (Invoice Entry)

- **Debit**: Account 1210 (Accounts Receivable)
- **Credit**: Account 6010 (Revenue)

#### Payment Recording

- **Debit**: Account 1030 (Bank) or 1010 (Cash) - based on paymentMethod
- **Credit**: Account 1210 (Accounts Receivable)

### Benefits of Automatic Account Resolution

- **Simplified API**: No need to lookup and provide account IDs
- **Consistency**: All deals use the same standard accounts
- **Error Prevention**: Reduces risk of using wrong accounts
- **Compliance**: Follows Kazakhstani Chart of Accounts standards

## Double-Entry Bookkeeping

All transactions follow double-entry bookkeeping principles:

### Invoice Entry (Deal Creation)

```
Dr. 1210 Accounts Receivable    100,000
    Cr. 6010 Revenue                   100,000
```

### Payment Entry

```
Dr. 1030 Bank Account          50,000
    Cr. 1210 Accounts Receivable      50,000
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- **200**: Success
- **201**: Created
- **400**: Bad Request (validation errors)
- **401**: Unauthorized
- **404**: Not Found
- **500**: Internal Server Error

## Authentication

All endpoints require authentication. Include the user token in the Authorization header:

```
Authorization: Bearer {your-token}
```

## Query Parameters

Most endpoints require a `legalEntityId` query parameter to specify which legal entity the operation belongs to:

```
GET /deals/{dealId}/transactions?legalEntityId={uuid}
```
