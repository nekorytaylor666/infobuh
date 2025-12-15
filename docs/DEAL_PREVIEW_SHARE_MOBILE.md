# Deal Preview & Share - Mobile Integration Guide

Quick guide for mobile developers to integrate the deal preview and sharing feature.

---

## Overview

This feature allows users to generate and share public links to deals. Anyone with the link can view deal information, accounting details, comments, and documents without login.

---

## API Endpoints

### Base URL
- **Development**: `http://localhost:3000`
- **Production**: `https://infobuh.com`

---

## 1. Generate Share Link

**Endpoint**: `POST /deals/:dealId/share`

**Headers**:
```
Authorization: Bearer {userToken}
Content-Type: application/json
```

**Request**:
```bash
POST /deals/077123f5-8cea-4a43-8859-e1d20000754d/share
```

**Response**:
```json
{
  "shareToken": "fd81c8d0e4e2e486ae09499d0a8498d5129ab22a975281a1c18f348b1443cded",
  "shareUrl": "/preview/deals/fd81c8d0e4e2e486ae09499d0a8498d5129ab22a975281a1c18f348b1443cded",
  "isPublic": true
}
```

### Mobile Implementation

**Kotlin (Android)**:
```kotlin
data class ShareResponse(
    val shareToken: String,
    val shareUrl: String,
    val isPublic: Boolean
)

suspend fun generateShareLink(dealId: String): ShareResponse {
    val response = httpClient.post("$BASE_URL/deals/$dealId/share") {
        headers {
            append("Authorization", "Bearer $userToken")
            append("Content-Type", "application/json")
        }
    }
    return response.body()
}

// Build full URL
fun getFullShareUrl(shareUrl: String): String {
    return "$BASE_URL$shareUrl"
    // Example: https://infobuh.com/preview/deals/{token}
}

// Share with user
fun shareLink(fullUrl: String) {
    val sendIntent = Intent().apply {
        action = Intent.ACTION_SEND
        putExtra(Intent.EXTRA_TEXT, fullUrl)
        type = "text/plain"
    }
    startActivity(Intent.createChooser(sendIntent, "Share deal"))
}
```

**Swift (iOS)**:
```swift
struct ShareResponse: Codable {
    let shareToken: String
    let shareUrl: String
    let isPublic: Bool
}

func generateShareLink(dealId: String) async throws -> ShareResponse {
    let url = URL(string: "\(baseURL)/deals/\(dealId)/share")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("Bearer \(userToken)", forHTTPHeaderField: "Authorization")
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")

    let (data, _) = try await URLSession.shared.data(for: request)
    return try JSONDecoder().decode(ShareResponse.self, from: data)
}

// Build full URL
func getFullShareUrl(shareUrl: String) -> String {
    return "\(baseURL)\(shareUrl)"
    // Example: https://infobuh.com/preview/deals/{token}
}

// Share with user
func shareLink(fullUrl: String) {
    let activityVC = UIActivityViewController(
        activityItems: [fullUrl],
        applicationActivities: nil
    )
    present(activityVC, animated: true)
}
```

**Flutter**:
```dart
class ShareResponse {
  final String shareToken;
  final String shareUrl;
  final bool isPublic;

  ShareResponse({
    required this.shareToken,
    required this.shareUrl,
    required this.isPublic,
  });

  factory ShareResponse.fromJson(Map<String, dynamic> json) => ShareResponse(
    shareToken: json['shareToken'],
    shareUrl: json['shareUrl'],
    isPublic: json['isPublic'],
  );
}

Future<ShareResponse> generateShareLink(String dealId) async {
  final response = await http.post(
    Uri.parse('$baseUrl/deals/$dealId/share'),
    headers: {
      'Authorization': 'Bearer $userToken',
      'Content-Type': 'application/json',
    },
  );

  return ShareResponse.fromJson(jsonDecode(response.body));
}

// Build full URL
String getFullShareUrl(String shareUrl) {
  return '$baseUrl$shareUrl';
  // Example: https://infobuh.com/preview/deals/{token}
}

// Share with user
Future<void> shareLink(String fullUrl) async {
  await Share.share(fullUrl);
}
```

---

## 2. Access Public Deal (Preview)

**Endpoint**: `GET /deals/:shareToken?token=:shareToken`

**Headers**: None (no authentication required)

**Request**:
```bash
GET /deals/fd81c8d0e4e2e486ae09499d0a8498d5129ab22a975281a1c18f348b1443cded?token=fd81c8d0e4e2e486ae09499d0a8498d5129ab22a975281a1c18f348b1443cded
```

