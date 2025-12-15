# Deal Preview & Share API

## Base URL
- Development: `http://localhost:3000`
- Production: `https://infobuh.com`

---

## 1. Generate Share Link

```
POST /deals/:dealId/share
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Response:**
```json
{
  "shareToken": "fd81c8d0e4e2e486ae09499d0a8498d5129ab22a975281a1c18f348b1443cded",
  "shareUrl": "/preview/deals/fd81c8d0e4e2e486ae09499d0a8498d5129ab22a975281a1c18f348b1443cded",
  "isPublic": true
}
```

---

## 2. Get Public Deal

```
GET /deals/:shareToken?token=:shareToken
```

**Headers:** None

**Response:**
```json
{
  "id": "077123f5-8cea-4a43-8859-e1d20000754d",
  "receiverBin": "123456789012",
  "title": "Продажа канцелярских товаров",
  "description": "Продажа офисных принадлежностей",
  "dealType": "product",
  "totalAmount": 250000,
  "paidAmount": 250000,
  "status": "completed",
  "isPublic": true,
  "publicShareToken": "fd81c8d0e4e2e486ae09499d0a8498d5129ab22a975281a1c18f348b1443cded",
  "createdAt": "2025-06-12T10:17:04.990Z",
  "updatedAt": "2025-12-15T05:46:23.784Z",
  "documentsFlutter": [
    {
      "id": "48393746-7999-433d-af45-57525162e1b1",
      "type": "Накладная",
      "filePath": "https://dvbwzjercbgkoxwdknss.supabase.co/storage/v1/object/public/documents/...",
      "receiverName": "Компания",
      "fields": {}
    }
  ],
  "comments": [
    {
      "id": "comment-id",
      "text": "Комментарий",
      "createdAt": "2025-06-12T10:17:04.990Z",
      "author": {
        "id": "user-id",
        "fullname": "Иван Иванов"
      }
    }
  ]
}
```

---

## 3. Get Deal Balance

```
GET /deals/:dealId/balance?token=:shareToken
```

**Headers:** None

**Response:**
```json
{
  "totalAmount": 250000,
  "paidAmount": 250000,
  "remainingBalance": 0,
  "currency": "KZT"
}
```

---

## 4. Get Deal Reconciliation

```
GET /deals/:dealId/reconciliation?token=:shareToken
```

**Headers:** None

**Response:**
```json
{
  "dealId": "077123f5-8cea-4a43-8859-e1d20000754d",
  "totalInvoiced": 250000,
  "totalPaid": 250000,
  "discrepancy": 0,
  "reconciliationDate": "2025-06-12T10:17:04.990Z"
}
```

---

## 5. Get Deal Transactions

```
GET /deals/:dealId/transactions?token=:shareToken
```

**Headers:** None

**Response:**
```json
[
  {
    "id": "transaction-id",
    "date": "2025-06-12T10:17:04.990Z",
    "debitAccount": "1210",
    "creditAccount": "6010",
    "amount": 250000,
    "description": "Продажа товаров",
    "currency": "KZT"
  }
]
```

---

## 6. Revoke Public Access

```
PUT /deals/:dealId
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "isPublic": false
}
```

**Response:**
```json
{
  "id": "077123f5-8cea-4a43-8859-e1d20000754d",
  "isPublic": false,
  "publicShareToken": null
}
```

---

## Error Responses

**401 Unauthorized:**
```json
{
  "error": "Unauthorized"
}
```

**404 Not Found:**
```json
{
  "error": "Invalid share token or deal not publicly accessible"
}
```

**500 Server Error:**
```json
{
  "error": "Failed to generate share link"
}
```

---

## Notes

- `shareUrl` is a relative path - prepend with base URL
- `filePath` in documents is a complete Supabase URL - use directly
- Share token is 64 characters
- No auth required for endpoints with `?token=:shareToken`
