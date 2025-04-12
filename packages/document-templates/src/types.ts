/**
 * Minimal Database interface for document template generation
 */
export interface Database {
	query: <T = any>(
		text: string,
		params?: any[],
	) => Promise<{ rows: T[]; rowCount: number }>;
}