**Response**:
```json
{
  "id": "077123f5-8cea-4a43-8859-e1d20000754d",
  "receiverBin": "123456789012",
  "title": "Продажа канцелярских товаров",
  "description": "Продажа офисных принадлежностей по накладной",
  "dealType": "product",
  "totalAmount": 250000,
  "paidAmount": 250000,
  "status": "completed",
  "isPublic": true,
  "publicShareToken": "fd81c8d0...",
  "createdAt": "2025-06-12T10:17:04.990Z",
  "updatedAt": "2025-12-15T05:46:23.784Z",
  "documentsFlutter": [
    {
      "id": "48393746-7999-433d-af45-57525162e1b1",
      "type": "Накладная",
      "filePath": "https://dvbwzjercbgkoxwdknss.supabase.co/storage/v1/object/public/documents/...",
      "receiverName": "Неизвестный получатель",
      "fields": { ... }
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

### Mobile Implementation

**Kotlin (Android)**:
```kotlin
data class Deal(
    val id: String,
    val receiverBin: String,
    val title: String,
    val description: String?,
    val dealType: String,
    val totalAmount: Double,
    val paidAmount: Double,
    val status: String,
    val isPublic: Boolean,
    val publicShareToken: String,
    val documentsFlutter: List<Document>,
    val comments: List<Comment>
)

data class Document(
    val id: String,
    val type: String,
    val filePath: String,
    val receiverName: String,
    val fields: Map<String, Any>
)

data class Comment(
    val id: String,
    val text: String,
    val createdAt: String,
    val author: Author
)

data class Author(
    val id: String,
    val fullname: String
)

suspend fun getPublicDeal(shareToken: String): Deal {
    val response = httpClient.get("$BASE_URL/deals/$shareToken") {
        parameter("token", shareToken)
    }
    return response.body()
}
```

**Swift (iOS)**:
```swift
struct Deal: Codable {
    let id: String
    let receiverBin: String
    let title: String
    let description: String?
    let dealType: String
    let totalAmount: Double
    let paidAmount: Double
    let status: String
    let isPublic: Bool
    let publicShareToken: String
    let documentsFlutter: [Document]
    let comments: [Comment]
}

struct Document: Codable {
    let id: String
    let type: String
    let filePath: String
    let receiverName: String
    let fields: [String: AnyCodable]
}

struct Comment: Codable {
    let id: String
    let text: String
    let createdAt: String
    let author: Author
}

struct Author: Codable {
    let id: String
    let fullname: String
}

func getPublicDeal(shareToken: String) async throws -> Deal {
    var components = URLComponents(string: "\(baseURL)/deals/\(shareToken)")!
    components.queryItems = [URLQueryItem(name: "token", value: shareToken)]

    let (data, _) = try await URLSession.shared.data(from: components.url!)
    return try JSONDecoder().decode(Deal.self, from: data)
}
```

**Flutter**:
```dart
class Deal {
  final String id;
  final String receiverBin;
  final String title;
  final String? description;
  final String dealType;
  final double totalAmount;
  final double paidAmount;
  final String status;
  final bool isPublic;
  final String publicShareToken;
  final List<Document> documentsFlutter;
  final List<Comment> comments;

  Deal({
    required this.id,
    required this.receiverBin,
    required this.title,
    this.description,
    required this.dealType,
    required this.totalAmount,
    required this.paidAmount,
    required this.status,
    required this.isPublic,
    required this.publicShareToken,
    required this.documentsFlutter,
    required this.comments,
  });

  factory Deal.fromJson(Map<String, dynamic> json) => Deal(
    id: json['id'],
    receiverBin: json['receiverBin'],
    title: json['title'],
    description: json['description'],
    dealType: json['dealType'],
    totalAmount: json['totalAmount'].toDouble(),
    paidAmount: json['paidAmount'].toDouble(),
    status: json['status'],
    isPublic: json['isPublic'],
    publicShareToken: json['publicShareToken'],
    documentsFlutter: (json['documentsFlutter'] as List)
        .map((e) => Document.fromJson(e))
        .toList(),
    comments: (json['comments'] as List)
        .map((e) => Comment.fromJson(e))
        .toList(),
  );
}

Future<Deal> getPublicDeal(String shareToken) async {
  final response = await http.get(
    Uri.parse('$baseUrl/deals/$shareToken?token=$shareToken'),
  );

  return Deal.fromJson(jsonDecode(response.body));
}
```

---

## 3. Get Deal Balance (Optional)

**Endpoint**: `GET /deals/:dealId/balance?token=:shareToken`

**Headers**: None

**Request**:
```bash
GET /deals/077123f5-8cea-4a43-8859-e1d20000754d/balance?token=fd81c8d0...
```

**Response**:
```json
{
  "totalAmount": 250000,
  "paidAmount": 250000,
  "remainingBalance": 0,
  "currency": "KZT"
}
```

---

## 4. Get Deal Transactions (Optional)

**Endpoint**: `GET /deals/:dealId/transactions?token=:shareToken`

**Headers**: None

**Response**:
```json
[
  {
    "id": "transaction-id",
    "date": "2025-06-12T10:17:04.990Z",
    "debitAccount": "1210",
    "creditAccount": "6010",
    "amount": 250000,
    "description": "Продажа товаров"
  }
]
```

---

## 5. Revoke Public Access

**Endpoint**: `PUT /deals/:dealId`

**Headers**:
```
Authorization: Bearer {userToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "isPublic": false
}
```

**Response**:
```json
{
  "id": "deal-id",
  "isPublic": false,
  "publicShareToken": null
}
```

---

## UI Flow

### Recommended User Flow

1. **User views deal details** → Clicks "Share" button
2. **App calls** `POST /deals/:dealId/share` → Receives share URL
3. **App shows share dialog** → User selects sharing method (WhatsApp, Telegram, Copy, etc.)
4. **Recipient opens link** → Opens in browser or app WebView
5. **Display preview page** → Show deal info, documents, comments (read-only)

### Screen Layout Suggestions

**Share Button Placement**:
- Add "Share" icon button to deal detail screen toolbar
- Use standard platform share icon (iOS: square with arrow, Android: 3 dots connected)

**Preview Screen (for recipient)**:
- Header: Deal title, status badge, receiver BIN
- Body:
  - Deal info card (amounts, dates, description)
  - Accounting details card (balance, transactions)
  - Comments section (read-only)
  - Documents grid (with preview/download)
- No edit buttons (read-only mode)

---

## Document File Handling

**Important**: The `filePath` field contains a complete Supabase public URL. Use it directly.

### Display Documents

```kotlin
// Kotlin - Load image/PDF from filePath
Glide.with(context)
    .load(document.filePath) // Use directly
    .into(imageView)

