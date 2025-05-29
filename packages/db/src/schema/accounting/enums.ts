// TypeScript union types for accounting enums
export type AccountType =
	| "asset"
	| "liability"
	| "equity"
	| "revenue"
	| "expense";

export type EntryStatus =
	| "draft"
	| "pending_review"
	| "approved"
	| "posted"
	| "cancelled";

export type PeriodStatus = "open" | "closed" | "locked";

// Export arrays for validation
export const ACCOUNT_TYPES = [
	"asset",
	"liability",
	"equity",
	"revenue",
	"expense",
] as const;

export const ENTRY_STATUSES = [
	"draft",
	"pending_review",
	"approved",
	"posted",
	"cancelled",
] as const;

export const PERIOD_STATUSES = ["open", "closed", "locked"] as const;
 