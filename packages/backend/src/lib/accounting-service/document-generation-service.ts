import {
	createDocumentGenerator,
} from "@accounting-kz/document-templates";
import { supabaseStorage } from "../supabase";
import fs from "node:fs/promises";
import path from "node:path";

export type DocumentType = "АВР" | "Доверенность" | "Накладная" | "Инвойс" | "КП" | "Счет на оплату";

export interface GeneratedDocumentResult {
	success: true;
	filePath: string; // Now this will be the Supabase storage URL
	fileName: string;
	documentType: string;
	localPath?: string; // Optional local path for debugging
	publicUrl: string; // Supabase public URL
	storagePath: string; // Full storage path in Supabase
}

export interface GeneratedDocumentError {
	success: false;
	error: {
		code: string;
		message: string;
		details?: any;
	};
}

export type DocumentGenerationResult = GeneratedDocumentResult | GeneratedDocumentError;

/**
 * Service for automatically generating documents when deals are created
 * Integrates with the existing document template system and uploads to Supabase Storage
 */
export class DocumentGenerationService {
	private documentGenerator: ReturnType<typeof createDocumentGenerator>;
	private bucketName = "documents"; // Supabase storage bucket name

	constructor() {
		this.documentGenerator = createDocumentGenerator();
	}

	/**
	 * Sanitize document type for use in storage paths
	 */
	private sanitizeDocumentType(documentType: DocumentType): string {
		const translitMap: Record<string, string> = {
			"АВР": "avr",
			"Доверенность": "doverennost",
			"Накладная": "waybill",
			"Инвойс": "invoice",
			"КП": "kp",
			"Счет на оплату": "invoice"
		};

		return translitMap[documentType] || documentType.toLowerCase().replace(/[^a-z0-9]/g, '_');
	}

	/**
	 * Upload file to Supabase Storage with legal entity organization
	 */
	private async uploadToSupabase(
		localFilePath: string,
		fileName: string,
		documentType: DocumentType,
		legalEntityId: string
	): Promise<{ publicUrl: string; storagePath: string }> {
		try {
			// Sanitize document type for storage path
			const sanitizedDocumentType = this.sanitizeDocumentType(documentType);

			// Create folder structure: documents/{legalEntityId}/{sanitizedDocumentType}/{fileName}
			const storagePath = `${legalEntityId}/${sanitizedDocumentType}/${fileName}`;

			// Read the file buffer
			const fileBuffer = await fs.readFile(localFilePath);

			// Upload to Supabase Storage
			const { data, error } = await supabaseStorage
				.from(this.bucketName)
				.upload(storagePath, fileBuffer, {
					contentType: 'application/pdf',
					cacheControl: '3600',
					upsert: false
				});

			if (error) {
				throw new Error(`Supabase upload failed: ${error.message}`);
			}

			// Get the public URL
			const { data: publicUrlData } = supabaseStorage
				.from(this.bucketName)
				.getPublicUrl(storagePath);

			if (!publicUrlData?.publicUrl) {
				throw new Error("Failed to get public URL from Supabase");
			}

			return {
				publicUrl: publicUrlData.publicUrl,
				storagePath: data.path
			};
		} catch (error) {
			console.error("Error uploading to Supabase:", error);
			throw error;
		}
	}

	/**
	 * Clean up local file after successful upload
	 */
	private async cleanupLocalFile(filePath: string): Promise<void> {
		try {
			await fs.unlink(filePath);
			console.log(`Cleaned up local file: ${filePath}`);
		} catch (error) {
			console.warn(`Failed to cleanup local file ${filePath}:`, error);
		}
	}

