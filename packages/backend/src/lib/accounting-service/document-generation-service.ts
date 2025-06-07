import { Database, eq, legalEntities, partners, employees, products, banks } from "@accounting-kz/db";
import {
	createDocumentGenerator,
	type KazakhActInput,
	type KazakhWaybillInput,
	type ActItem,
	type WaybillItem,
} from "@accounting-kz/document-templates";
import { documentsFlutter } from "@accounting-kz/db";
import type { DealType } from "./deal-accounting-service";
import type { DocumentProduct, AVRDocument, WaybillDocument } from "./document-schemas";

export interface DocumentGenerationParams {
	dealId: string;
	dealType: DealType;
	legalEntityId: string;
	receiverBin: string;
	title: string;
	description?: string;
	totalAmount: number;
	createdBy: string;
}

export interface GeneratedDocumentResult {
	success: true;
	documentId: string;
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

	constructor(private db: Database) {
		this.documentGenerator = createDocumentGenerator(db);
	}

	/**
	 * Automatically generate document based on deal type
	 */
	async generateDocumentForDeal(params: DocumentGenerationParams): Promise<DocumentGenerationResult> {
		try {
			// Get legal entities and related data
			const [sellerLegalEntity, clientLegalEntity] = await Promise.all([
				this.db.query.legalEntities.findFirst({
					where: eq(legalEntities.id, params.legalEntityId),
					with: {
						banks: true,
						employees: true,
					},
				}),
				this.getClientLegalEntity(params.receiverBin),
			]);

			if (!sellerLegalEntity) {
				return {
					success: false,
					error: {
						code: "SELLER_NOT_FOUND",
						message: `Seller legal entity not found: ${params.legalEntityId}`,
					},
				};
			}

			// Create document based on deal type
			const result = await this.generateDocument(
				params.dealType,
				{
					...params,
					sellerLegalEntity,
					clientLegalEntity,
				}
			);

			if (!result.success) {
				return result;
			}

			// Save document to database
			const [documentRecord] = await this.db
				.insert(documentsFlutter)
				.values({
					legalEntityId: params.legalEntityId,
					type: params.dealType === "service" ? "act" : "waybill",
					receiverBin: params.receiverBin,
					receiverName: clientLegalEntity?.name || "Неизвестный получатель",
					fields: {
						dealId: params.dealId,
						documentType: params.dealType === "service" ? "kazakh-acts" : "kazakh-waybill",
						generatedAt: new Date().toISOString(),
						title: params.title,
						description: params.description,
						totalAmount: params.totalAmount,
					},
					filePath: result.filePath,
				})
				.returning();

			return {
				success: true,
				documentId: documentRecord.id,
				filePath: result.filePath,
				fileName: result.fileName,
				documentType: params.dealType === "service" ? "kazakh-acts" : "kazakh-waybill",
			};
		} catch (error) {
			console.error("Error generating document for deal:", error);
			return {
				success: false,
				error: {
					code: "GENERATION_ERROR",
					message: error instanceof Error ? error.message : "Unknown error during document generation",
					details: error,
				},
			};
		}
	}

	/**
	 * Generate specific document type with comprehensive data fetching
	 */
	private async generateDocument(
		dealType: DealType,
		params: DocumentGenerationParams & {
			sellerLegalEntity: any;
			clientLegalEntity: any;
		}
	) {
		const currentDate = new Date();
		const documentNumber = await this.generateDocumentNumber(dealType, params.legalEntityId);
		
		// Fetch comprehensive data for document generation
		const documentData = await this.prepareDocumentData(params);
		
		// Create default item from deal data
		const defaultItem = {
			description: params.title + (params.description ? ` - ${params.description}` : ""),
			quantity: 1,
			unit: dealType === "service" ? "услуга" : "шт",
			price: params.totalAmount,
		};

		if (dealType === "service") {
			// Generate АВР (Act of Completed Works)
			const actInput: KazakhActInput = {
				sellerLegalEntityId: params.legalEntityId,
				clientLegalEntityId: params.clientLegalEntity?.id || params.legalEntityId,
				actNumber: documentNumber,
				actDate: currentDate,
				contractNumber: `Договор-${params.dealId.slice(0, 8)}`,
				contractDate: currentDate,
				items: [defaultItem as ActItem],
				executorEmployeeId: documentData.primaryEmployee?.id || null,
				customerEmployeeId: null,
				dateOfCompletion: currentDate,
			};

			const result = await this.documentGenerator.generate("generateAct", actInput);
			return {
				success: true as const,
				filePath: result.filePath,
				fileName: result.fileName,
			};
		} else {
			// Generate Накладная (Waybill)
			const waybillInput: KazakhWaybillInput = {
				sellerLegalEntityId: params.legalEntityId,
				clientLegalEntityId: params.clientLegalEntity?.id || params.legalEntityId,
				waybillNumber: documentNumber,
				waybillDate: currentDate,
				contractNumber: `Договор-${params.dealId.slice(0, 8)}`,
				contractDate: currentDate,
				items: [defaultItem as WaybillItem],
				senderEmployeeId: documentData.primaryEmployee?.id || null,
				receiverEmployeeId: null,
				releaserEmployeeId: documentData.primaryEmployee?.id || null,
				transportOrgName: undefined,
				transportResponsiblePerson: undefined,
			};

			const result = await this.documentGenerator.generate("generateWaybill", waybillInput);
			return {
				success: true as const,
				filePath: result.filePath,
				fileName: result.fileName,
			};
		}
	}

