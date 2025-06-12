import { Database, eq, legalEntities, partners, employees, products, banks } from "@accounting-kz/db";
import {
	createDocumentGenerator,
	type KazakhActInput,
	type KazakhWaybillInput,
	type KazakhInvoiceInput,
	type ActItem,
	type WaybillItem,
	type InvoiceItem,
} from "@accounting-kz/document-templates";
import { documentsFlutter } from "@accounting-kz/db";
import type { DealType } from "./deal-accounting-service";
import type { DocumentProduct, AVRDocument, WaybillDocument } from "./document-schemas";

export type DocumentType = "АВР" | "Доверенность" | "Накладная" | "Инвойс" | "КП" | "Счет на оплату";

export interface DocumentGenerationParams {
	dealId: string;
	dealType: DealType;
	documentType?: DocumentType; // Optional override for document type
	legalEntityId: string;
	receiverBin: string;
	title: string;
	description?: string;
	totalAmount: number;
	createdBy: string;
	// Additional fields for specific document types
	employeeName?: string;
	employeeRole?: string;
	employeeIin?: string;
	employeeDocNumber?: string;
	employeeDocNumberDate?: string;
	employeeWhoGives?: string;
	dateUntil?: string;
	codeKnp?: string;
	schetNaOplatu?: string;
	productDeadline?: string;
	productPriceCondition?: string;
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
	 * Get document type based on deal type or explicit override
	 */
	private getDocumentType(params: DocumentGenerationParams): DocumentType {
		if (params.documentType) {
			return params.documentType;
		}
		// Default mapping based on deal type
		return params.dealType === "service" ? "АВР" : "Накладная";
	}