	/**
	 * Automatically generate document based on deal type and upload to Supabase
	 */
	async generateDocument(
		documentType: DocumentType,
		data: any,
		legalEntityId: string,
	): Promise<DocumentGenerationResult> {
		try {
			const generatorMap = {
				АВР: "generateAct",
				Накладная: "generateWaybill",
				"Счет на оплату": "generateInvoice",
				Инвойс: "generateInvoice",
				Доверенность: "generateDoverennost",
			};

			const generatorKey =
				generatorMap[documentType as keyof typeof generatorMap];

			if (!generatorKey) {
				return {
					success: false,
					error: {
						code: "NOT_IMPLEMENTED",
						message: `Document type ${documentType} is not yet implemented`,
					},
				};
			}

			// Generate the document locally first
			const result = await this.documentGenerator.generate(
				generatorKey as any,
				data,
			);

			if (!result.success) {
				return {
					success: false,
					error: {
						code: "GENERATION_FAILED",
						message: "Failed to generate document",
						details: result,
					},
				};
			}

			// Upload to Supabase Storage with legal entity organization
			const uploadResult = await this.uploadToSupabase(
				result.filePath,
				result.fileName,
				documentType,
				legalEntityId
			);

			// Clean up local file (optional - you might want to keep it for backup)
			await this.cleanupLocalFile(result.filePath);

			return {
				success: true,
				filePath: uploadResult.publicUrl, // Return Supabase URL as main file path
				fileName: result.fileName,
				documentType,
				publicUrl: uploadResult.publicUrl,
				storagePath: uploadResult.storagePath,
				localPath: result.filePath // Keep reference to original local path for debugging
			};
		} catch (error) {
			console.error(`Error generating document type ${documentType}:`, error);
			return {
				success: false,
				error: {
					code: "GENERATION_ERROR",
					message:
						error instanceof Error
							? error.message
							: "Unknown error during document generation",
					details: error,
				},
			};
		}
	}

	/**
	 * Get public URL for an existing document in Supabase Storage
	 */
	getPublicUrl(storagePath: string): string {
		const { data } = supabaseStorage
			.from(this.bucketName)
			.getPublicUrl(storagePath);

		return data.publicUrl;
	}

	/**
	 * List documents in storage by legal entity and document type
	 */
	async listDocuments(
		legalEntityId: string,
		documentType?: DocumentType,
		limit = 100
	): Promise<any[]> {
		try {
			const folderPath = documentType
				? `${legalEntityId}/${this.sanitizeDocumentType(documentType)}`
				: legalEntityId;

			const { data, error } = await supabaseStorage
				.from(this.bucketName)
				.list(folderPath, {
					limit,
					sortBy: { column: 'created_at', order: 'desc' }
				});

			if (error) {
				throw new Error(`Failed to list documents: ${error.message}`);
			}

			return data || [];
		} catch (error) {
			console.error("Error listing documents:", error);
			return [];
		}
	}

	/**
	 * List documents by legal entity (all document types)
	 */
	async listDocumentsByLegalEntity(legalEntityId: string, limit = 100): Promise<any[]> {
		try {
			const { data, error } = await supabaseStorage
				.from(this.bucketName)
				.list(legalEntityId, {
					limit,
					sortBy: { column: 'created_at', order: 'desc' }
				});

			if (error) {
				throw new Error(`Failed to list documents for legal entity: ${error.message}`);
			}

			return data || [];
		} catch (error) {
			console.error("Error listing documents by legal entity:", error);
			return [];
		}
	}

	/**
	 * Delete a document from Supabase Storage
	 */
	async deleteDocument(storagePath: string): Promise<boolean> {
		try {
			const { error } = await supabaseStorage
				.from(this.bucketName)
				.remove([storagePath]);

			if (error) {
				throw new Error(`Failed to delete document: ${error.message}`);
			}

			return true;
		} catch (error) {
			console.error("Error deleting document:", error);
			return false;
		}
	}

	/**
	 * Generate document for a deal - convenience method that integrates with deal accounting
	 */
	async generateDocumentForDeal(
		dealId: string,
		documentType: DocumentType,
		dealData: any,
		legalEntityId: string
	): Promise<DocumentGenerationResult> {
		// Add deal ID to the document data for reference
		const documentData = {
			...dealData,
			dealId,
			reference: `DEAL-${dealId}`,
		};

		return this.generateDocument(documentType, documentData, legalEntityId);
	}
} 