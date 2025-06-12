import { z } from "zod";

export const doverennostItemSchema = z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.number().positive("Quantity must be positive"),
    unit: z.string().min(1, "Unit is required"),
    price: z.number().positive("Price must be positive"),
});

export const kazakhDoverennostInputSchema = z.object({
    // Main actors
    organizationLegalEntityId: z
        .string()
        .uuid("Invalid organization legal entity ID"),
    supplierLegalEntityId: z.string().uuid("Invalid supplier legal entity ID"),
    employeeId: z.string().uuid("Invalid employee ID for PoA holder"),

    // Signatories
    directorEmployeeId: z.string().uuid("Invalid director ID").optional(),
    bookkeeperEmployeeId: z.string().uuid("Invalid bookkeeper ID").optional(),

    // Document details
    doverennostNumber: z.string().min(1, "Document number is required"),
    issueDate: z.date(),
    validUntil: z.date(),

    // Context
    contractReference: z.string().min(1, "Contract reference is required"),
    items: z
        .array(doverennostItemSchema)
        .min(1, "At least one item is required"),

    // Employee's document details
    passportNumber: z.string().min(1, "Passport number is required"),
    passportIssueDate: z.date(),
    passportIssuer: z.string().default("МВД РК"),

    // Optional fields
    contactPhone: z.string().optional(),
});

export type KazakhDoverennostInput = z.infer<
    typeof kazakhDoverennostInputSchema
>;
export type DoverennostItem = z.infer<typeof doverennostItemSchema>; 