// For PDF
webView.loadUrl(document.filePath)
```

```swift
// Swift - Load image/PDF from filePath
let url = URL(string: document.filePath)!

// For images
imageView.kf.setImage(with: url)

// For PDF
webView.load(URLRequest(url: url))
```

```dart
// Flutter - Load image/PDF from filePath
Image.network(document.filePath) // Use directly

// For PDF
WebView(
  initialUrl: document.filePath,
)
```

**Do NOT**:
- ❌ Don't try to extract storage path
- ❌ Don't call Supabase SDK to get URL
- ✅ Just use `filePath` directly - it's already a complete URL

---

## Error Handling

### Common Errors

**401 Unauthorized** (when generating share link):
```json
{ "error": "Unauthorized" }
```
→ User token expired, refresh authentication

**404 Not Found** (when accessing public deal):
```json
{ "error": "Invalid share token or deal not publicly accessible" }
```
→ Show error: "This link is invalid or expired"

**500 Server Error**:
```json
{ "error": "Failed to generate share link" }
```
→ Show error: "Something went wrong. Please try again"

---

## Security Notes

1. **Share tokens are cryptographically secure** (64 characters)
2. **No authentication required** to view shared deals
3. **Read-only access** - recipients cannot modify data
4. **Revocable** - setting `isPublic: false` immediately disables the link
5. **Token in URL** - Always pass token as query parameter for validation

---

## Testing

### Test Share Link Generation

```bash
curl -X POST http://localhost:3000/deals/077123f5-8cea-4a43-8859-e1d20000754d/share \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Public Access

```bash
curl "http://localhost:3000/deals/SHARE_TOKEN?token=SHARE_TOKEN"
```

### Test URLs

**Development**:
```
http://localhost:3000/preview/deals/fd81c8d0e4e2e486ae09499d0a8498d5129ab22a975281a1c18f348b1443cded
```

**Production**:
```
https://infobuh.com/preview/deals/fd81c8d0e4e2e486ae09499d0a8498d5129ab22a975281a1c18f348b1443cded
```

---

## Quick Reference

| Action | Method | Endpoint | Auth Required |
|--------|--------|----------|---------------|
| Generate share link | POST | `/deals/:dealId/share` | ✅ Yes |
| View public deal | GET | `/deals/:shareToken?token=:shareToken` | ❌ No |
| Get balance | GET | `/deals/:dealId/balance?token=:shareToken` | ❌ No |
| Get transactions | GET | `/deals/:dealId/transactions?token=:shareToken` | ❌ No |
| Revoke access | PUT | `/deals/:dealId` (body: `{"isPublic": false}`) | ✅ Yes |

---

## Complete Example Flow

```kotlin
// 1. User clicks "Share" button
fun onShareClicked(dealId: String) {
    viewModelScope.launch {
        try {
            // 2. Generate share link
            val response = generateShareLink(dealId)

            // 3. Build full URL
            val fullUrl = getFullShareUrl(response.shareUrl)
            // Result: https://infobuh.com/preview/deals/fd81c8d0...

            // 4. Share with user
            shareLink(fullUrl)

        } catch (e: Exception) {
            showError("Failed to generate share link")
        }
    }
}

// 5. Recipient opens link (in app or browser)
// 6. App loads public deal data
fun loadPublicDeal(shareToken: String) {
    viewModelScope.launch {
        try {
            val deal = getPublicDeal(shareToken)
            displayDeal(deal) // Show in read-only mode
        } catch (e: Exception) {
            showError("This link is invalid or expired")
        }
    }
}
```

---

## Need Help?

- Full documentation: `/docs/DEAL_PREVIEW_SHARE.md` (English)
- Full documentation: `/docs/DEAL_PREVIEW_SHARE_RU.md` (Russian)
- Backend code: `/packages/backend/src/routes/deal.ts`
- Frontend code: `/packages/frontend/src/routes/preview/`

---

**Version**: 1.0.0
**Last Updated**: 2025-12-15
