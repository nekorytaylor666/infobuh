import { Hono } from "hono";
import type { HonoEnv } from "../env";
import {
	employeeInsertSchema,
	employees,
	employeeZodSchema,
	eq,
} from "@accounting-kz/db";
import { describeRoute } from "hono-openapi";
import { z } from "zod";
import "zod-openapi/extend";
import { resolver, validator as zValidator } from "hono-openapi/zod";
const router = new Hono<HonoEnv>();

// Get all employees for a legal entity
router.get(
	"/:legalEntityId",
	describeRoute({
		description: "Get all employees for a legal entity",
		tags: ["Employees"],
		responses: {
			200: {
				description: "List of employees",
				content: {
					"application/json": {
						schema: resolver(z.array(employeeZodSchema)),
					},
				},
			},
			500: {
				description: "Internal server error",
			},
		},
	}),
	async (c) => {
		try {
			const legalEntityId = c.req.param("legalEntityId");
			const employeesList = await c.env.db.query.employees.findMany({
				where: eq(employees.legalEntityId, legalEntityId as string),
			});
			return c.json(employeesList);
		} catch (error) {
			console.error("Error fetching employees:", error);
			return c.json({ error: "Failed to fetch employees" }, 500);
		}
	},
);

// Get single employee
router.get(
	"/:legalEntityId/:id",
	describeRoute({
		description: "Get a single employee by ID",
		tags: ["Employees"],
		responses: {
			200: {
				description: "Employee found",
				content: {
					"application/json": {
						schema: resolver(employeeZodSchema),
					},
				},
			},
			404: {
				description: "Employee not found",
			},
			500: {
				description: "Internal server error",
			},
		},
	}),
	async (c) => {
		try {
			const id = c.req.param("id");
			const employee = await c.env.db.query.employees.findFirst({
				where: eq(employees.id, id),
			});
			console.log(employee);

			if (!employee) {
				return c.json({ error: "Employee not found" }, 404);
			}

			return c.json(employee);
		} catch (error) {
			console.error("Error fetching employee:", error);
			return c.json({ error: "Failed to fetch employee" }, 500);
		}
	},
);

// Create employee
router.post(
	"/:legalEntityId",
	describeRoute({
		description: "Create a new employee",
		tags: ["Employees"],
		responses: {
			201: {
				description: "Employee created",
				content: {
					"application/json": {
						schema: resolver(employeeZodSchema),
					},
				},
			},
			400: {
				description: "Invalid input",
			},
			500: {
				description: "Internal server error",
			},
		},
	}),
	zValidator("json", employeeInsertSchema),
	async (c) => {
		try {
			const legalEntityId = c.req.param("legalEntityId") as string;
			const data = await c.req.json();
			const validatedData = employeeInsertSchema.parse(data);

			const [newEmployee] = await c.env.db
				.insert(employees)
				.values({
					...validatedData,
					legalEntityId: legalEntityId,
				})
				.returning();

			return c.json(newEmployee, 201);
		} catch (error) {
			console.error("Error creating employee:", error);
			if (error instanceof z.ZodError) {
				return c.json({ error: error.errors }, 400);
			}
			return c.json({ error: "Failed to create employee" }, 500);
		}
	},
);

// Update employee
router.put(
	"/:legalEntityId/:id",
	describeRoute({
		description: "Update an employee",
		tags: ["Employees"],
		responses: {
			200: {
				description: "Employee updated",
				content: {
					"application/json": {
						schema: resolver(employeeZodSchema),
					},
				},
			},
		},
	}),
	zValidator("json", employeeZodSchema.partial()),
	async (c) => {
		try {
			const id = c.req.param("id");
			const data = await c.req.json();
			const validatedData = employeeZodSchema.partial().parse(data);

			const [updatedEmployee] = await c.env.db
				.update(employees)
				.set({
					...validatedData,
					updatedAt: new Date(),
					...(validatedData.dateOfBirth && {
						dateOfBirth: new Date(validatedData.dateOfBirth).toISOString(),
					}),
					...(validatedData.udosDateGiven && {
						udosDateGiven: new Date(validatedData.udosDateGiven).toISOString(),
					}),
				})
				.where(eq(employees.id, id))
				.returning();

			if (!updatedEmployee) {
				return c.json({ error: "Employee not found" }, 404);
			}

			return c.json(updatedEmployee);
		} catch (error) {
			console.error("Error updating employee:", error);
			if (error instanceof z.ZodError) {
				return c.json({ error: error.errors }, 400);
			}
			return c.json({ error: "Failed to update employee" }, 500);
		}
	},
);

// Delete employee
router.delete(
	"/:legalEntityId/:id",
	describeRoute({
		description: "Delete an employee",
		tags: ["Employees"],
		responses: {
			200: {
				description: "Employee deleted",
				content: {
					"application/json": {
						schema: resolver(employeeZodSchema),
					},
				},
			},
			404: {
				description: "Employee not found",
			},
			500: {
				description: "Internal server error",
			},
		},
	}),
	async (c) => {
		try {
			const id = c.req.param("id");
			const [deletedEmployee] = await c.env.db
				.delete(employees)
				.where(eq(employees.id, id))
				.returning();

			if (!deletedEmployee) {
				return c.json({ error: "Employee not found" }, 404);
			}

			return c.json(deletedEmployee);
		} catch (error) {
			console.error("Error deleting employee:", error);
			return c.json({ error: "Failed to delete employee" }, 500);
		}
	},
);

export default router;
