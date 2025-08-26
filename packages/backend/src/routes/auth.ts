import { Hono } from "hono";
import type { HonoEnv } from "../env";
import {
	users,
	profile,
	legalEntities,
	onboardingStatus,
	banks,
	employees,
	eq,
} from "@accounting-kz/db";
import { describeRoute } from "hono-openapi";
import { z } from "zod";
import { validator } from "hono-openapi/zod";
import { AccountingSeedService } from "../lib/accounting-service/seed-service";

const router = new Hono<HonoEnv>();

const BankSchema = z.object({
	name: z.string().min(1).describe("Bank name"),
	bik: z.string().min(1).describe("Bank BIK"),
	account: z.string().min(1).describe("Bank account number"),
});

const EmployeeSchema = z.object({
	fullName: z.string().min(1).describe("Employee full name"),
	pfp: z.string().optional().describe("Employee profile picture URL"),
	role: z.string().min(1).describe("Employee role"),
	address: z.string().min(1).describe("Employee address"),
	iin: z.string().min(12).max(12).describe("Employee IIN"),
	dateOfBirth: z.string().describe("Employee date of birth"),
	residency: z.string().min(1).describe("Employee residency"),
	salary: z.number().describe("Employee salary"),
	socialStatus: z.string().min(1).describe("Employee social status"),
	udosId: z.string().min(1).describe("Employee UDOS ID"),
	udosDateGiven: z.string().describe("Date when UDOS was given"),
	udosWhoGives: z.string().min(1).describe("Who gave the UDOS"),
});

const OnboardingStatusSchema = z.object({
	userId: z.string().uuid().describe("User ID"),
	isComplete: z.boolean().describe("Whether onboarding is complete"),
	currentStep: z
		.enum(["profile", "company", "banks", "employees", "completed"])
		.describe("Current onboarding step"),
	completedAt: z.string().nullable().describe("When onboarding was completed"),
	createdAt: z.string().describe("When onboarding status was created"),
	updatedAt: z.string().describe("When onboarding status was last updated"),
});

const OnboardingDataSchema = z.object({
	name: z.string().min(1).describe("User's full name"),
	image: z.string().optional().describe("User's profile picture URL"),
	legalEntity: z.object({
		name: z.string().min(1).describe("Legal entity name"),
		image: z.string().optional().describe("Legal entity logo URL"),
		type: z.string().min(1).describe("Legal entity type"),
		address: z.string().min(1).describe("Legal entity address"),
		phone: z.string().min(1).describe("Legal entity phone number"),
		oked: z.string().min(1).describe("OKED code"),
		bin: z.string().length(12).describe("BIN number"),
		registrationDate: z.string().describe("Registration date"),
		ugd: z.string().min(1).describe("UGD code"),
	}),
	banks: z
		.array(BankSchema)
		.optional()
		.default([])
		.describe("Optional list of bank accounts"),
	employees: z
		.array(EmployeeSchema)
		.optional()
		.default([])
		.describe("Optional list of employees"),
});

router.get(
	"/profile/:userId",
	describeRoute({
		description: "Get user profile information by user ID (name, image, email)",
		responses: {
			200: {
				description: "Successfully retrieved user profile",
			},
			400: {
				description: "Missing userId",
			},
			404: {
				description: "Profile not found",
			},
		},
	}),
	async (c) => {
		const userId = c.req.param("userId");
		if (!userId) {
			return c.json({ error: "User ID is required" }, 400);
		}

		try {
			// Fetch the profile
			const userProfile = await c.env.db.query.profile.findFirst({
				where: eq(profile.id, userId),
			});

			if (!userProfile) {
				return c.json({ error: "Profile not found" }, 404);
			}

			// Return only name, image, and email
			const { name, image, email } = userProfile;
			return c.json({ name, image, email });
		} catch (error) {
			console.error("Error fetching profile:", error);
			return c.json({ error: "Internal server error" }, 500);
		}
	},
);

