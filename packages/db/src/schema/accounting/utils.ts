/**
 * Utility functions for handling currency amounts stored as bigint
 */

/**
 * Convert a display amount (e.g., 123.45) to smallest currency unit (e.g., 12345 cents)
 * @param amount - The display amount as a number or string
 * @param decimals - Number of decimal places for the currency (e.g., 2 for USD)
 * @returns BigInt amount in smallest currency unit
 */
export function toSmallestUnit(
	amount: number | string,
	decimals: number,
): bigint {
	const numAmount =
		typeof amount === "string" ? Number.parseFloat(amount) : amount;
	const multiplier = 10 ** decimals;
	return BigInt(Math.round(numAmount * multiplier));
}

/**
 * Convert from smallest currency unit to display amount
 * @param amount - BigInt amount in smallest currency unit
 * @param decimals - Number of decimal places for the currency
 * @returns Display amount as a number
 */
export function fromSmallestUnit(amount: bigint, decimals: number): number {
	const divisor = 10 ** decimals;
	return Number(amount) / divisor;
}

/**
 * Format amount for display with proper decimal places
 * @param amount - BigInt amount in smallest currency unit
 * @param decimals - Number of decimal places for the currency
 * @param currency - Currency symbol (optional)
 * @returns Formatted string (e.g., "$123.45")
 */
export function formatAmount(
	amount: bigint,
	decimals: number,
	currency?: string,
): string {
	const displayAmount = fromSmallestUnit(amount, decimals);
	const formatted = displayAmount.toFixed(decimals);
	return currency ? `${currency}${formatted}` : formatted;
}

/**
 * Validate that an amount string can be converted to a valid currency amount
 * @param amount - Amount string to validate
 * @param decimals - Maximum decimal places allowed
 * @returns boolean indicating if valid
 */
export function isValidAmount(amount: string, decimals: number): boolean {
	const pattern = new RegExp(`^\\d+(\\.\\d{1,${decimals}})?$`);
	return pattern.test(amount);
}
