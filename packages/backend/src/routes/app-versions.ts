import { Hono } from "hono";
import type { HonoEnv } from "../env";
import {
    eq,
    appVersionsZodSchema,
    appVersions,
} from "@accounting-kz/db";
import { describeRoute } from "hono-openapi";
import { z } from "zod";
import "zod-openapi/extend";

export const appVersionsRouter = new Hono<HonoEnv>();

appVersionsRouter.get("/ios", describeRoute({
    description: "Get last ios version",
    tags: ["IOS VERSION"],
    responses: {
        200: {
            description: "List of deals",
            content: {
                "application/json": {
                    schema: z.array(appVersionsZodSchema),
                },
            },
        }
    },
}),
    async (c) => {
        const version = c.env.db.query.appVersions.findFirst({
            where: eq(appVersions.type, 'IOS')
        })
        return c.json(version, 201);
    }
);


appVersionsRouter.get("/android", describeRoute({
    description: "Get last android version",
    tags: ["IOS VERSION"],
    responses: {
        200: {
            description: "List of deals",
            content: {
                "application/json": {
                    schema: z.array(appVersionsZodSchema),
                },
            },
        }
    },
}),
    async (c) => {
        const version = c.env.db.query.appVersions.findFirst({
            where: eq(appVersions.type, 'ANDROID')
        })
        return c.json(version, 201);
    }
);
