import {
	createDocumentGenerator,
} from "@accounting-kz/document-templates";

export type DocumentType = "АВР" | "Доверенность" | "Накладная" | "Инвойс" | "КП" | "Счет на оплату";

export interface GeneratedDocumentResult {
	success: true;
	filePath: string;
	fileName: string;
	documentType: string;
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
 * Integrates with the existing document template system
 */
export class DocumentGenerationService {
	private documentGenerator: ReturnType<typeof createDocumentGenerator>;

	constructor() {
		this.documentGenerator = createDocumentGenerator();
	}

	/**
	 * Automatically generate document based on deal type
	 */
	async generateDocument(
		documentType: DocumentType,
		data: any,
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

			const result = await this.documentGenerator.generate(
				generatorKey as any,
				data,
			);

			if (!result.success) {
				// This part needs to be adjusted based on the actual error structure from the generator
				return {
					success: false,
					error: {
						code: "GENERATION_FAILED",
						message: "Failed to generate document",
						details: result,
					},
				};
			}

			// Here you can add logic to save the document record to the database if needed
			// For now, just returning the successful generation result.

			return {
				success: true,
				filePath: result.filePath,
				fileName: result.fileName,
				documentType,
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
} 