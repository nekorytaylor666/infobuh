# Deal Preview & Public Sharing Feature

## Overview

The Deal Preview & Public Sharing feature allows users to generate public share links for deals, enabling anyone with the link to view deal information, accounting details, comments, and documents without authentication.

## Table of Contents

- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Backend API](#backend-api)
- [Frontend Implementation](#frontend-implementation)
- [Security Considerations](#security-considerations)
- [Usage Guide](#usage-guide)
- [Testing](#testing)

---

## Architecture

### System Flow

```
User Request → Generate Share Token → Store in DB → Return Share URL
                                                           ↓
Public User Access → Validate Token → Fetch Deal Data → Display Preview
```

### Key Components

1. **Backend**: Token generation, validation, and public API endpoints
2. **Frontend**: Preview page with document display
3. **Database**: Token storage and public access flags

---

## Database Schema

### Deals Table

**File**: `/packages/db/src/schema/deal.ts`

```typescript
{
  isPublic: boolean("is_public").default(false).notNull(),
  publicShareToken: varchar("public_share_token", { length: 64 }).unique(),
}
```

### Migration

**File**: `/packages/db/src/migrations/0003_add_deal_public_sharing.sql`

```sql
ALTER TABLE deals
ADD COLUMN is_public BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN public_share_token VARCHAR(64) UNIQUE;

CREATE INDEX idx_deals_public_share_token ON deals(public_share_token);
```

---

## Backend API

### 1. Generate Share Link

**Endpoint**: `POST /deals/:dealId/share`

**Authentication**: Required (Bearer token)

**Request**:
```bash
POST /deals/{dealId}/share
Authorization: Bearer <token>
```

**Response**:
```json
{
  "shareToken": "a1b2c3d4e5f6...", // 64-character cryptographic token
  "shareUrl": "/preview/deals/a1b2c3d4e5f6...", // Relative path (domain-agnostic)
  "isPublic": true
}
```

**Implementation**: `/packages/backend/src/routes/deal.ts:1492-1575`

**Key Features**:
- Generates cryptographically secure 64-character token using `crypto.getRandomValues()`
- Reuses existing token if deal is already public
- Sets `isPublic: true` on the deal
- Returns relative URL path (works on any domain)

**Token Generation**:
```typescript
function generateShareToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
```

### 2. Access Public Deal

**Endpoint**: `GET /deals/:shareToken?token=:shareToken`

**Authentication**: Not required (public access)

**Request**:
```bash
GET /deals/{shareToken}?token={shareToken}
```

**Response**:
```json
{
  "id": "deal-uuid",
  "receiverBin": "123456789012",
  "title": "Deal Title",
  "dealType": "service",
  "totalAmount": 100000,
  "paidAmount": 50000,
  "status": "active",
  "isPublic": true,
  "publicShareToken": "token...",
  "documentsFlutter": [...],
  "comments": [...]
}
```

**Implementation**: `/packages/backend/src/routes/deal.ts:1310-1398`

### 3. Public Accounting Endpoints

All support optional `?token=:shareToken` query parameter for unauthenticated access:

- `GET /deals/:dealId/balance?token=:shareToken` - Get balance information
- `GET /deals/:dealId/reconciliation?token=:shareToken` - Get reconciliation report
- `GET /deals/:dealId/transactions?token=:shareToken` - Get journal entries

**Token Validation**:
```typescript
async function validateShareToken(db: any, shareToken: string) {
  const deal = await db.query.deals.findFirst({
    where: and(
      eq(deals.publicShareToken, shareToken),
      eq(deals.isPublic, true)
    ),
    with: {
      dealDocumentsFlutter: { with: { documentFlutter: true } },
      comments: { with: { author: true } }
    },
  });
  return deal;
}
```

---

## Frontend Implementation

### Preview Page Route

**File**: `/packages/frontend/src/routes/preview/deals/$shareToken/index.tsx`

**Route**: `/preview/deals/:shareToken`

**Features**:
- No authentication required
- Parallel data fetching for optimal performance
- Graceful error handling with `Promise.allSettled`
- Responsive design (mobile-first)

### Data Fetching

```typescript
loader: async ({ params }) => {
  const shareToken = params.shareToken;

  // Parallel data fetching
  const [dealRes, balanceRes, reconciliationRes, transactionsRes] =
    await Promise.allSettled([
      api.get(`/deals/${shareToken}`, { params: { token: shareToken } }),
      api.get(`/deals/${shareToken}/balance`, { params: { token: shareToken } }),
      api.get(`/deals/${shareToken}/reconciliation`, { params: { token: shareToken } }),
      api.get(`/deals/${shareToken}/transactions`, { params: { token: shareToken } }),
    ]);

  return {
    deal: dealRes.status === "fulfilled" ? dealRes.value.data : null,
    balance: balanceRes.status === "fulfilled" ? balanceRes.value.data : null,
    reconciliation: reconciliationRes.status === "fulfilled" ? reconciliationRes.value.data : null,
    transactions: transactionsRes.status === "fulfilled" ? transactionsRes.value.data : null,
  };
}
```

### Component Structure

```
DealPreviewComponent
├── DealPreviewHeader (title, status, badges)
├── DealInfoSection (deal metadata, amounts)
├── AccountingDetailsSection (balance, journal entries, reconciliation)
├── CommentsSection (read-only comments)
└── DocumentsSection (grid of document cards)
```

### Components

**Files**:
- `/packages/frontend/src/components/deal-preview/DealPreviewHeader.tsx`
- `/packages/frontend/src/components/deal-preview/DealInfoSection.tsx`
- `/packages/frontend/src/components/deal-preview/AccountingDetailsSection.tsx`
- `/packages/frontend/src/components/deal-preview/CommentsSection.tsx`
- `/packages/frontend/src/components/deal-preview/DocumentsSection.tsx`

### Document Display

Documents are displayed using the `filePath` directly as it contains the full Supabase public URL:

```typescript
// DocumentsSection.tsx
useEffect(() => {
  if (doc.filePath) {
    // Use filePath directly (already a full Supabase public URL)
    const isImg = /\.(jpeg|jpg|gif|png|webp)$/i.test(doc.filePath);
    if (isImg) {
      setPreviewUrl(doc.filePath);
    }
  }
}, [doc.filePath]);
```

**Important**: Do NOT use `supabase.storage.getPublicUrl()` on `filePath` as it's already a complete URL.

---

## Security Considerations

### Token Security

1. **Cryptographically Secure**: Uses `crypto.getRandomValues()` for 64-character tokens
2. **Unique Constraint**: Database enforces token uniqueness
3. **Indexed**: Fast token lookups via database index

### Access Control

1. **Public Flag**: Requires both valid token AND `isPublic: true`
2. **Token Validation**: All public endpoints validate token before returning data
3. **Revocation**: Setting `isPublic: false` immediately revokes access

### Data Exposure

Public share links expose:
- ✅ Deal information (title, amounts, status, description)
- ✅ Accounting details (balance, journal entries, reconciliation)
- ✅ Comments (read-only)
- ✅ Documents (view and download)

Public share links do NOT expose:
- ❌ User authentication details
- ❌ Internal legal entity information
- ❌ Other deals from the same legal entity
- ❌ Ability to modify data

---

## Usage Guide

### For Backend/API Users

#### 1. Generate Share Link

```bash
curl -X POST http://localhost:3000/deals/{dealId}/share \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Response**:
```json
{
  "shareToken": "fd81c8d0e4e2e486ae09499d0a8498d5129ab22a975281a1c18f348b1443cded",
  "shareUrl": "/preview/deals/fd81c8d0e4e2e486ae09499d0a8498d5129ab22a975281a1c18f348b1443cded",
  "isPublic": true
}
```

#### 2. Share the Link

The full URL depends on your domain:
- **Localhost**: `http://localhost:3000/preview/deals/{shareToken}`
- **Production**: `https://infobuh.com/preview/deals/{shareToken}`

The `shareUrl` returned by the API is domain-agnostic (relative path), allowing it to work on any domain.

#### 3. Revoke Access

To revoke public access, update the deal:

```bash
curl -X PUT http://localhost:3000/deals/{dealId} \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isPublic": false}'
```

#### 4. Regenerate Token

To generate a new token (invalidates the old one), update the deal:

```bash
# First, set isPublic to false
curl -X PUT http://localhost:3000/deals/{dealId} \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"isPublic": false, "publicShareToken": null}'

# Then generate a new share link
curl -X POST http://localhost:3000/deals/{dealId}/share \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### For Frontend Users

#### 1. Generate Share Link

Use the API or create a UI button that calls the share endpoint.

#### 2. Copy Share Link

```typescript
const handleShare = async (dealId: string) => {
  const response = await api.post(`/deals/${dealId}/share`);
  const { shareUrl } = response.data;

  // Construct full URL
  const fullUrl = `${window.location.origin}${shareUrl}`;

  // Copy to clipboard
  await navigator.clipboard.writeText(fullUrl);
  toast.success("Share link copied to clipboard!");
};
```

#### 3. Access Preview Page

Navigate to: `/preview/deals/{shareToken}`

No authentication required!

---

## Testing

### Test Coverage

**File**: `/packages/backend/src/test-deal-accounting.ts`

**Test Function**: `testDealPreviewURLGeneration()` (Lines 1735-1946)

**Test Cases**:

1. ✅ Initial deal state verification
2. ✅ Token generation (64 characters)
3. ✅ Deal update with `isPublic` and `publicShareToken`
4. ✅ Access verification via token
5. ✅ Token uniqueness validation
6. ✅ Public unauthenticated access simulation
7. ✅ Revocation of public access
8. ✅ Token regeneration (old token invalidation)

### Running Tests

```bash
cd packages/backend
bun run src/test-deal-accounting.ts
```

**Expected Output**:
```
🔗 17. Тестирование генерации публичной ссылки для предпросмотра сделки
   📋 1. Проверка исходного состояния сделки
   ✅ Сделка найдена
   🔐 2. Генерация публичного токена доступа
   ✅ Токен сгенерирован (64 символа)
   🔍 3. Проверка доступа по токену
   ✅ Сделка доступна по токену
   🔐 4. Проверка уникальности токена
   ✅ Токен уникален
   🌐 5. Симуляция публичного доступа
   ✅ Публичный доступ работает
   🔒 6. Тестирование отзыва публичного доступа
   ✅ Публичный доступ успешно отозван
   🔄 7. Тестирование регенерации токена
   ✅ Токен успешно регенерирован
```

### Manual Testing

1. **Generate Share Link**:
   ```bash
   curl -X POST http://localhost:3000/deals/YOUR_DEAL_ID/share
   ```

2. **Access Preview** (in browser):
   ```
   http://localhost:3000/preview/deals/SHARE_TOKEN
   ```

3. **Verify Public Access** (no auth headers):
   ```bash
   curl http://localhost:3000/deals/SHARE_TOKEN?token=SHARE_TOKEN
   ```

4. **Test Revocation**:
   ```bash
   # Revoke access
   curl -X PUT http://localhost:3000/deals/YOUR_DEAL_ID \
     -d '{"isPublic": false}'

   # Try accessing (should fail)
   curl http://localhost:3000/deals/SHARE_TOKEN?token=SHARE_TOKEN
   ```

---

## File Structure

```
packages/
├── backend/
│   └── src/
│       ├── routes/
│       │   └── deal.ts                    # Share endpoints
│       └── test-deal-accounting.ts        # Test cases
├── db/
│   └── src/
│       ├── schema/
│       │   └── deal.ts                    # Schema with public fields
│       └── migrations/
│           └── 0003_add_deal_public_sharing.sql
└── frontend/
    └── src/
        ├── routes/
        │   ├── preview/
        │   │   ├── route.tsx              # Route wrapper
        │   │   └── deals/
        │   │       └── $shareToken/
        │   │           └── index.tsx      # Preview page
        │   └── share/
        │       └── deals/
        │           └── $dealId/
        │               └── $documentId.tsx # Document viewer
        └── components/
            └── deal-preview/
                ├── DealPreviewHeader.tsx
                ├── DealInfoSection.tsx
                ├── AccountingDetailsSection.tsx
                ├── CommentsSection.tsx
                └── DocumentsSection.tsx
```

---

## API Reference

### Share Link Generation

```typescript
POST /deals/:dealId/share
```

**Parameters**:
- `dealId` (path) - UUID of the deal

**Headers**:
- `Authorization: Bearer <token>` - Required

**Response**:
```typescript
{
  shareToken: string;      // 64-character token
  shareUrl: string;        // Relative path: "/preview/deals/{token}"
  isPublic: boolean;       // true
}
```

**Status Codes**:
- `200` - Success
- `401` - Unauthorized
- `404` - Deal not found
- `500` - Server error

### Public Deal Access

```typescript
GET /deals/:shareToken?token=:shareToken
```

**Parameters**:
- `shareToken` (path) - Share token
- `token` (query) - Same share token for validation

**Headers**: None required

**Response**:
```typescript
{
  id: string;
  receiverBin: string;
  title: string;
  description?: string;
  dealType: "service" | "product";
  totalAmount: number;
  paidAmount: number;
  status: "draft" | "active" | "completed" | "cancelled";
  isPublic: boolean;
  publicShareToken: string;
  createdAt: string;
  updatedAt: string;
  documentsFlutter: DocumentFlutter[];
  comments: Comment[];
}
```

**Status Codes**:
- `200` - Success
- `404` - Invalid token or deal not public

---

## Best Practices

### Security

1. ✅ Always validate both token AND `isPublic` flag
2. ✅ Use HTTPS in production
3. ✅ Implement rate limiting on share endpoints
4. ✅ Log access to shared deals for audit trail
5. ✅ Regularly rotate tokens for sensitive deals

### Performance

1. ✅ Use parallel data fetching (`Promise.allSettled`)
2. ✅ Cache public deal data with short TTL
3. ✅ Use database index on `publicShareToken`
4. ✅ Optimize document loading (lazy load images)

### UX

1. ✅ Provide clear "Copy Link" functionality
2. ✅ Show loading states during data fetch
3. ✅ Handle errors gracefully (expired/invalid links)
4. ✅ Use relative URLs for domain-agnostic sharing
5. ✅ Display preview in read-only mode

---

## Troubleshooting

### Issue: "Invalid share token or deal not publicly accessible"

**Cause**: Token doesn't exist or `isPublic: false`

**Solution**:
```bash
# Check deal status
curl http://localhost:3000/deals/DEAL_ID

# Regenerate share link
curl -X POST http://localhost:3000/deals/DEAL_ID/share
```

### Issue: Document URLs are doubled

**Cause**: Using `supabase.storage.getPublicUrl()` on already-complete URLs

**Solution**: Use `filePath` directly without SDK:
```typescript
// ❌ Wrong
const { data } = supabase.storage.from("documents").getPublicUrl(doc.filePath);

// ✅ Correct
const url = doc.filePath; // Already a complete URL
```

### Issue: Share link works on localhost but not production

**Cause**: Hardcoded domain in share URL

**Solution**: Always use relative paths:
```typescript
// ❌ Wrong
const shareUrl = `http://localhost:3000/preview/deals/${token}`;

// ✅ Correct
const shareUrl = `/preview/deals/${token}`;

// Then on frontend:
const fullUrl = `${window.location.origin}${shareUrl}`;
```

---

## Future Enhancements

### Potential Features

1. **Expiring Links**: Add `expiresAt` timestamp for temporary sharing
2. **Password Protection**: Optional password for share links
3. **View Analytics**: Track who accessed shared deals and when
4. **Custom Branding**: Allow customization of preview page
5. **QR Code Generation**: Generate QR codes for share links
6. **Email Sharing**: Send share links directly via email
7. **Watermarks**: Add watermarks to shared documents

### Implementation Ideas

```typescript
// Expiring links
interface Deal {
  shareExpiresAt?: Date;
}

// Password protection
interface Deal {
  sharePassword?: string; // Hashed
}

// Analytics
interface ShareAccessLog {
  dealId: string;
  accessedAt: Date;
  ipAddress: string;
  userAgent: string;
}
```

---

## Support

For issues or questions:
- Check this documentation
- Review test cases in `test-deal-accounting.ts`
- Inspect backend routes in `packages/backend/src/routes/deal.ts`
- Check frontend components in `packages/frontend/src/components/deal-preview/`

---

**Last Updated**: 2025-12-15
**Version**: 1.0.0