	/**
	 * Prepare comprehensive document data from database
	 */
	private async prepareDocumentData(params: DocumentGenerationParams & {
		sellerLegalEntity: any;
		clientLegalEntity: any;
	}) {
		// Get seller's bank information
		const sellerBank = await this.db.query.banks.findFirst({
			where: eq(banks.legalEntityId, params.legalEntityId),
		});

		// Get seller's employees (director/primary contact)
		const sellerEmployees = await this.db.query.employees.findMany({
			where: eq(employees.legalEntityId, params.legalEntityId),
		});

		// Find primary employee (director or first available)
		const primaryEmployee = sellerEmployees.find(emp => 
			emp.role.toLowerCase().includes('директор') || 
			emp.role.toLowerCase().includes('генеральный')
		) || sellerEmployees[0];

		// Get client's employees if available
		let clientEmployees: any[] = [];
		if (params.clientLegalEntity?.id && params.clientLegalEntity.id !== params.legalEntityId) {
			clientEmployees = await this.db.query.employees.findMany({
				where: eq(employees.legalEntityId, params.clientLegalEntity.id),
			});
		}

		const clientPrimaryEmployee = clientEmployees.find(emp => 
			emp.role.toLowerCase().includes('директор') || 
			emp.role.toLowerCase().includes('генеральный')
		) || clientEmployees[0];

		return {
			sellerBank,
			primaryEmployee,
			sellerEmployees,
			clientEmployees,
			clientPrimaryEmployee,
			// Pre-formatted data for easy document generation
			formattedData: {
				// Organization info
				orgName: params.sellerLegalEntity.name,
				orgAddress: params.sellerLegalEntity.address,
				orgBin: params.sellerLegalEntity.bin,
				
				// Buyer info
				buyerName: params.clientLegalEntity?.name || "Неизвестный покупатель",
				buyerBin: params.receiverBin,
				
				// Contract info
				contract: `Договор-${params.dealId.slice(0, 8)}`,
				
				// Personnel info
				orgPersonName: primaryEmployee?.fullName || "Не указано",
				orgPersonRole: primaryEmployee?.role || "Директор",
				buyerPersonName: clientPrimaryEmployee?.fullName || "",
				buyerPersonRole: clientPrimaryEmployee?.role || "",
				
				// Contact info
				phone: params.sellerLegalEntity.phone || "",
				
				// Bank info
				selectedBank: {
					name: sellerBank?.name || "",
					account: sellerBank?.account || "",
					bik: sellerBank?.bik || "",
				},
				
				// Products from deal
				products: [{
					name: params.title,
					description: params.description || "",
					quantity: 1,
					unit: params.dealType === "service" ? "услуга" : "шт",
					price: params.totalAmount,
					total: params.totalAmount,
					vat: Math.round(params.totalAmount * 0.12), // 12% VAT
				}] as DocumentProduct[],
				
				// Document specifics
				idx: await this.generateDocumentNumber(params.dealType, params.legalEntityId),
				total: params.totalAmount,
			}
		};
	}

	/**
	 * Get client legal entity by BIN or create a partner record
	 */
	private async getClientLegalEntity(receiverBin: string) {
		// First try to find existing legal entity
		let clientEntity = await this.db.query.legalEntities.findFirst({
			where: eq(legalEntities.bin, receiverBin),
		});

		if (!clientEntity) {
			// Try to find in partners table
			const partner = await this.db.query.partners.findFirst({
				where: eq(partners.bin, receiverBin),
			});

			if (partner) {
				// Create a virtual entity from partner data
				clientEntity = {
					id: partner.id,
					name: partner.name,
					bin: partner.bin,
					address: partner.address,
					type: "ТОО", // Default type
					phone: "",
					oked: "",
					registrationDate: new Date(),
					ugd: "",
					profileId: "",
					image: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				};
			}
		}

		return clientEntity;
	}

	/**
	 * Generate unique document number
	 */
	private async generateDocumentNumber(dealType: DealType, legalEntityId: string): Promise<string> {
		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, "0");
		const timestamp = now.getTime().toString().slice(-6);
		
		const prefix = dealType === "service" ? "АВР" : "НАК";
		return `${prefix}-${year}${month}-${timestamp}`;
	}
} 