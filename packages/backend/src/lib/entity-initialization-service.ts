import { type Database, employees, partners, eq, and, type Employee } from "@accounting-kz/db";

export interface InitializationResult {
	employee: Employee | null;
	partner: any | null;
	message: string;
}

/**
 * Service for initializing default entities (employees and partners) for a legal entity
 * Automatically creates default физические лица when a legal entity is created
 */
export class EntityInitializationService {
	constructor(private db: Database) {}

	/**
	 * Initialize default employee and partner for a legal entity
	 * @param legalEntityId - The legal entity ID
	 * @param registrationDate - The legal entity's registration date
	 * @returns Result with created entities or null if already exist
	 */
	async initializeDefaultEntities(
		legalEntityId: string,
		registrationDate: Date,
	): Promise<InitializationResult> {
		try {
			console.log(`👤 Initializing default entities for legal entity: ${legalEntityId}`);

			const employee = await this.createDefaultEmployee(legalEntityId, registrationDate);
			const partner = await this.createDefaultPartner(legalEntityId);

			const message = employee || partner
				? `Initialized default entities for legal entity ${legalEntityId}`
				: `Default entities already exist for legal entity ${legalEntityId}`;

			console.log(`✅ ${message}`);

			return {
				employee,
				partner,
				message,
			};
		} catch (error) {
			console.error(`❌ Error initializing default entities for legal entity ${legalEntityId}:`, error);
			throw error;
		}
	}

	/**
	 * Create default employee (физическое лицо) for a legal entity
	 * Checks for existing employee with IIN "000000000000" before creating
	 * @param legalEntityId - The legal entity ID
	 * @param registrationDate - The legal entity's registration date
	 * @returns Created employee or null if already exists
	 */
	private async createDefaultEmployee(
		legalEntityId: string,
		registrationDate: Date,
	): Promise<Employee | null> {
		try {
			// Check if default employee already exists for this legal entity
			const existing = await this.db.query.employees.findFirst({
				where: and(
					eq(employees.iin, "000000000000"),
					eq(employees.legalEntityId, legalEntityId),
				),
			});

			if (existing) {
				console.log(`💡 Default employee already exists for legal entity ${legalEntityId}, skipping...`);
				return null;
			}

			// Format date as YYYY-MM-DD for the date field
			const dateString = registrationDate.toISOString().split("T")[0];

			// Create default employee
			const [newEmployee] = await this.db
				.insert(employees)
				.values({
					legalEntityId,
					fullName: "Физическое лицо",
					role: "исполнитель физические лица",
					iin: "000000000000",
					salary: 0,
					address: "Не указано",
					dateOfBirth: dateString,
					socialStatus: "резидент РК",
					residency: "резидент",
					udosId: "000000000",
					udosDateGiven: dateString,
					udosWhoGives: "Не указано",
				})
				.returning();

			console.log(`✅ Created default employee for legal entity ${legalEntityId}: ${newEmployee.id}`);
			return newEmployee;
		} catch (error) {
			console.error(`❌ Error creating default employee for legal entity ${legalEntityId}:`, error);
			throw error;
		}
	}

	/**
	 * Create default partner for a legal entity
	 * Checks for existing partner with BIN "000000000000" before creating
	 * @param legalEntityId - The legal entity ID
	 * @returns Created partner or null if already exists
	 */
	private async createDefaultPartner(legalEntityId: string): Promise<any | null> {
		try {
			// Check if default partner already exists for this legal entity
			const existing = await this.db.query.partners.findFirst({
				where: and(
					eq(partners.bin, "000000000000"),
					eq(partners.legalEntityId, legalEntityId),
				),
			});

			if (existing) {
				console.log(`💡 Default partner already exists for legal entity ${legalEntityId}, skipping...`);
				return null;
			}

			// Create default partner
			const [newPartner] = await this.db
				.insert(partners)
				.values({
					legalEntityId,
					bin: "000000000000",
					name: "Физическое лицо",
					address: "Не указано",
					executerName: "Физическое лицо",
					executerRole: "исполнитель физические лица",
				})
				.returning();

			console.log(`✅ Created default partner for legal entity ${legalEntityId}: ${newPartner.id}`);
			return newPartner;
		} catch (error) {
			console.error(`❌ Error creating default partner for legal entity ${legalEntityId}:`, error);
			throw error;
		}
	}
}
