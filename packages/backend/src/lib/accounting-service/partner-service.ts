import {
    type Database,
    binRegistry,
    partners,
    eq,
    and,
} from "@accounting-kz/db";

export interface PartnerSearchResult {
    id: string;
    bin: string;
    name: string;
    address: string;
    executerName: string;
    executerRole: string;
    isExisting: boolean;
}

export class PartnerService {
    constructor(private db: Database) { }

    /**
     * Find or create a partner by BIN for a legal entity
     */
    async findOrCreatePartnerByBin(
        bin: string,
        legalEntityId: string
    ): Promise<PartnerSearchResult> {
        // First, check if partner already exists for this legal entity
        const existingPartner = await this.db.query.partners.findFirst({
            where: and(
                eq(partners.bin, bin),
                eq(partners.legalEntityId, legalEntityId)
            ),
        });

        if (existingPartner) {
            return {
                id: existingPartner.id,
                bin: existingPartner.bin,
                name: existingPartner.name,
                address: existingPartner.address,
                executerName: existingPartner.executerName,
                executerRole: existingPartner.executerRole,
                isExisting: true,
            };
        }

        // If not exists, lookup in BIN registry
        const binRegistryEntry = await this.db.query.binRegistry.findFirst({
            where: eq(binRegistry.bin, bin),
        });

        if (!binRegistryEntry) {
            throw new Error(`BIN ${bin} not found in registry`);
        }

        // Create new partner from BIN registry data
        const [newPartner] = await this.db
            .insert(partners)
            .values({
                legalEntityId,
                bin: binRegistryEntry.bin,
                name: binRegistryEntry.fullNameRu || binRegistryEntry.fullNameKz || "Unknown Company",
                address: binRegistryEntry.legalAddress || "Address not available",
                executerName: binRegistryEntry.directorName || "Director not specified",
                executerRole: "Director",
            })
            .returning();

        return {
            id: newPartner.id,
            bin: newPartner.bin,
            name: newPartner.name,
            address: newPartner.address,
            executerName: newPartner.executerName,
            executerRole: newPartner.executerRole,
            isExisting: false,
        };
    }

    /**
     * Get partner by ID for a legal entity
     */
    async getPartnerById(partnerId: string, legalEntityId: string) {
        return await this.db.query.partners.findFirst({
            where: and(
                eq(partners.id, partnerId),
                eq(partners.legalEntityId, legalEntityId)
            ),
        });
    }

    /**
     * Get all partners for a legal entity
     */
    async getPartnersByLegalEntity(legalEntityId: string) {
        return await this.db.query.partners.findMany({
            where: eq(partners.legalEntityId, legalEntityId),
            orderBy: (partners, { asc }) => [asc(partners.name)],
        });
    }

    /**
     * Search partners by name or BIN
     */
    async searchPartners(query: string, legalEntityId: string) {
        // This is a simplified search - in production you might want to use full-text search
        return await this.db.query.partners.findMany({
            where: and(
                eq(partners.legalEntityId, legalEntityId),
                // Note: This would require a more sophisticated search in production
                // For now, we'll search by exact BIN match or name contains
            ),
        });
    }

    /**
     * Update partner information
     */
    async updatePartner(
        partnerId: string,
        legalEntityId: string,
        data: {
            name?: string;
            address?: string;
            executerName?: string;
            executerRole?: string;
        }
    ) {
        const [updatedPartner] = await this.db
            .update(partners)
            .set(data)
            .where(and(
                eq(partners.id, partnerId),
                eq(partners.legalEntityId, legalEntityId)
            ))
            .returning();

        return updatedPartner;
    }
} 