	/**
	 * Automatically generate document based on deal type
	 */
	async generateDocumentForDeal(params: DocumentGenerationParams): Promise<DocumentGenerationResult> {
		try {
			// Get document type
			const documentType = this.getDocumentType(params);

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

			// Create document based on document type
			const result = await this.generateDocument(
				documentType,
				{
					...params,
					sellerLegalEntity,
					clientLegalEntity,
				}
			);

			console.log(result);

			if (!result.success) {
				return result;
			}

			// Save document to database
			const [documentRecord] = await this.db
				.insert(documentsFlutter)
				.values({
					legalEntityId: params.legalEntityId,
					type: documentType,
					receiverBin: params.receiverBin,
					receiverName: clientLegalEntity?.name || "Неизвестный получатель",
					fields: {
						dealId: params.dealId,
						documentType: documentType,
						generatedAt: new Date().toISOString(),
						title: params.title,
						description: params.description,
						totalAmount: params.totalAmount,
						...(result.fields || {}),
					},
					filePath: result.filePath,
				})
				.returning();

			return {
				success: true,
				documentId: documentRecord.id,
				filePath: result.filePath,
				fileName: result.fileName,
				documentType: documentType,
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
		documentType: DocumentType,
		params: DocumentGenerationParams & {
			sellerLegalEntity: any;
			clientLegalEntity: any;
		},
	) {
		const currentDate = new Date();
		const documentNumber = await this.generateDocumentNumber(
			params.dealType,
			params.legalEntityId,
		);
		const documentData = await this.prepareDocumentData(params);
		const defaultItem = {
			description:
				params.title + (params.description ? ` - ${params.description}` : ""),
			quantity: 1,
			unit: params.dealType === "service" ? "услуга" : "шт",
			price: params.totalAmount,
		};

		const handler =
			this.documentHandlers[documentType as keyof typeof this.documentHandlers];

		if (handler) {
			return handler.call(
				this,
				params,
				documentNumber,
				currentDate,
				defaultItem,
				documentData,
			);
		}

		throw new Error(`Document type ${documentType} is not yet implemented`);
	}

	private async generateAct(
		params: any,
		documentNumber: string,
		currentDate: Date,
		defaultItem: ActItem,
		documentData: any,
	) {
		const actInput: KazakhActInput = {
			sellerLegalEntityId: params.legalEntityId,
			clientLegalEntityId: params.clientLegalEntity?.id || params.legalEntityId,
			actNumber: documentNumber,
			actDate: currentDate,
			contractNumber: `Договор-${params.dealId.slice(0, 8)}`,
			contractDate: currentDate,
			items: [defaultItem],
			executorEmployeeId: documentData.primaryEmployee?.id || null,
			customerEmployeeId: null,
			dateOfCompletion: currentDate,
		};

		const result = await this.documentGenerator.generate("generateAct", actInput);
		return {
			success: true as const,
			filePath: result.filePath,
			fileName: result.fileName,
			fields: result.fields,
			documentId: "", // Will be set later
			documentType: "АВР" as DocumentType,
		};
	}

	private async generateWaybill(
		params: any,
		documentNumber: string,
		currentDate: Date,
		defaultItem: WaybillItem,
		documentData: any,
	) {
		const waybillInput: KazakhWaybillInput = {
			sellerLegalEntityId: params.legalEntityId,
			clientLegalEntityId: params.clientLegalEntity?.id || params.legalEntityId,
			waybillNumber: documentNumber,
			waybillDate: currentDate,
			contractNumber: `Договор-${params.dealId.slice(0, 8)}`,
			contractDate: currentDate,
			items: [defaultItem],
			senderEmployeeId: documentData.primaryEmployee?.id || null,
			receiverEmployeeId: null,
			releaserEmployeeId: documentData.primaryEmployee?.id || null,
			transportOrgName: undefined,
			transportResponsiblePerson: undefined,
		};

		const result = await this.documentGenerator.generate(
			"generateWaybill",
			waybillInput,
		);
		return {
			success: true as const,
			filePath: result.filePath,
			fileName: result.fileName,
			fields: result.fields,
			documentId: "", // Will be set later
			documentType: "Накладная" as DocumentType,
		};
	}

	private async generateInvoice(
		params: any,
		documentNumber: string,
		currentDate: Date,
		defaultItem: InvoiceItem,
		documentData: any,
	) {
		const invoiceInput: KazakhInvoiceInput = {
			sellerLegalEntityId: params.legalEntityId,
			clientLegalEntityId: params.clientLegalEntity?.id || params.legalEntityId,
			invoiceNumber: documentNumber,
			invoiceDate: currentDate,
			contractNumber: `Договор-${params.dealId.slice(0, 8)}`,
			contractDate: currentDate,
			items: [defaultItem],
			executorEmployeeId: documentData.primaryEmployee?.id || null,
			contactPhone: documentData.formattedData.phone,
		};

		const result = await this.documentGenerator.generate(
			"generateInvoice",
			invoiceInput,
		);
		return {
			success: true as const,
			filePath: result.filePath,
			fileName: result.fileName,
			fields: result.fields,
			documentId: "", // Will be set later
			documentType: "Инвойс" as DocumentType,
		};
	}

	private documentHandlers = {
		АВР: this.generateAct,
		Накладная: this.generateWaybill,
		"Счет на оплату": this.generateInvoice,
		Инвойс: this.generateInvoice,
	};

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
				orgAddress: params.sellerLegalEntity.address || "",
				orgBin: params.sellerLegalEntity.bin,
				orgIik: sellerBank?.account || "",
				orgBik: sellerBank?.bik || "",

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

				// Additional fields for specific document types
				productDescription: params.description || "",
				productName: params.title,
				productDeadline: params.productDeadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
				productPrice: params.totalAmount,
				productPriceCondition: params.productPriceCondition || "Цена указана с НДС",
				codeKnp: params.codeKnp || "",
				schetNaOplatu: params.schetNaOplatu || "",

				// Employee/Доверенность specific fields
				employeeName: params.employeeName || "",
				employeeRole: params.employeeRole || "",
				employeeIin: params.employeeIin || "",
				employeeDocNumber: params.employeeDocNumber || "",
				employeeDocNumberDate: params.employeeDocNumberDate || "",
				employeeWhoGives: params.employeeWhoGives || "",
				dateUntil: params.dateUntil || ""
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