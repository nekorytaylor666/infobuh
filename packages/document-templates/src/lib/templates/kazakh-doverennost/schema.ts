import { z } from "zod";

export const doverennostItemSchema = z.object({
    name: z.string().min(1, "Name is required"),
    quantity: z.number().positive("Quantity must be positive"),
    unit: z.string().min(1, "Unit is required"),
    price: z.number().positive("Price must be positive"),
});

export const bankSchema = z.object({
    name: z.string().optional(),
    account: z.string().optional(),
    bik: z.string().optional(),
});

export const kazakhDoverennostInputSchema = z.object({
    // from user prompt and service
    orgName: z.string(),
    orgAddress: z.string().optional(),
    orgBin: z.string(),
    buyerName: z.string(), // supplierName
    buyerBin: z.string(), // supplierBin
    schetNaOplatu: z.string(), // contractReference
    orgPersonName: z.string().optional().nullable(), // directorName
    orgPersonRole: z.string().optional(), // directorRole
    bookkeeperName: z.string().optional().nullable(),
    phone: z.string().optional(),
    selectedBank: bankSchema.optional(),
    employeeName: z.string(),
    employeeRole: z.string(),
    employeeIin: z.string().optional().nullable(),
    employeeDocNumber: z.string(),
    employeeDocNumberDate: z.date(),
    employeeWhoGives: z.string(), // passportIssuer
    dateUntil: z.date(), // validUntil
    items: z.array(doverennostItemSchema).min(1, "At least one item is required"),
    idx: z.string(), // doverennostNumber
    issueDate: z.date(),
});

export type KazakhDoverennostInput = z.infer<
    typeof kazakhDoverennostInputSchema
>;
export type DoverennostItem = z.infer<typeof doverennostItemSchema>; 