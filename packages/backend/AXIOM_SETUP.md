# Axiom Integration Setup

This guide will help you set up Axiom for centralized logging and analytics in your accounting system backend.

## Environment Variables

Add these variables to your `.env` file:

```bash
# Axiom Configuration
AXIOM_TOKEN=your_axiom_api_token
AXIOM_ORG_ID=your_axiom_org_id  # Optional - only needed for some configurations
```

## Getting Your Axiom Credentials

1. **Sign up for Axiom**: Go to [axiom.co](https://axiom.co) and create a free account
2. **Get your API Token**:

   - Go to Settings → API Tokens
   - Create a new token with "Ingest" permissions
   - Copy the token value

3. **Find your Org ID** (if needed):
   - Check your Axiom URL: `https://app.axiom.co/{org-id}/`
   - Or go to Settings → Organization

## What's Included

### Structured Logging

Every API request is logged with:

- **Request details**: Method, path, status, duration
- **User identification**: User ID (first 8 chars for privacy)
- **Query parameters**: All URL parameters
- **Request body**: JSON data (with sensitive fields redacted)
- **Response body**: For errors and important endpoints
- **Metadata**: IP address, user agent, timestamp

### Data Sanitization

Sensitive fields are automatically redacted:

- `password`, `token`, `key`, `secret`, `cms`, `data`

### Log Levels

- **info**: Successful requests (200-299)
- **warn**: Client errors (400-499)
- **error**: Server errors (500+)

### Example Log Structure

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "method": "POST",
  "path": "/journal-entries",
  "status": 201,
  "duration_ms": 45,
  "user_id": "1bfd1699-c849-43bb-8e23-f528f3bd4a0c",
  "query_params": {"legalEntityId": "2cc7dc33-f82a-4248-b969-f1d7902250ce"},
  "request_body": {"entryNumber": "JE-001", "lines": [...]},
  "response_body": {"success": true, "data": {...}},
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "log_level": "info"
}
```

## Console Output

The integration maintains your existing console logging format:

```
POST /journal-entries 201 45ms | user:1bfd1699 | query:legalEntityId=2cc7dc33 | body:{"entryNumber":"JE-001"} | response:{"success":true}
```

## Axiom Dashboard

Once configured, you can:

1. **View real-time logs** in your Axiom dashboard
2. **Search and filter** by any field (user, path, status, etc.)
3. **Create alerts** for errors or specific patterns
4. **Build dashboards** for API monitoring
5. **Analyze usage patterns** and performance

## Sample Queries (APL)

### Error Rate by Endpoint

```apl
['api-logs']
| where log_level == "error"
| summarize count() by path
| order by count_ desc
```

### Slowest Endpoints

```apl
['api-logs']
| where duration_ms > 1000
| summarize avg(duration_ms) by path
| order by avg_duration_ms desc
```

### User Activity

```apl
['api-logs']
| where isnotempty(user_id)
| summarize requests = count() by user_id
| order by requests desc
```

## Cost Estimation

For 20,000 active users:

- **Data volume**: ~2.88 GB/month
- **Storage**: 12 months retention
- **Estimated cost**: ~$25-30/month

## Fallback Behavior

- If Axiom is unavailable, logs continue to console
- No application downtime from logging failures
- Automatic retries and error handling

## Testing

Test the integration:

```bash
# Make some API calls and check both:
# 1. Console output (immediate)
# 2. Axiom dashboard (within ~30 seconds)

curl -X GET "http://localhost:3000/health-check"
curl -X GET "http://localhost:3000/accounts?legalEntityId=test"
```

## Support

- **Axiom Docs**: https://axiom.co/docs
- **APL Reference**: https://axiom.co/docs/apl
- **Status Page**: https://axiom.statuspage.io