// Route definitions
router.get("/onboarding/status/:userId", async (c) => {
	const userId = c.req.param("userId");
	if (!userId) {
		return c.json({ error: "User ID is required" }, 400);
	}

	try {
		const status = await c.env.db.query.onboardingStatus.findFirst({
			where: eq(onboardingStatus.userId, userId),
		});

		if (!status) {
			// Create initial onboarding status if it doesn't exist
			const [newStatus] = await c.env.db
				.insert(onboardingStatus)
				.values({
					userId,
					isComplete: false,
					currentStep: "profile",
				})
				.returning();

			return c.json(newStatus);
		}

		return c.json(status);
	} catch (error) {
		console.error("Error checking onboarding status:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

router.post(
	"/onboarding/:userId",
	describeRoute({
		description: "Submit onboarding data",
	}),
	async (c) => {
		try {
			const data = await c.req.json();
			const userId = c.req.param("userId");

			// Validate request body
			const validatedData = OnboardingDataSchema.parse(data);
			const firstData = await c.env.db.query.legalEntities.findFirst({
				where: eq(legalEntities.bin, validatedData.legalEntity.bin),
			});
			if (firstData != null) {
				return c.json({ error: "Company already created" }, 409);
			}


			const newLegalEntity = await c.env.db.transaction(async (tx) => {
				// Update profile with name and image
				await tx
					.update(profile)
					.set({
						name: validatedData.name,
						image: validatedData.image,
					})
					.where(eq(profile.id, userId));

				// Create legal entity
				const [legalEntity] = await tx
					.insert(legalEntities)
					.values({
						profileId: userId,
						name: validatedData.legalEntity.name,
						image: validatedData.legalEntity.image,
						type: validatedData.legalEntity.type,
						address: validatedData.legalEntity.address,
						phone: validatedData.legalEntity.phone,
						oked: validatedData.legalEntity.oked,
						bin: validatedData.legalEntity.bin,
						registrationDate: new Date(
							validatedData.legalEntity.registrationDate,
						),
						ugd: validatedData.legalEntity.ugd,
					})
					.returning();

				// Create banks if provided
				if (validatedData.banks && validatedData.banks.length > 0) {
					await tx.insert(banks).values(
						validatedData.banks.map((bank) => ({
							legalEntityId: legalEntity.id,
							name: bank.name,
							bik: bank.bik,
							account: bank.account,
						})),
					);
				}

				// Create employees if provided
				if (validatedData.employees && validatedData.employees.length > 0) {
					await tx.insert(employees).values(
						validatedData.employees.map((employee) => ({
							legalEntityId: legalEntity.id,
							fullName: employee.fullName,
							residency: employee.residency,
							salary: employee.salary,
							socialStatus: employee.socialStatus,
							pfp: employee.pfp,
							role: employee.role,
							address: employee.address,
							iin: employee.iin,
							dateOfBirth: new Date(employee.dateOfBirth).toISOString(),
							udosId: employee.udosId,
							udosDateGiven: new Date(employee.udosDateGiven).toISOString(),
							udosWhoGives: employee.udosWhoGives,
						})),
					);
				}

				// Update onboarding status
				await tx
					.update(onboardingStatus)
					.set({
						isComplete: true,
						currentStep: "completed",
						completedAt: new Date(),
					})
					.where(eq(onboardingStatus.userId, userId));

				return legalEntity;
			});

			// Get updated profile with relations
			const updatedProfile = await c.env.db.query.profile.findFirst({
				where: eq(profile.id, userId),
				with: {
					legalEntities: true,
				},
			});

			// Automatically seed accounting accounts for the new legal entity
			try {
				console.log(`🌱 Seeding accounting accounts for new legal entity: ${newLegalEntity.id}`);
				const seedService = new AccountingSeedService(c.env.db);
				await seedService.seedDatabase(newLegalEntity.id, userId);
				console.log(`✅ Successfully seeded accounts for legal entity: ${newLegalEntity.id}`);
			} catch (seedError) {
				console.error(`❌ Error seeding accounts for legal entity ${newLegalEntity.id}:`, seedError);
				// Note: We don't fail the legal entity creation if seeding fails
				// This allows the user to continue and seed manually later if needed
			}


			return c.json({
				profile: updatedProfile,
			});
		} catch (error) {
			console.error("Error in onboarding:", error);
			if (error instanceof z.ZodError) {
				return c.json({ error: error.errors[0].message }, 400);
			}
			return c.json({ error: "Internal server error" }, 500);
		}
	},
);

export default router;
